import { exec } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Detect OS
const IS_WINDOWS = process.platform === 'win32'
const DOCKER_CMD = IS_WINDOWS ? 'docker.exe' : 'docker'

// Temp directory for code execution
const TEMP_DIR = join(__dirname, '../../temp')
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true })
}

// Docker image name
const DOCKER_IMAGE = 'code-sandbox:latest'

// Language configurations
const LANGUAGES = {
  java: {
    extension: '.java',
    compile: (filename) => `javac -encoding UTF-8 "${filename}"`,
    run: (classname) => `java ${classname}`,
    getClassName: (code) => {
      const match = code.match(/public\s+class\s+(\w+)/)
      return match ? match[1] : 'Main'
    },
    timeout: 50000,
    memoryLimit: '256m',
  },
  python: {
    extension: '.py',
    compile: null,
    run: (filename) => `python3 "${filename}"`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  javascript: {
    extension: '.js',
    compile: null,
    run: (filename) => `node "${filename}"`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  typescript: {
    extension: '.ts',
    compile: (filename) => `npx tsc "${filename}" --outDir .`,
    run: (filename) => `node "${filename.replace('.ts', '.js')}"`,
    timeout: 15000,
    memoryLimit: '256m',
  },
  cpp: {
    extension: '.cpp',
    compile: (filename) => `g++ "${filename}" -o program -std=c++17`,
    run: () => `./program`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  c: {
    extension: '.c',
    compile: (filename) => `gcc "${filename}" -o program`,
    run: () => `./program`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  go: {
    extension: '.go',
    compile: null,
    run: (filename) => `go run "${filename}"`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  rust: {
    extension: '.rs',
    compile: (filename) => `rustc "${filename}" -o program`,
    run: () => `./program`,
    timeout: 15000,
    memoryLimit: '256m',
  },
  kotlin: {
    extension: '.kt',
    compile: (filename) => `kotlinc "${filename}" -include-runtime -d program.jar`,
    run: () => `java -jar program.jar`,
    timeout: 30000,
    memoryLimit: '512m',
  },
  csharp: {
    extension: '.cs',
    compile: (filename) => `mcs "${filename}" -out:program.exe`,
    run: () => `mono program.exe`,
    timeout: 15000,
    memoryLimit: '256m',
  },
  php: {
    extension: '.php',
    compile: null,
    run: (filename) => `php "${filename}"`,
    timeout: 10000,
    memoryLimit: '256m',
  },
  ruby: {
    extension: '.rb',
    compile: null,
    run: (filename) => `ruby "${filename}"`,
    timeout: 10000,
    memoryLimit: '256m',
  },
}

// Check if Docker is available
async function checkDocker() {
  try {
    await execAsync(`${DOCKER_CMD} --version`)
    return true
  } catch (error) {
    return false
  }
}

// Build Docker image if not exists
async function ensureDockerImage() {
  try {
    // Check if image exists
    const { stdout } = await execAsync(`${DOCKER_CMD} images -q ${DOCKER_IMAGE}`)
    if (stdout.trim()) {
      return true
    }
    
    // Build image
    const dockerfilePath = join(__dirname, '../../docker/Dockerfile')
    const dockerContext = join(__dirname, '../../docker')
    
    console.log('Building Docker image...')
    await execAsync(`${DOCKER_CMD} build -t ${DOCKER_IMAGE} -f "${dockerfilePath}" "${dockerContext}"`)
    console.log('Docker image built successfully')
    return true
  } catch (error) {
    console.error('Failed to build Docker image:', error.message)
    return false
  }
}

// Execute command in Docker container
async function executeInDocker(command, timeout = 10000, memoryLimit = '256m') {
  const containerName = `code-run-${uuid()}`
  const startTime = Date.now()
  
  try {
    if (!command || command.trim() === '') {
      throw new Error('Command cannot be empty')
    }
    
    const timeoutSeconds = Math.ceil(timeout / 1000) + 2
    
    // Encode the entire command as base64 to avoid all quoting issues
    const commandBase64 = Buffer.from(command).toString('base64')
    
    // Build docker command - decode base64 and pipe to bash
    const decodeCmd = `echo ${commandBase64} | base64 -d | bash`
    
    const dockerArgs = [
      'run', '--rm',
      '--name', containerName,
      `--memory=${memoryLimit}`,
      '--cpus=1.0',
      '--network=none',
      '-w', '/tmp',
      '--security-opt', 'no-new-privileges:true',
      '--cap-drop=ALL',
      '--pids-limit=50',
      `--stop-timeout=${timeoutSeconds}`,
      DOCKER_IMAGE,
      'bash', '-c'
    ]
    
    // On Windows, wrap the command in quotes differently
    let dockerCmd
    if (IS_WINDOWS) {
      // Escape quotes in the command for Windows
      const escapedCmd = decodeCmd.replace(/"/g, '\\"')
      dockerCmd = `${DOCKER_CMD} ${dockerArgs.join(' ')} "${escapedCmd}"`
    } else {
      // Use single quotes on Unix
      dockerCmd = `${DOCKER_CMD} ${dockerArgs.join(' ')} '${decodeCmd}'`
    }
    
    const result = await Promise.race([
      execAsync(dockerCmd, { 
        timeout: timeout,
        maxBuffer: 1024 * 1024,
        encoding: 'utf8',
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ])
    
    const executionTime = Date.now() - startTime
    
    return {
      success: true,
      output: result.stdout || '',
      error: result.stderr || '',
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    let stdout = ''
    let stderr = error.message || ''
    
    try {
      const logs = await execAsync(`${DOCKER_CMD} logs ${containerName} 2>&1`)
      stdout = logs.stdout || logs.stderr || ''
    } catch (e) {
      // Container already removed
    }
    
    try {
      await execAsync(`${DOCKER_CMD} rm -f ${containerName} 2>&1`)
    } catch (e) {
      // Ignore
    }
    
    return {
      success: false,
      output: stdout,
      error: error.message.includes('Timeout') ? `Time Limit Exceeded (${timeout}ms)` : stderr,
      executionTime,
      timedOut: error.message.includes('Timeout'),
    }
  }
}

// Normalize output for comparison
function normalizeOutput(output) {
  if (!output) return ''
  return output
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/gm, '')
    .replace(/^\s+/gm, '')
}

// Wrap Java code with main method if needed
function wrapJavaCodeForTest(code, testInput) {
  if (code.includes('public static void main')) {
    return code
  }
  
  const classMatch = code.match(/public\s+class\s+(\w+)/)
  const className = classMatch ? classMatch[1] : 'Solution'
  
  const methodMatch = code.match(/public\s+static\s+(\w+)\s+(\w+)\s*\(([^)]*)\)/)
  
  if (!methodMatch) {
    return code.replace(
      /}\s*$/,
      `\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    )
  }
  
  const returnType = methodMatch[1]
  const methodName = methodMatch[2]
  const params = methodMatch[3]
  
  let mainMethod
  if (params.includes('int a') && params.includes('int b')) {
    mainMethod = `
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(${methodName}(a, b));
    }`
  } else if (params.includes('int n')) {
    mainMethod = `
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(${methodName}(n));
    }`
  } else if (params.includes('String')) {
    mainMethod = `
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(${methodName}(s));
    }`
  } else if (params.trim() === '') {
    mainMethod = `
    public static void main(String[] args) {
        ${returnType === 'void' ? methodName + '();' : 'System.out.println(' + methodName + '());'}
    }`
  } else {
    mainMethod = `
    public static void main(String[] args) {
        System.out.println("Test runner ready");
    }`
  }
  
  return code.replace(/}\s*$/, mainMethod + '\n}')
}

// Execute code in Docker sandbox
export async function executeCode(code, language, input = '', testCases = []) {
  const langConfig = LANGUAGES[language]
  if (!langConfig) {
    return { success: false, error: `Unsupported language: ${language}`, stage: 'system' }
  }

  const dockerAvailable = await checkDocker()
  if (!dockerAvailable) {
    return { 
      success: false, 
      error: 'Docker is not available. Please install Docker Desktop.',
      stage: 'system' 
    }
  }

  const imageReady = await ensureDockerImage()
  if (!imageReady) {
    return { 
      success: false, 
      error: 'Failed to build Docker image.',
      stage: 'system' 
    }
  }

  const sessionId = uuid()
  const sessionDir = join(TEMP_DIR, sessionId)
  
  try {
    mkdirSync(sessionDir, { recursive: true })

    let processedCode = code
    if (language === 'java' && testCases.length > 0) {
      processedCode = wrapJavaCodeForTest(code, testCases[0]?.input || '')
    }

    let filename
    if (language === 'java') {
      const className = langConfig.getClassName(processedCode)
      filename = `${className}${langConfig.extension}`
    } else {
      filename = `main${langConfig.extension}`
    }

    const filepath = join(sessionDir, filename)
    writeFileSync(filepath, processedCode, 'utf8')

    // Build script using heredoc
    function buildScript(codeContent, filename, inputData = '') {
      const delimiter = `EOF_${uuid().replace(/-/g, '_')}`
      const lines = []
      
      lines.push('cd /tmp')
      
      // Set UTF-8 encoding for languages that need it (Java, etc.)
      // Use C.UTF-8 which is more widely available in Docker containers
      if (language === 'java') {
        lines.push('export LC_ALL=C.UTF-8')
        lines.push('export LANG=C.UTF-8')
      }
      
      // Write code file using heredoc
      lines.push(`cat > "${filename}" << '${delimiter}'`)
      lines.push(codeContent)
      lines.push(delimiter)
      
      // Compile if needed
      if (langConfig.compile) {
        lines.push(langConfig.compile(filename))
      }
      
      // Run command
      const runCmd = language === 'java'
        ? langConfig.run(langConfig.getClassName(codeContent))
        : langConfig.run(filename)
      
      // Add input if provided
      if (inputData) {
        const inputDelimiter = `INPUT_${uuid().replace(/-/g, '_')}`
        lines.push(`cat << '${inputDelimiter}' | ${runCmd}`)
        lines.push(inputData)
        lines.push(inputDelimiter)
      } else {
        lines.push(runCmd)
      }
      
      return lines.join('\n')
    }

    // Run tests if provided
    if (testCases.length > 0) {
      const results = []
      
      for (const testCase of testCases) {
        // Ensure testCase has required fields
        const input = testCase.input || ''
        // Support both 'expected' and 'expected_output' fields
        const expected = testCase.expected || testCase.expected_output || ''
        
        const script = buildScript(processedCode, filename, input)
        const result = await executeInDocker(script, langConfig.timeout, langConfig.memoryLimit)
        
        // Get actual output, use error message if execution failed
        const actualOutput = result.success 
          ? (result.output || '').trim()
          : (result.error || 'Execution error')
        
        const passed = result.success && expected && 
          normalizeOutput(result.output) === normalizeOutput(expected)
        
        results.push({
          input: input,
          expected: expected,
          actual: actualOutput,
          passed,
          error: result.error || undefined,
          executionTime: result.executionTime,
        })
      }

      const allPassed = results.every(r => r.passed)
      const totalExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
      
      return {
        success: allPassed,
        stage: 'test',
        testResults: results,
        passedCount: results.filter(r => r.passed).length,
        totalCount: results.length,
        executionTime: totalExecutionTime,
      }
    }

    // Simple run without test cases
    const script = buildScript(processedCode, filename, input)
    const runResult = await executeInDocker(script, langConfig.timeout, langConfig.memoryLimit)
    
    return {
      success: runResult.success,
      stage: 'run',
      output: runResult.output,
      error: runResult.error,
      executionTime: runResult.executionTime,
      timedOut: runResult.timedOut || false,
    }

  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stage: 'system',
    }
  } finally {
    try {
      rmSync(sessionDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export default { executeCode, LANGUAGES }