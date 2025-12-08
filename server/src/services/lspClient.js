/**
 * Language Server Protocol (LSP) Client
 * Provides real code completion and suggestions through LSP
 */

import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-jsonrpc/node.js'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---- LSP server configurations ---------------------------------------------

/**
 * type: 'stdio'  – реальный LSP по stdio
 *       'custom' – наш кастомный интеллект без реального LSP
 *       'monaco' – полагаемся на Monaco (можно выключить и тоже дать LSP)
 */
const LSP_SERVERS = {
  java: {
    type: 'stdio',
    command: 'java',
    // Находим launcher jar файл динамически
    getArgs: async () => {
      const jdtlsPath = 'C:\\Users\\KSEONYT\\Downloads\\jdt-language-server-1.9.0-202203031534'
      const pluginsPath = path.join(jdtlsPath, 'plugins')
      
      // Ищем launcher jar файл
      let launcherJar = null
      try {
        const files = await fs.readdir(pluginsPath)
        launcherJar = files.find(f => f.startsWith('org.eclipse.equinox.launcher_') && f.endsWith('.jar'))
      } catch (err) {
        console.error('[LSP:java] Failed to find launcher jar:', err)
        return null
      }
      
      if (!launcherJar) {
        console.error('[LSP:java] Launcher jar not found in plugins directory')
        return null
      }
      
      // Создаем уникальный workspace для каждого процесса, чтобы избежать конфликтов
      const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7)
      const dataDir = path.join(os.tmpdir(), `jdtls-workspace-${uniqueId}`)
      
      // Создаем data директорию если её нет
      try {
        await fs.mkdir(dataDir, { recursive: true })
      } catch (err) {
        console.warn('[LSP:java] Failed to create data directory:', err)
      }
      
      return [
        '-Declipse.application=org.eclipse.jdt.ls.core.id1',
        '-Dosgi.bundles.defaultStartLevel=4',
        '-Declipse.product=org.eclipse.jdt.ls.core.product',
        '-Dlog.level=WARN', // Уменьшаем уровень логирования
        '-Dosgi.checkConfiguration=true',
        '-Dosgi.sharedConfiguration.area.readOnly=true',
        '-Dosgi.sharedConfiguration.area=' + path.join(jdtlsPath, 'config_win'),
        '-Xmx1G',
        '-XX:+UseG1GC',
        '-XX:+UseStringDeduplication',
        '--add-modules=ALL-SYSTEM',
        '--add-opens', 'java.base/java.util=ALL-UNNAMED',
        '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
        '-jar',
        path.join(pluginsPath, launcherJar),
        '-configuration',
        path.join(jdtlsPath, 'config_win'),
        '-data',
        dataDir,
      ]
    },
    rootUri: null,
  },
  python: {
    type: 'stdio',
    command: 'pyright-langserver',
    args: ['--stdio'],
    rootUri: null,
  },
  javascript: {
    type: 'stdio',
    command: 'typescript-language-server',
    args: ['--stdio'],
    rootUri: null,
  },
  typescript: {
    type: 'stdio',
    command: 'typescript-language-server',
    args: ['--stdio'],
    rootUri: null,
  },
}

// Cache for LSP connections: language -> { process, connection, initPromise, isReady }
const lspConnections = new Map()

// ---- Utility: create & get LSP connection ----------------------------------

function getRootUri(config) {
  if (config.rootUri) return config.rootUri
  // По умолчанию – рабочая директория сервера
  const cwd = process.cwd()
  const uri = 'file://' + (os.platform() === 'win32'
    ? '/' + cwd.replace(/\\/g, '/')
    : cwd)
  return uri
}

async function createLspConnection(language) {
  const config = LSP_SERVERS[language]
  if (!config || config.type !== 'stdio') return null

  const { command } = config
  
  // Получаем аргументы (может быть функция для динамического получения)
  let args = []
  if (typeof config.getArgs === 'function') {
    args = await config.getArgs()
    if (!args) {
      console.error(`[LSP:${language}] Failed to get args, falling back to custom implementation`)
      return null
    }
  } else {
    args = config.args || []
  }

  // Для Windows используем shell для поиска команд в PATH
  const spawnOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
    shell: os.platform() === 'win32',
  }

  console.log(`[LSP:${language}] Starting: ${command} ${args.join(' ')}`)

  const child = spawn(command, args, spawnOptions)

  child.on('error', (err) => {
    console.error(`[LSP:${language}] Failed to start:`, err.message)
    console.warn(`[LSP:${language}] Falling back to custom implementation`)
    lspConnections.delete(language)
  })

  child.on('exit', (code, signal) => {
    console.warn(`[LSP:${language}] exited with code=${code}, signal=${signal}`)
    lspConnections.delete(language)
  })

  child.stdout.on('data', data => {
    // Логируем для отладки
    console.log(`[LSP:${language} STDOUT] ${data.toString().substring(0, 200)}`)
  })

  child.stderr.on('data', data => {
    // Логируем для отладки
    const errorMsg = data.toString()
    console.warn(`[LSP:${language} STDERR] ${errorMsg}`)
    // Если видим ошибку о том, что процесс завершился, это может быть проблема с запуском
    if (errorMsg.includes('Error') || errorMsg.includes('Exception') || errorMsg.includes('Cannot')) {
      console.error(`[LSP:${language}] Server error detected, will fallback to custom implementation`)
    }
  })

  const reader = new StreamMessageReader(child.stdout)
  const writer = new StreamMessageWriter(child.stdin)
  const connection = createMessageConnection(reader, writer)

  connection.onError(err => {
    console.error(`[LSP:${language}] connection error:`, err)
  })

        connection.onClose(() => {
          console.warn(`[LSP:${language}] connection closed`)
          lspConnections.delete(language)
          // Очищаем процесс при закрытии
          try {
            if (child && !child.killed) {
              child.kill('SIGTERM')
            }
          } catch (err) {
            // Игнорируем ошибки при закрытии
          }
        })

  connection.listen()

  const rootUri = getRootUri(config)

  const initializeParams = {
    processId: process.pid,
    rootUri,
    capabilities: {
      textDocument: {
        synchronization: {
          didSave: true,
        },
        completion: {
          completionItem: {
            snippetSupport: true,
          },
        },
        hover: {},
        signatureHelp: {},
      },
      workspace: {},
    },
    workspaceFolders: null,
  }

  const initPromise = connection
    .sendRequest('initialize', initializeParams)
    .then(result => {
      connection.sendNotification('initialized', {})
      return result
    })
    .catch(err => {
      console.error(`[LSP:${language}] initialize failed:`, err)
      try {
        child.kill()
      } catch (_) {}
      throw err
    })

  const entry = {
    process: child,
    connection,
    initPromise,
    isReady: false,
  }

  lspConnections.set(language, entry)

  initPromise
    .then((result) => {
      if (result) {
        entry.isReady = true
        console.log(`[LSP:${language}] Ready for requests`)
      } else {
        // Инициализация не удалась, удаляем из кеша
        lspConnections.delete(language)
      }
    })
    .catch((err) => {
      console.error(`[LSP:${language}] Init promise error:`, err)
      lspConnections.delete(language)
    })

  return entry
}

async function getLspConnection(language) {
  let entry = lspConnections.get(language)
  if (!entry) {
    entry = await createLspConnection(language)
  }
  if (!entry) return null

  try {
    const result = await entry.initPromise
    if (!result) {
      // Инициализация не удалась
      return null
    }
    return entry.connection
  } catch (err) {
    console.error(`[LSP:${language}] init error:`, err)
    return null
  }
}

// ---- Your old custom completions (fallback) --------------------------------

/**
 * Get intelligent completions for Java based on context
 */
async function getJavaCompletionsFallback(code, position) {
  const { line, character } = position
  const lines = code.split('\n')
  const currentLine = lines[line] || ''
  const beforeCursor = currentLine.substring(0, character)

  const completions = []

  // Extract context - what's before the cursor
  const contextMatch = beforeCursor.match(/(\w+(?:\.\w*)?)$/)
  const prefix = contextMatch ? contextMatch[1] : ''

  // System class completions
  if (prefix === 'System' || prefix.startsWith('System.')) {
    completions.push(
      {
        label: 'System.out',
        kind: 7, // Property
        detail: 'PrintStream',
        insertText: 'System.out',
        documentation: 'Standard output stream',
      },
      {
        label: 'System.in',
        kind: 7,
        detail: 'InputStream',
        insertText: 'System.in',
        documentation: 'Standard input stream',
      },
      {
        label: 'System.err',
        kind: 7,
        detail: 'PrintStream',
        insertText: 'System.err',
        documentation: 'Standard error stream',
      },
    )
  }

  // System.out completions
  if (prefix === 'System.out' || prefix.startsWith('System.out.')) {
    completions.push(
      {
        label: 'System.out.println',
        kind: 2, // Method
        detail: 'void println(String x)',
        insertText: 'System.out.println($1)',
        insertTextRules: 4, // Insert as snippet
        documentation: 'Prints a string and then terminate the line',
      },
      {
        label: 'System.out.print',
        kind: 2,
        detail: 'void print(String x)',
        insertText: 'System.out.print($1)',
        insertTextRules: 4,
        documentation: 'Prints a string without terminating the line',
      },
      {
        label: 'System.out.printf',
        kind: 2,
        detail: 'PrintStream printf(String format, Object... args)',
        insertText: 'System.out.printf("$1", $2)',
        insertTextRules: 4,
        documentation: 'Prints a formatted string',
      },
    )
  }

  // String class completions
  if (prefix === 'String' || prefix.startsWith('String.')) {
    completions.push(
      {
        label: 'String.valueOf',
        kind: 2,
        detail: 'static String valueOf(Object obj)',
        insertText: 'String.valueOf($1)',
        insertTextRules: 4,
        documentation: 'Returns the string representation of the Object argument',
      },
      {
        label: 'String.format',
        kind: 2,
        detail: 'static String format(String format, Object... args)',
        insertText: 'String.format("$1", $2)',
        insertTextRules: 4,
        documentation: 'Returns a formatted string using the specified format string',
      },
    )
  }

  // Array/List completions
  if (prefix.endsWith('List') || prefix.endsWith('ArrayList') || prefix.endsWith('List.')) {
    completions.push(
      {
        label: 'List.add',
        kind: 2,
        detail: 'boolean add(E e)',
        insertText: '.add($1)',
        insertTextRules: 4,
        documentation: 'Appends the specified element to the end of this list',
      },
      {
        label: 'List.get',
        kind: 2,
        detail: 'E get(int index)',
        insertText: '.get($1)',
        insertTextRules: 4,
        documentation: 'Returns the element at the specified position in this list',
      },
      {
        label: 'List.size',
        kind: 2,
        detail: 'int size()',
        insertText: '.size()',
        insertTextRules: 4,
        documentation: 'Returns the number of elements in this list',
      },
    )
  }

  // Scanner completions
  if (prefix === 'Scanner' || prefix.startsWith('Scanner.')) {
    completions.push(
      {
        label: 'Scanner.next',
        kind: 2,
        detail: 'String next()',
        insertText: '.next()',
        insertTextRules: 4,
        documentation: 'Finds and returns the next complete token from this scanner',
      },
      {
        label: 'Scanner.nextInt',
        kind: 2,
        detail: 'int nextInt()',
        insertText: '.nextInt()',
        insertTextRules: 4,
        documentation: 'Scans the next token of the input as an int',
      },
      {
        label: 'Scanner.nextLine',
        kind: 2,
        detail: 'String nextLine()',
        insertText: '.nextLine()',
        insertTextRules: 4,
        documentation: 'Advances this scanner past the current line',
      },
    )
  }

  // Common Java keywords and types
  if (!prefix.includes('.')) {
    // Add Java keywords
    const keywords = [
      'public',
      'private',
      'protected',
      'static',
      'final',
      'abstract',
      'class',
      'interface',
      'extends',
      'implements',
      'void',
      'int',
      'double',
      'float',
      'boolean',
      'char',
      'byte',
      'short',
      'long',
      'String',
      'new',
      'return',
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'break',
      'continue',
      'try',
      'catch',
      'finally',
      'throw',
      'throws',
      'import',
      'package',
    ]

    keywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(prefix.toLowerCase())) {
        completions.push({
          label: keyword,
          kind: 14, // Keyword
          detail: 'Java keyword',
          insertText: keyword,
        })
      }
    })

    // Add common types
    const types = [
      'String',
      'Integer',
      'Double',
      'Float',
      'Boolean',
      'Character',
      'Byte',
      'Short',
      'Long',
      'Object',
      'List',
      'ArrayList',
      'Map',
      'HashMap',
      'Set',
      'HashSet',
      'Scanner',
    ]
    types.forEach(type => {
      if (type.toLowerCase().startsWith(prefix.toLowerCase())) {
        completions.push({
          label: type,
          kind: 7, // Class
          detail: 'Java type',
          insertText: type,
        })
      }
    })
  }

  // Filter by prefix
  const filtered = prefix
    ? completions.filter(c => c.label.toLowerCase().startsWith(prefix.toLowerCase()))
    : completions

  return filtered
}

/**
 * Get intelligent completions for Python based on context
 */
async function getPythonCompletionsFallback(code, position) {
  const { line, character } = position
  const lines = code.split('\n')
  const currentLine = lines[line] || ''
  const beforeCursor = currentLine.substring(0, character)

  const completions = []
  const contextMatch = beforeCursor.match(/(\w+(?:\.\w*)?)$/)
  const prefix = contextMatch ? contextMatch[1] : ''

  // Built-in functions
  const builtins = [
    'print',
    'input',
    'len',
    'range',
    'str',
    'int',
    'float',
    'bool',
    'list',
    'dict',
    'set',
    'tuple',
    'type',
    'isinstance',
    'enumerate',
    'zip',
    'map',
    'filter',
    'sorted',
    'reversed',
  ]
  builtins.forEach(builtin => {
    if (builtin.toLowerCase().startsWith(prefix.toLowerCase())) {
      completions.push({
        label: builtin,
        kind: 3, // Function
        detail: 'Built-in function',
        insertText: builtin,
      })
    }
  })

  // String methods
  if (prefix.includes('.')) {
    const parts = prefix.split('.')
    const obj = parts[0]
    const methodPrefix = parts[1] || ''

    if (methodPrefix) {
      const stringMethods = [
        'upper',
        'lower',
        'strip',
        'split',
        'join',
        'replace',
        'find',
        'index',
        'count',
        'startswith',
        'endswith',
        'format',
      ]
      stringMethods.forEach(method => {
        if (method.toLowerCase().startsWith(methodPrefix.toLowerCase())) {
          completions.push({
            label: `${obj}.${method}`,
            kind: 2, // Method
            detail: `str.${method}()`,
            insertText: `${obj}.${method}($1)`,
            insertTextRules: 4,
          })
        }
      })
    }
  }

  // Keywords
  if (!prefix.includes('.')) {
    const keywords = [
      'def',
      'class',
      'if',
      'elif',
      'else',
      'for',
      'while',
      'try',
      'except',
      'finally',
      'with',
      'import',
      'from',
      'return',
      'yield',
      'pass',
      'break',
      'continue',
      'lambda',
      'and',
      'or',
      'not',
      'in',
      'is',
      'None',
      'True',
      'False',
    ]
    keywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(prefix.toLowerCase())) {
        completions.push({
          label: keyword,
          kind: 14, // Keyword
          detail: 'Python keyword',
          insertText: keyword,
        })
      }
    })
  }

  return prefix
    ? completions.filter(c => c.label.toLowerCase().startsWith(prefix.toLowerCase()))
    : completions
}

// ---- Generic helpers for LSP textDocument requests ------------------------

let docCounter = 0

function createInMemoryUri(language) {
  const id = ++docCounter
  // Для Java используем file:// URI, для других языков - inmemory://
  if (language === 'java') {
    const tempDir = path.join(os.tmpdir(), 'jdtls-temp')
    const fileName = `temp_${Date.now()}_${id}.java`
    return `file:///${tempDir.replace(/\\/g, '/')}/${fileName}`
  }
  return `inmemory://${language}/${Date.now()}-${id}`
}

/**
 * Выполнить LSP-запрос с временным документом
 */
async function withTempDocument(language, code, languageId, fn) {
  const connection = await getLspConnection(language)
  if (!connection) return null

  const uri = createInMemoryUri(language)
  
  // Для Java убеждаемся, что код имеет правильную структуру
  let processedCode = code
  if (language === 'java') {
    // Если код не содержит class, добавляем обертку
    if (!code.trim().match(/^\s*(public\s+)?class\s+\w+/m)) {
      // Пытаемся найти имя класса из кода или используем Solution
      const classMatch = code.match(/class\s+(\w+)/)
      const className = classMatch ? classMatch[1] : 'Solution'
      
      // Если нет package, добавляем минимальную структуру
      if (!code.includes('package ') && !code.includes('public class')) {
        processedCode = `public class ${className} {\n${code}\n}`
      }
    }
    
    // Создаем временный файл для Java (jdtls работает лучше с реальными файлами)
    const tempDir = path.join(os.tmpdir(), 'jdtls-temp')
    try {
      await fs.mkdir(tempDir, { recursive: true })
      const filePath = uri.replace('file:///', '').replace(/\//g, path.sep)
      await fs.writeFile(filePath, processedCode, 'utf8')
    } catch (err) {
      console.warn('[LSP:java] Failed to create temp file:', err)
    }
  }
  
  const textDocument = {
    uri,
    languageId: languageId || language,
    version: 1,
    text: processedCode,
  }

  // didOpen
  connection.sendNotification('textDocument/didOpen', { textDocument })
  
  // Для Java даем серверу время обработать документ
  if (language === 'java') {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  try {
    const result = await fn(connection, uri)
    return result
  } finally {
    // закроем документ, чтобы не засорять сервер
    connection.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    })
    
    // Удаляем временный файл для Java
    if (language === 'java') {
      try {
        const filePath = uri.replace('file:///', '').replace(/\//g, path.sep)
        await fs.unlink(filePath).catch(() => {})
      } catch (err) {
        // Игнорируем ошибки удаления
      }
    }
  }
}

// ---- Public API: completions / hover / signatureHelp ----------------------

/**
 * Get completions for a language at a specific position
 */
export async function getCompletions(code, language, position) {
  const { line, character } = position

  // 1) Пытаемся через реальный LSP, если он сконфигурен
  try {
    const config = LSP_SERVERS[language]
    if (config && config.type === 'stdio') {
      const lspResult = await withTempDocument(
        language,
        code,
        language,
        async (connection, uri) => {
          const params = {
            textDocument: { uri },
            position: { line, character },
          }
          const result = await connection.sendRequest(
            'textDocument/completion',
            params,
          )
          // LSP может вернуть { items, isIncomplete } или просто массив
          if (!result) return []
          const items = Array.isArray(result) ? result : (result.items || [])
          
          // Преобразуем LSP completion items в наш формат
          return items.map(item => {
            // Обрабатываем textEdit если есть (более точный способ указать замену)
            let insertText = item.insertText || item.label
            let range = null
            
            if (item.textEdit) {
              // textEdit содержит range и newText
              insertText = item.textEdit.newText
              // Преобразуем LSP range (0-based) в наш формат (1-based для Monaco будет обработан на клиенте)
              range = {
                startLine: item.textEdit.range.start.line + 1,
                startCharacter: item.textEdit.range.start.character + 1,
                endLine: item.textEdit.range.end.line + 1,
                endCharacter: item.textEdit.range.end.character + 1,
              }
            }
            
            // Обрабатываем documentation (может быть string или MarkupContent)
            let documentation = null
            if (item.documentation) {
              if (typeof item.documentation === 'string') {
                documentation = item.documentation
              } else if (item.documentation.value) {
                documentation = item.documentation.value
              }
            }
            
            return {
              label: item.label,
              kind: item.kind || 1, // LSP CompletionItemKind
              detail: item.detail || null,
              documentation: documentation,
              insertText: insertText,
              insertTextRules: item.insertTextMode === 2 ? 4 : undefined, // Snippet support
              range: range, // Будет использован на клиенте для точной замены
              sortText: item.sortText,
              filterText: item.filterText,
            }
          })
        },
      )

      if (lspResult && Array.isArray(lspResult)) {
        return lspResult
      }
    }
  } catch (error) {
    console.error('LSP completion error:', error)
  }

  // 2) Фолбэк: твой кастомный интеллект / Monaco
  try {
    switch (language) {
      case 'java':
        return await getJavaCompletionsFallback(code, { line, character })

      case 'python':
        return await getPythonCompletionsFallback(code, { line, character })

      case 'javascript':
      case 'typescript':
        // Если хочешь, можешь тоже сделать кастомный фолбэк
        return []

      default:
        return []
    }
  } catch (error) {
    console.error('Fallback completion error:', error)
    return []
  }
}

/**
 * Get hover information for a symbol at a specific position
 */
export async function getHover(code, language, position) {
  const { line, character } = position

  try {
    const config = LSP_SERVERS[language]
    if (!config || config.type !== 'stdio') return null

    const hover = await withTempDocument(
      language,
      code,
      language,
      async (connection, uri) => {
        const params = {
          textDocument: { uri },
          position: { line, character },
        }
        const result = await connection.sendRequest(
          'textDocument/hover',
          params,
        )
        return result || null
      },
    )

    return hover
  } catch (error) {
    console.error('LSP hover error:', error)
    return null
  }
}

/**
 * Get signature help for a function call
 */
export async function getSignatureHelp(code, language, position) {
  const { line, character } = position

  try {
    const config = LSP_SERVERS[language]
    if (!config || config.type !== 'stdio') return null

    const sig = await withTempDocument(
      language,
      code,
      language,
      async (connection, uri) => {
        const params = {
          textDocument: { uri },
          position: { line, character },
        }
        const result = await connection.sendRequest(
          'textDocument/signatureHelp',
          params,
        )
        return result || null
      },
    )

    return sig
  } catch (error) {
    console.error('LSP signatureHelp error:', error)
    return null
  }
}

export default {
  getCompletions,
  getHover,
  getSignatureHelp,
}
