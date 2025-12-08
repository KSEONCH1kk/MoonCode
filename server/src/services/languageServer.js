/**
 * Language Server Service
 * Provides syntax analysis and error detection for multiple languages
 */

// Java syntax rules and patterns
const javaRules = {
  // Keywords that must be followed by specific patterns
  keywords: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'void', 'int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long', 'String', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package'],
  
  // Valid primitive types
  primitiveTypes: ['int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long', 'void'],
  
  // Common class types
  classTypes: ['String', 'Integer', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Long', 'Object', 'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet'],
}

// Analyze Java code
function analyzeJava(code) {
  const errors = []
  const warnings = []
  const lines = code.split('\n')
  
  let braceStack = []
  let parenStack = []
  let bracketStack = []
  let inString = false
  let inChar = false
  let inComment = false
  let inMultiLineComment = false
  
  // Track class and method context
  let hasClass = false
  let className = null
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]
    const trimmedLine = line.trim()
    const lineNumber = lineNum + 1
    
    // Skip empty lines
    if (!trimmedLine) continue
    
    // Handle comments
    if (trimmedLine.startsWith('//')) continue
    if (trimmedLine.startsWith('/*')) {
      inMultiLineComment = true
      if (trimmedLine.includes('*/')) inMultiLineComment = false
      continue
    }
    if (inMultiLineComment) {
      if (trimmedLine.includes('*/')) inMultiLineComment = false
      continue
    }
    
    // Check for class declaration
    const classMatch = trimmedLine.match(/(?:public\s+)?class\s+(\w+)/)
    if (classMatch) {
      hasClass = true
      className = classMatch[1]
    }
    
    // Check method declarations
    const methodMatch = trimmedLine.match(/(?:public|private|protected)?\s*(?:static\s+)?(\w+)\s+(\w+)\s*\(/)
    if (methodMatch) {
      const returnType = methodMatch[1]
      const methodName = methodMatch[2]
      
      // Check if return type is valid
      const validTypes = [...javaRules.primitiveTypes, ...javaRules.classTypes]
      if (!validTypes.includes(returnType) && !returnType.match(/^[A-Z]\w*(\[\])?$/)) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(returnType) + 1,
          endColumn: line.indexOf(returnType) + returnType.length + 1,
          message: `Unknown type '${returnType}'. Did you mean 'void'?`,
          severity: 'error',
          code: 'E001',
        })
      }
      
      // Check main method signature
      if (methodName === 'main' && trimmedLine.includes('static')) {
        if (!trimmedLine.includes('void')) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: "Main method should return 'void'",
            severity: 'error',
            code: 'E002',
          })
        }
        if (!trimmedLine.includes('String[] args') && !trimmedLine.includes('String args[]')) {
          warnings.push({
            line: lineNumber,
            column: 1,
            message: "Main method should have 'String[] args' parameter",
            severity: 'warning',
            code: 'W001',
          })
        }
      }
    }
    
    // Check for missing semicolons
    if (trimmedLine &&
        !trimmedLine.endsWith('{') &&
        !trimmedLine.endsWith('}') &&
        !trimmedLine.endsWith(';') &&
        !trimmedLine.endsWith(':') &&
        !trimmedLine.startsWith('import') &&
        !trimmedLine.startsWith('package') &&
        !trimmedLine.startsWith('@') &&
        !trimmedLine.includes('class ') &&
        !trimmedLine.includes('interface ') &&
        !trimmedLine.includes('if ') &&
        !trimmedLine.includes('if(') &&
        !trimmedLine.includes('else') &&
        !trimmedLine.includes('for ') &&
        !trimmedLine.includes('for(') &&
        !trimmedLine.includes('while ') &&
        !trimmedLine.includes('while(') &&
        !trimmedLine.includes('try') &&
        !trimmedLine.includes('catch') &&
        !trimmedLine.includes('finally')) {
      
      // Check if it looks like a statement
      if (trimmedLine.includes('=') || 
          trimmedLine.includes('return ') ||
          trimmedLine.match(/\w+\.\w+\([^)]*\)\s*$/) ||
          trimmedLine.match(/\w+\([^)]*\)\s*$/)) {
        
        // Don't flag if it's a method declaration
        if (!trimmedLine.match(/(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\(/)) {
          errors.push({
            line: lineNumber,
            column: line.length,
            message: "Missing semicolon",
            severity: 'error',
            code: 'E003',
          })
        }
      }
    }
    
    // Track braces
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '{') braceStack.push({ line: lineNumber, col: i + 1 })
      if (char === '}') {
        if (braceStack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: "Unexpected closing brace '}'",
            severity: 'error',
            code: 'E004',
          })
        } else {
          braceStack.pop()
        }
      }
      
      if (char === '(') parenStack.push({ line: lineNumber, col: i + 1 })
      if (char === ')') {
        if (parenStack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: "Unexpected closing parenthesis ')'",
            severity: 'error',
            code: 'E005',
          })
        } else {
          parenStack.pop()
        }
      }
      
      if (char === '[') bracketStack.push({ line: lineNumber, col: i + 1 })
      if (char === ']') {
        if (bracketStack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: "Unexpected closing bracket ']'",
            severity: 'error',
            code: 'E006',
          })
        } else {
          bracketStack.pop()
        }
      }
    }
    
    // Check for common issues
    if (trimmedLine.match(/==\s*(true|false)|true\s*==|false\s*==/)) {
      warnings.push({
        line: lineNumber,
        column: 1,
        message: "Unnecessary comparison with boolean literal",
        severity: 'warning',
        code: 'W002',
      })
    }
    
    if (trimmedLine.includes('System.out.println()')) {
      warnings.push({
        line: lineNumber,
        column: line.indexOf('println') + 1,
        message: "Empty println() - did you forget to add a message?",
        severity: 'warning',
        code: 'W003',
      })
    }
  }
  
  // Check for unclosed braces
  if (braceStack.length > 0) {
    for (const brace of braceStack) {
      errors.push({
        line: brace.line,
        column: brace.col,
        message: "Unclosed brace '{'",
        severity: 'error',
        code: 'E007',
      })
    }
  }
  
  // Check for class
  if (!hasClass && code.length > 0) {
    warnings.push({
      line: 1,
      column: 1,
      message: "No class declaration found",
      severity: 'warning',
      code: 'W004',
    })
  }
  
  return { errors, warnings }
}

// Analyze Python code
function analyzePython(code) {
  const errors = []
  const warnings = []
  const lines = code.split('\n')
  
  let indentStack = [0]
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]
    const trimmedLine = line.trim()
    const lineNumber = lineNum + 1
    
    if (!trimmedLine || trimmedLine.startsWith('#')) continue
    
    // Check indentation
    const indent = line.search(/\S/)
    if (indent > 0 && indent % 4 !== 0) {
      warnings.push({
        line: lineNumber,
        column: 1,
        message: "Inconsistent indentation (expected multiple of 4 spaces)",
        severity: 'warning',
        code: 'W101',
      })
    }
    
    // Check for print without parentheses (Python 2 style)
    if (trimmedLine.match(/^print\s+[^(]/)) {
      errors.push({
        line: lineNumber,
        column: line.indexOf('print') + 1,
        message: "print is a function in Python 3, use print()",
        severity: 'error',
        code: 'E101',
      })
    }
    
    // Check for missing colons after if/for/while/def/class
    if (trimmedLine.match(/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/) && 
        !trimmedLine.endsWith(':') && !trimmedLine.endsWith(':\\')) {
      errors.push({
        line: lineNumber,
        column: line.length,
        message: "Missing colon at end of statement",
        severity: 'error',
        code: 'E102',
      })
    }
    
    // Check for = in comparison (common mistake)
    if (trimmedLine.match(/if\s+\w+\s*=\s*\w+/) && !trimmedLine.includes('==')) {
      warnings.push({
        line: lineNumber,
        column: 1,
        message: "Did you mean '==' instead of '=' for comparison?",
        severity: 'warning',
        code: 'W102',
      })
    }
  }
  
  return { errors, warnings }
}

// Analyze JavaScript code
function analyzeJavaScript(code) {
  const errors = []
  const warnings = []
  const lines = code.split('\n')
  
  let braceStack = []
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]
    const trimmedLine = line.trim()
    const lineNumber = lineNum + 1
    
    if (!trimmedLine || trimmedLine.startsWith('//')) continue
    
    // Check for var usage
    if (trimmedLine.match(/\bvar\s+/)) {
      warnings.push({
        line: lineNumber,
        column: line.indexOf('var') + 1,
        message: "Use 'let' or 'const' instead of 'var'",
        severity: 'warning',
        code: 'W201',
      })
    }
    
    // Check for == instead of ===
    if (trimmedLine.match(/[^=!<>]==[^=]/)) {
      warnings.push({
        line: lineNumber,
        column: line.indexOf('==') + 1,
        message: "Use '===' for strict equality comparison",
        severity: 'warning',
        code: 'W202',
      })
    }
    
    // Check for != instead of !==
    if (trimmedLine.match(/!=[^=]/)) {
      warnings.push({
        line: lineNumber,
        column: line.indexOf('!=') + 1,
        message: "Use '!==' for strict inequality comparison",
        severity: 'warning',
        code: 'W203',
      })
    }
    
    // Track braces
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '{') braceStack.push({ line: lineNumber, col: i + 1 })
      if (char === '}') {
        if (braceStack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: "Unexpected closing brace '}'",
            severity: 'error',
            code: 'E201',
          })
        } else {
          braceStack.pop()
        }
      }
    }
  }
  
  if (braceStack.length > 0) {
    for (const brace of braceStack) {
      errors.push({
        line: brace.line,
        column: brace.col,
        message: "Unclosed brace '{'",
        severity: 'error',
        code: 'E202',
      })
    }
  }
  
  return { errors, warnings }
}

// Analyze C/C++ code
function analyzeCpp(code) {
  const errors = []
  const warnings = []
  const lines = code.split('\n')
  
  let braceStack = []
  let hasMain = false
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]
    const trimmedLine = line.trim()
    const lineNumber = lineNum + 1
    
    if (!trimmedLine || trimmedLine.startsWith('//')) continue
    
    // Check for main function
    if (trimmedLine.includes('int main') || trimmedLine.includes('void main')) {
      hasMain = true
      if (trimmedLine.includes('void main')) {
        warnings.push({
          line: lineNumber,
          column: 1,
          message: "main() should return int, not void",
          severity: 'warning',
          code: 'W301',
        })
      }
    }
    
    // Check for missing semicolons after statements
    if (trimmedLine &&
        !trimmedLine.endsWith('{') &&
        !trimmedLine.endsWith('}') &&
        !trimmedLine.endsWith(';') &&
        !trimmedLine.startsWith('#') &&
        !trimmedLine.includes('if ') &&
        !trimmedLine.includes('if(') &&
        !trimmedLine.includes('else') &&
        !trimmedLine.includes('for ') &&
        !trimmedLine.includes('for(') &&
        !trimmedLine.includes('while ') &&
        !trimmedLine.includes('while(')) {
      
      if (trimmedLine.match(/^\w+\s+\w+\s*=/) || trimmedLine.includes('return ')) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          severity: 'error',
          code: 'E301',
        })
      }
    }
    
    // Track braces
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '{') braceStack.push({ line: lineNumber, col: i + 1 })
      if (char === '}') {
        if (braceStack.length === 0) {
          errors.push({
            line: lineNumber,
            column: i + 1,
            message: "Unexpected closing brace '}'",
            severity: 'error',
            code: 'E302',
          })
        } else {
          braceStack.pop()
        }
      }
    }
  }
  
  if (braceStack.length > 0) {
    for (const brace of braceStack) {
      errors.push({
        line: brace.line,
        column: brace.col,
        message: "Unclosed brace '{'",
        severity: 'error',
        code: 'E303',
      })
    }
  }
  
  return { errors, warnings }
}

// Main analyze function
export function analyzeCode(code, language) {
  switch (language) {
    case 'java':
      return analyzeJava(code)
    case 'python':
      return analyzePython(code)
    case 'javascript':
    case 'typescript':
      return analyzeJavaScript(code)
    case 'cpp':
    case 'c':
      return analyzeCpp(code)
    default:
      return { errors: [], warnings: [] }
  }
}

// Get completions for a position
export function getCompletions(code, language, line, column) {
  const completions = []
  
  if (language === 'java') {
    // Add Java keywords
    completions.push(
      ...javaRules.keywords.map(kw => ({
        label: kw,
        kind: 'keyword',
        detail: 'Java keyword',
      })),
      // Common methods
      { label: 'System.out.println', kind: 'method', detail: 'Print to console' },
      { label: 'System.out.print', kind: 'method', detail: 'Print without newline' },
      { label: 'main', kind: 'snippet', insertText: 'public static void main(String[] args) {\n    $1\n}', detail: 'Main method' },
    )
  }
  
  if (language === 'python') {
    completions.push(
      { label: 'print', kind: 'function', detail: 'Print to console' },
      { label: 'input', kind: 'function', detail: 'Read from console' },
      { label: 'len', kind: 'function', detail: 'Get length' },
      { label: 'range', kind: 'function', detail: 'Generate range' },
      { label: 'def', kind: 'keyword', detail: 'Define function' },
      { label: 'class', kind: 'keyword', detail: 'Define class' },
      { label: 'if', kind: 'keyword' },
      { label: 'elif', kind: 'keyword' },
      { label: 'else', kind: 'keyword' },
      { label: 'for', kind: 'keyword' },
      { label: 'while', kind: 'keyword' },
      { label: 'return', kind: 'keyword' },
    )
  }
  
  if (language === 'javascript' || language === 'typescript') {
    completions.push(
      { label: 'console.log', kind: 'method', detail: 'Log to console' },
      { label: 'function', kind: 'keyword' },
      { label: 'const', kind: 'keyword' },
      { label: 'let', kind: 'keyword' },
      { label: 'if', kind: 'keyword' },
      { label: 'else', kind: 'keyword' },
      { label: 'for', kind: 'keyword' },
      { label: 'while', kind: 'keyword' },
      { label: 'return', kind: 'keyword' },
      { label: 'async', kind: 'keyword' },
      { label: 'await', kind: 'keyword' },
      { label: 'class', kind: 'keyword' },
    )
  }
  
  return completions
}

export default { analyzeCode, getCompletions }

