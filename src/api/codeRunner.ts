const API_URL = 'http://localhost:3001/api'

export interface LintError {
  line: number
  column?: number
  message: string
  severity: 'error' | 'warning'
}

export interface LintResult {
  errors: LintError[]
  warnings: LintError[]
}

export interface TestResult {
  input: string
  expected: string
  actual: string
  passed: boolean
  error?: string
  executionTime: number
}

export interface ExecutionResult {
  success: boolean
  stage: 'compile' | 'run' | 'test' | 'system'
  output?: string
  error?: string
  errors?: LintError[]
  executionTime?: number
  timedOut?: boolean
  testResults?: TestResult[]
  passedCount?: number
  totalCount?: number
}

export interface CompilerInfo {
  cmd: string
  available: boolean
  version?: string
}

// Lint code
export async function lintCode(code: string, language: string): Promise<LintResult> {
  try {
    const response = await fetch(`${API_URL}/lint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    })
    return await response.json()
  } catch (error) {
    console.error('Lint error:', error)
    return { errors: [], warnings: [] }
  }
}

// Execute code
export async function executeCode(
  code: string, 
  language: string, 
  input?: string,
  testCases?: { input: string; expected: string }[]
): Promise<ExecutionResult> {
  try {
    const response = await fetch(`${API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, input, testCases }),
    })
    return await response.json()
  } catch (error) {
    console.error('Execution error:', error)
    return {
      success: false,
      stage: 'system',
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    }
  }
}

// Check available compilers
export async function checkCompilers(): Promise<Record<string, CompilerInfo>> {
  try {
    const response = await fetch(`${API_URL}/check-compilers`)
    return await response.json()
  } catch (error) {
    console.error('Check compilers error:', error)
    return {}
  }
}

// Get supported languages
export async function getLanguages(): Promise<{ id: string; name: string; extension: string; hasCompiler: boolean }[]> {
  try {
    const response = await fetch(`${API_URL}/languages`)
    return await response.json()
  } catch (error) {
    console.error('Get languages error:', error)
    return []
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}

// Language mapping for file extensions
export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mapping: Record<string, string> = {
    java: 'java',
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    kt: 'kotlin',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
  }
  return mapping[ext || ''] || 'plaintext'
}

