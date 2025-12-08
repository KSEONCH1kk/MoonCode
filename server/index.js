import express from 'express'
import cors from 'cors'
import { spawn, exec } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Temp directory for code execution
const TEMP_DIR = join(__dirname, 'temp')
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true })
}

// Language configurations
const LANGUAGES = {
  java: {
    extension: '.java',
    compile: (dir, filename) => `javac "${join(dir, filename)}"`,
    run: (dir, classname) => `java -cp "${dir}" ${classname}`,
    getClassName: (code) => {
      const match = code.match(/public\s+class\s+(\w+)/)
      return match ? match[1] : 'Main'
    },
    timeout: 10000,
  },
  python: {
    extension: '.py',
    compile: null,
    run: (dir, filename) => `python "${join(dir, filename)}"`,
    timeout: 10000,
  },
  javascript: {
    extension: '.js',
    compile: null,
    run: (dir, filename) => `node "${join(dir, filename)}"`,
    timeout: 10000,
  },
  typescript: {
    extension: '.ts',
    compile: (dir, filename) => `npx tsc "${join(dir, filename)}" --outDir "${dir}"`,
    run: (dir, filename) => `node "${join(dir, filename.replace('.ts', '.js'))}"`,
    timeout: 15000,
  },
  cpp: {
    extension: '.cpp',
    compile: (dir, filename) => `g++ "${join(dir, filename)}" -o "${join(dir, 'program.exe')}"`,
    run: (dir) => `"${join(dir, 'program.exe')}"`,
    timeout: 10000,
  },
  c: {
    extension: '.c',
    compile: (dir, filename) => `gcc "${join(dir, filename)}" -o "${join(dir, 'program.exe')}"`,
    run: (dir) => `"${join(dir, 'program.exe')}"`,
    timeout: 10000,
  },
  go: {
    extension: '.go',
    compile: null,
    run: (dir, filename) => `go run "${join(dir, filename)}"`,
    timeout: 10000,
  },
  rust: {
    extension: '.rs',
    compile: (dir, filename) => `rustc "${join(dir, filename)}" -o "${join(dir, 'program.exe')}"`,
    run: (dir) => `"${join(dir, 'program.exe')}"`,
    timeout: 15000,
  },
  kotlin: {
    extension: '.kt',
    compile: (dir, filename) => `kotlinc "${join(dir, filename)}" -include-runtime -d "${join(dir, 'program.jar')}"`,
    run: (dir) => `java -jar "${join(dir, 'program.jar')}"`,
    timeout: 30000,
  },
  csharp: {
    extension: '.cs',
    compile: (dir, filename) => `csc "${join(dir, filename)}" -out:"${join(dir, 'program.exe')}"`,
    run: (dir) => `"${join(dir, 'program.exe')}"`,
    timeout: 15000,
  },
  php: {
    extension: '.php',
    compile: null,
    run: (dir, filename) => `php "${join(dir, filename)}"`,
    timeout: 10000,
  },
  ruby: {
    extension: '.rb',
    compile: null,
    run: (dir, filename) => `ruby "${join(dir, filename)}"`,
    timeout: 10000,
  },
}

// Execute command with timeout
function executeCommand(command, timeout = 10000, input = '') {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const child = exec(command, {
      timeout,
      maxBuffer: 1024 * 1024, // 1MB
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime
      
      if (error) {
        if (error.killed) {
          resolve({
            success: false,
            output: '',
            error: `Превышено время выполнения (${timeout}ms)`,
            executionTime,
            timedOut: true,
          })
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || error.message,
            executionTime,
          })
        }
      } else {
        resolve({
          success: true,
          output: stdout,
          error: stderr,
          executionTime,
        })
      }
    })

    // Send input if provided
    if (input && child.stdin) {
      child.stdin.write(input)
      child.stdin.end()
    }
  })
}

// Validate and lint code
function lintCode(code, language) {
  const errors = []
  const warnings = []
  const lines = code.split('\n')

  if (language === 'java') {
    // Check for class declaration
    if (!code.match(/class\s+\w+/)) {
      errors.push({ line: 1, message: 'Missing class declaration', severity: 'error' })
    }
    
    // Check for main method
    if (!code.match(/public\s+static\s+void\s+main/)) {
      warnings.push({ line: 1, message: 'No main method found', severity: 'warning' })
    }

    // Check for invalid method return types
    const methodMatches = code.matchAll(/public\s+static\s+(\w+)\s+(\w+)\s*\(/g)
    for (const match of methodMatches) {
      const returnType = match[1]
      const methodName = match[2]
      const validTypes = ['void', 'int', 'String', 'boolean', 'double', 'float', 'long', 'char', 'byte', 'short', 'Object', 'Integer', 'Boolean', 'Double', 'Float', 'Long', 'Character', 'Byte', 'Short', 'int[]', 'String[]']
      
      if (!validTypes.includes(returnType) && !returnType.match(/^[A-Z]/)) {
        const lineNum = code.substring(0, match.index).split('\n').length
        errors.push({ 
          line: lineNum, 
          column: match.index - code.lastIndexOf('\n', match.index),
          message: `Unknown type "${returnType}" for method "${methodName}"`, 
          severity: 'error' 
        })
      }
    }

    // Check brace balance
    let braceCount = 0
    lines.forEach((line, idx) => {
      for (const char of line) {
        if (char === '{') braceCount++
        if (char === '}') braceCount--
      }
    })
    if (braceCount !== 0) {
      errors.push({ 
        line: lines.length, 
        message: braceCount > 0 ? `Missing ${braceCount} closing brace(s)` : `Extra ${-braceCount} closing brace(s)`, 
        severity: 'error' 
      })
    }
  }

  if (language === 'python') {
    // Check for print without parentheses
    lines.forEach((line, idx) => {
      if (line.match(/\bprint\s+[^(]/)) {
        errors.push({ line: idx + 1, message: 'print is a function in Python 3, use print()', severity: 'error' })
      }
    })
  }

  if (language === 'javascript' || language === 'typescript') {
    // Check for var usage
    lines.forEach((line, idx) => {
      if (line.match(/\bvar\s+/)) {
        warnings.push({ line: idx + 1, message: 'Consider using "let" or "const" instead of "var"', severity: 'warning' })
      }
    })
  }

  return { errors, warnings }
}

// API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get supported languages
app.get('/api/languages', (req, res) => {
  const languages = Object.keys(LANGUAGES).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    extension: LANGUAGES[key].extension,
    hasCompiler: !!LANGUAGES[key].compile,
  }))
  res.json(languages)
})

// Lint code
app.post('/api/lint', (req, res) => {
  const { code, language } = req.body

  if (!code || !language) {
    return res.status(400).json({ error: 'Missing code or language' })
  }

  const result = lintCode(code, language)
  res.json(result)
})

// Execute code
app.post('/api/execute', async (req, res) => {
  const { code, language, input = '', testCases = [] } = req.body

  if (!code || !language) {
    return res.status(400).json({ error: 'Missing code or language' })
  }

  const langConfig = LANGUAGES[language]
  if (!langConfig) {
    return res.status(400).json({ error: `Unsupported language: ${language}` })
  }

  // Create unique temp directory
  const sessionId = uuidv4()
  const sessionDir = join(TEMP_DIR, sessionId)
  
  try {
    mkdirSync(sessionDir, { recursive: true })

    // Determine filename
    let filename
    if (language === 'java') {
      const className = langConfig.getClassName(code)
      filename = `${className}${langConfig.extension}`
    } else {
      filename = `main${langConfig.extension}`
    }

    // Write code to file
    const filepath = join(sessionDir, filename)
    writeFileSync(filepath, code, 'utf8')

    let compileResult = null
    let runResult = null

    // Compile if needed
    if (langConfig.compile) {
      const compileCmd = langConfig.compile(sessionDir, filename)
      console.log(`[COMPILE] ${compileCmd}`)
      
      compileResult = await executeCommand(compileCmd, langConfig.timeout)
      
      if (!compileResult.success) {
        // Parse compilation errors
        const errors = parseCompilerErrors(compileResult.error, language)
        
        return res.json({
          success: false,
          stage: 'compile',
          output: '',
          error: compileResult.error,
          errors,
          executionTime: compileResult.executionTime,
        })
      }
    }

    // Run tests if provided
    if (testCases.length > 0) {
      const results = []
      
      for (const testCase of testCases) {
        const runCmd = language === 'java' 
          ? langConfig.run(sessionDir, langConfig.getClassName(code))
          : langConfig.run(sessionDir, filename)
        
        console.log(`[RUN] ${runCmd} with input: ${testCase.input}`)
        
        // For languages that need input via stdin
        const result = await executeWithInput(runCmd, testCase.input, langConfig.timeout)
        
        const passed = result.success && 
          normalizeOutput(result.output) === normalizeOutput(testCase.expected)
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: result.output.trim(),
          passed,
          error: result.error,
          executionTime: result.executionTime,
        })
      }

      const allPassed = results.every(r => r.passed)
      
      return res.json({
        success: allPassed,
        stage: 'test',
        testResults: results,
        passedCount: results.filter(r => r.passed).length,
        totalCount: results.length,
      })
    }

    // Simple run without test cases
    const runCmd = language === 'java'
      ? langConfig.run(sessionDir, langConfig.getClassName(code))
      : langConfig.run(sessionDir, filename)
    
    console.log(`[RUN] ${runCmd}`)
    
    runResult = await executeWithInput(runCmd, input, langConfig.timeout)

    res.json({
      success: runResult.success,
      stage: 'run',
      output: runResult.output,
      error: runResult.error,
      executionTime: runResult.executionTime,
      timedOut: runResult.timedOut || false,
    })

  } catch (error) {
    console.error('Execution error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stage: 'system',
    })
  } finally {
    // Cleanup
    try {
      rmSync(sessionDir, { recursive: true, force: true })
    } catch (e) {
      console.error('Cleanup error:', e)
    }
  }
})

// Execute with stdin input
function executeWithInput(command, input, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const child = exec(command, {
      timeout,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime
      
      if (error) {
        if (error.killed) {
          resolve({
            success: false,
            output: stdout,
            error: `Time Limit Exceeded (${timeout}ms)`,
            executionTime,
            timedOut: true,
          })
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || error.message,
            executionTime,
          })
        }
      } else {
        resolve({
          success: true,
          output: stdout,
          error: stderr,
          executionTime,
        })
      }
    })

    if (input && child.stdin) {
      child.stdin.write(input)
      child.stdin.end()
    }
  })
}

// Parse compiler errors into structured format
function parseCompilerErrors(errorText, language) {
  const errors = []
  
  if (language === 'java') {
    // Java error format: filename.java:line: error: message
    const regex = /(\w+\.java):(\d+): error: (.+)/g
    let match
    while ((match = regex.exec(errorText)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        message: match[3],
        severity: 'error',
      })
    }
  } else if (language === 'cpp' || language === 'c') {
    // GCC error format: file:line:col: error: message
    const regex = /([^:]+):(\d+):(\d+): (error|warning): (.+)/g
    let match
    while ((match = regex.exec(errorText)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4],
        message: match[5],
      })
    }
  } else if (language === 'typescript') {
    // TypeScript error format: file(line,col): error TSxxxx: message
    const regex = /([^(]+)\((\d+),(\d+)\): error TS\d+: (.+)/g
    let match
    while ((match = regex.exec(errorText)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message: match[4],
        severity: 'error',
      })
    }
  }

  // If no structured errors found, return raw error
  if (errors.length === 0 && errorText) {
    errors.push({
      line: 1,
      message: errorText.trim(),
      severity: 'error',
    })
  }

  return errors
}

// Normalize output for comparison
function normalizeOutput(output) {
  return output
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/gm, '')
    .replace(/^\s+/gm, '')
}

// Check available compilers
app.get('/api/check-compilers', async (req, res) => {
  const compilers = {
    java: { cmd: 'javac -version', available: false },
    python: { cmd: 'python --version', available: false },
    node: { cmd: 'node --version', available: false },
    gcc: { cmd: 'gcc --version', available: false },
    gpp: { cmd: 'g++ --version', available: false },
    go: { cmd: 'go version', available: false },
    rust: { cmd: 'rustc --version', available: false },
    kotlin: { cmd: 'kotlinc -version', available: false },
  }

  for (const [name, info] of Object.entries(compilers)) {
    try {
      const result = await executeCommand(info.cmd, 5000)
      compilers[name].available = result.success
      compilers[name].version = result.output.trim().split('\n')[0]
    } catch (e) {
      compilers[name].available = false
    }
  }

  res.json(compilers)
})

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     🚀 MoonCode Code Runner Server             ║
║     Running on http://localhost:${PORT}          ║
╠════════════════════════════════════════════════╣
║  Endpoints:                                    ║
║  • GET  /health          - Health check        ║
║  • GET  /api/languages   - List languages      ║
║  • GET  /api/check-compilers - Check compilers ║
║  • POST /api/lint        - Lint code           ║
║  • POST /api/execute     - Execute code        ║
╚════════════════════════════════════════════════╝
  `)
})

