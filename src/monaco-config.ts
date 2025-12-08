import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

// Configure Monaco loader
loader.config({ monaco })

// Custom Java snippets and completions
export const javaCompletions = [
  { label: 'sout', insertText: 'System.out.println($1);', documentation: 'Print to console' },
  { label: 'main', insertText: 'public static void main(String[] args) {\n\t$1\n}', documentation: 'Main method' },
  { label: 'for', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$3\n}', documentation: 'For loop' },
  { label: 'foreach', insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t$4\n}', documentation: 'For-each loop' },
  { label: 'if', insertText: 'if (${1:condition}) {\n\t$2\n}', documentation: 'If statement' },
  { label: 'ifelse', insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$3\n}', documentation: 'If-else statement' },
  { label: 'while', insertText: 'while (${1:condition}) {\n\t$2\n}', documentation: 'While loop' },
  { label: 'class', insertText: 'public class ${1:ClassName} {\n\t$2\n}', documentation: 'Class declaration' },
  { label: 'method', insertText: 'public ${1:void} ${2:methodName}(${3:params}) {\n\t$4\n}', documentation: 'Method declaration' },
  { label: 'try', insertText: 'try {\n\t$1\n} catch (${2:Exception} ${3:e}) {\n\t$4\n}', documentation: 'Try-catch block' },
]

// Custom Python snippets
export const pythonCompletions = [
  { label: 'def', insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}', documentation: 'Function definition' },
  { label: 'class', insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}', documentation: 'Class definition' },
  { label: 'if', insertText: 'if ${1:condition}:\n\t${2:pass}', documentation: 'If statement' },
  { label: 'ifelse', insertText: 'if ${1:condition}:\n\t${2:pass}\nelse:\n\t${3:pass}', documentation: 'If-else statement' },
  { label: 'for', insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}', documentation: 'For loop' },
  { label: 'while', insertText: 'while ${1:condition}:\n\t${2:pass}', documentation: 'While loop' },
  { label: 'try', insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}', documentation: 'Try-except block' },
  { label: 'with', insertText: 'with ${1:expression} as ${2:variable}:\n\t${3:pass}', documentation: 'With statement' },
  { label: 'lambda', insertText: 'lambda ${1:x}: ${2:x}', documentation: 'Lambda expression' },
  { label: 'list', insertText: '[${1:item} for ${1:item} in ${2:iterable}]', documentation: 'List comprehension' },
]

// Custom JavaScript/TypeScript snippets
export const jsCompletions = [
  { label: 'log', insertText: 'console.log($1);', documentation: 'Console log' },
  { label: 'fn', insertText: 'function ${1:name}(${2:params}) {\n\t$3\n}', documentation: 'Function declaration' },
  { label: 'afn', insertText: 'const ${1:name} = (${2:params}) => {\n\t$3\n};', documentation: 'Arrow function' },
  { label: 'if', insertText: 'if (${1:condition}) {\n\t$2\n}', documentation: 'If statement' },
  { label: 'for', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$3\n}', documentation: 'For loop' },
  { label: 'foreach', insertText: '${1:array}.forEach((${2:item}) => {\n\t$3\n});', documentation: 'forEach loop' },
  { label: 'map', insertText: '${1:array}.map((${2:item}) => $3)', documentation: 'Map array' },
  { label: 'filter', insertText: '${1:array}.filter((${2:item}) => $3)', documentation: 'Filter array' },
  { label: 'reduce', insertText: '${1:array}.reduce((${2:acc}, ${3:item}) => $4, ${5:initial})', documentation: 'Reduce array' },
  { label: 'async', insertText: 'async function ${1:name}(${2:params}) {\n\t$3\n}', documentation: 'Async function' },
  { label: 'await', insertText: 'await ${1:promise}', documentation: 'Await expression' },
  { label: 'try', insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\t$3\n}', documentation: 'Try-catch block' },
  { label: 'class', insertText: 'class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t$3\n\t}\n}', documentation: 'Class declaration' },
  { label: 'import', insertText: "import { $2 } from '$1';", documentation: 'Import statement' },
  { label: 'export', insertText: 'export const ${1:name} = $2;', documentation: 'Export statement' },
]

// C++ snippets
export const cppCompletions = [
  { label: 'cout', insertText: 'std::cout << $1 << std::endl;', documentation: 'Print to console' },
  { label: 'cin', insertText: 'std::cin >> $1;', documentation: 'Read from console' },
  { label: 'main', insertText: 'int main() {\n\t$1\n\treturn 0;\n}', documentation: 'Main function' },
  { label: 'for', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$3\n}', documentation: 'For loop' },
  { label: 'while', insertText: 'while (${1:condition}) {\n\t$2\n}', documentation: 'While loop' },
  { label: 'if', insertText: 'if (${1:condition}) {\n\t$2\n}', documentation: 'If statement' },
  { label: 'class', insertText: 'class ${1:ClassName} {\npublic:\n\t$2\nprivate:\n\t$3\n};', documentation: 'Class declaration' },
  { label: 'struct', insertText: 'struct ${1:StructName} {\n\t$2\n};', documentation: 'Struct declaration' },
  { label: 'vector', insertText: 'std::vector<${1:int}> ${2:vec};', documentation: 'Vector declaration' },
  { label: 'include', insertText: '#include <${1:iostream}>', documentation: 'Include header' },
]

// Go snippets
export const goCompletions = [
  { label: 'fmt', insertText: 'fmt.Println($1)', documentation: 'Print to console' },
  { label: 'func', insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t$4\n}', documentation: 'Function declaration' },
  { label: 'main', insertText: 'func main() {\n\t$1\n}', documentation: 'Main function' },
  { label: 'for', insertText: 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t$3\n}', documentation: 'For loop' },
  { label: 'forr', insertText: 'for ${1:i}, ${2:v} := range ${3:slice} {\n\t$4\n}', documentation: 'For range loop' },
  { label: 'if', insertText: 'if ${1:condition} {\n\t$2\n}', documentation: 'If statement' },
  { label: 'iferr', insertText: 'if err != nil {\n\t$1\n}', documentation: 'Error check' },
  { label: 'struct', insertText: 'type ${1:Name} struct {\n\t$2\n}', documentation: 'Struct declaration' },
  { label: 'interface', insertText: 'type ${1:Name} interface {\n\t$2\n}', documentation: 'Interface declaration' },
  { label: 'defer', insertText: 'defer ${1:func()}', documentation: 'Defer statement' },
  { label: 'go', insertText: 'go ${1:func()}', documentation: 'Goroutine' },
  { label: 'chan', insertText: 'make(chan ${1:int})', documentation: 'Create channel' },
]

// Rust snippets
export const rustCompletions = [
  { label: 'println', insertText: 'println!("$1");', documentation: 'Print to console' },
  { label: 'fn', insertText: 'fn ${1:name}(${2:params}) -> ${3:ReturnType} {\n\t$4\n}', documentation: 'Function declaration' },
  { label: 'main', insertText: 'fn main() {\n\t$1\n}', documentation: 'Main function' },
  { label: 'let', insertText: 'let ${1:name} = $2;', documentation: 'Variable binding' },
  { label: 'letmut', insertText: 'let mut ${1:name} = $2;', documentation: 'Mutable variable' },
  { label: 'for', insertText: 'for ${1:item} in ${2:iter} {\n\t$3\n}', documentation: 'For loop' },
  { label: 'while', insertText: 'while ${1:condition} {\n\t$2\n}', documentation: 'While loop' },
  { label: 'if', insertText: 'if ${1:condition} {\n\t$2\n}', documentation: 'If statement' },
  { label: 'match', insertText: 'match ${1:value} {\n\t$2 => $3,\n\t_ => $4,\n}', documentation: 'Match expression' },
  { label: 'struct', insertText: 'struct ${1:Name} {\n\t$2\n}', documentation: 'Struct declaration' },
  { label: 'impl', insertText: 'impl ${1:Name} {\n\t$2\n}', documentation: 'Implementation block' },
  { label: 'enum', insertText: 'enum ${1:Name} {\n\t$2,\n}', documentation: 'Enum declaration' },
]

// Language configurations
export const languageConfigs: Record<string, { 
  id: string
  extensions: string[]
  aliases: string[]
}> = {
  java: { id: 'java', extensions: ['.java'], aliases: ['Java', 'java'] },
  python: { id: 'python', extensions: ['.py', '.pyw'], aliases: ['Python', 'python', 'py'] },
  javascript: { id: 'javascript', extensions: ['.js', '.jsx', '.mjs'], aliases: ['JavaScript', 'javascript', 'js'] },
  typescript: { id: 'typescript', extensions: ['.ts', '.tsx'], aliases: ['TypeScript', 'typescript', 'ts'] },
  cpp: { id: 'cpp', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'], aliases: ['C++', 'cpp', 'c++'] },
  c: { id: 'c', extensions: ['.c', '.h'], aliases: ['C', 'c'] },
  csharp: { id: 'csharp', extensions: ['.cs'], aliases: ['C#', 'csharp', 'cs'] },
  go: { id: 'go', extensions: ['.go'], aliases: ['Go', 'go', 'golang'] },
  rust: { id: 'rust', extensions: ['.rs'], aliases: ['Rust', 'rust'] },
  ruby: { id: 'ruby', extensions: ['.rb'], aliases: ['Ruby', 'ruby'] },
  php: { id: 'php', extensions: ['.php'], aliases: ['PHP', 'php'] },
  swift: { id: 'swift', extensions: ['.swift'], aliases: ['Swift', 'swift'] },
  kotlin: { id: 'kotlin', extensions: ['.kt', '.kts'], aliases: ['Kotlin', 'kotlin'] },
  scala: { id: 'scala', extensions: ['.scala'], aliases: ['Scala', 'scala'] },
  sql: { id: 'sql', extensions: ['.sql'], aliases: ['SQL', 'sql'] },
  html: { id: 'html', extensions: ['.html', '.htm'], aliases: ['HTML', 'html'] },
  css: { id: 'css', extensions: ['.css'], aliases: ['CSS', 'css'] },
  scss: { id: 'scss', extensions: ['.scss'], aliases: ['SCSS', 'scss'] },
  json: { id: 'json', extensions: ['.json'], aliases: ['JSON', 'json'] },
  xml: { id: 'xml', extensions: ['.xml'], aliases: ['XML', 'xml'] },
  yaml: { id: 'yaml', extensions: ['.yaml', '.yml'], aliases: ['YAML', 'yaml'] },
  markdown: { id: 'markdown', extensions: ['.md', '.markdown'], aliases: ['Markdown', 'markdown', 'md'] },
  shell: { id: 'shell', extensions: ['.sh', '.bash'], aliases: ['Shell', 'bash', 'sh'] },
  dockerfile: { id: 'dockerfile', extensions: ['Dockerfile'], aliases: ['Dockerfile', 'dockerfile'] },
  makefile: { id: 'makefile', extensions: ['Makefile', 'makefile'], aliases: ['Makefile', 'makefile'] },
}

// Get language from file extension
export function getLanguageFromFilename(filename: string): string {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  
  for (const [, config] of Object.entries(languageConfigs)) {
    if (config.extensions.includes(ext) || config.extensions.includes(filename)) {
      return config.id
    }
  }
  
  return 'plaintext'
}

// Initialize Monaco with custom settings
export function initializeMonaco() {
  loader.init().then((monacoInstance) => {
    // Register custom themes
    monacoInstance.editor.defineTheme('mooncode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'class', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D2D',
        'editorCursor.foreground': '#AEAFAD',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
      }
    })

    // Set default theme
    monacoInstance.editor.setTheme('mooncode-dark')
  })
}

export default loader

