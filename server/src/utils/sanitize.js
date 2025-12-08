// Input sanitization utilities for backend

/**
 * Sanitizes text by removing control characters and limiting length
 */
export function sanitizeText(text, maxLength = 10000) {
  if (!text || typeof text !== 'string') return ''
  
  // Remove control characters except newlines and tabs
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  // Limit length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength)
  }
  
  return text.trim()
}

/**
 * Sanitizes HTML by removing dangerous tags and attributes
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return ''
  
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Remove javascript: and data: URLs
  html = html.replace(/javascript:/gi, '')
  html = html.replace(/data:text\/html/gi, '')
  
  // Remove iframe, embed, object tags
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  html = html.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  
  return html
}

/**
 * Validates and sanitizes discussion title
 */
export function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    throw new Error('Заголовок обязателен')
  }
  
  const sanitized = sanitizeText(title, 200)
  
  if (sanitized.length < 3) {
    throw new Error('Заголовок должен содержать минимум 3 символа')
  }
  
  if (sanitized.length > 200) {
    throw new Error('Заголовок не должен превышать 200 символов')
  }
  
  return sanitized
}

/**
 * Validates and sanitizes discussion content
 */
export function validateContent(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Содержание обязательно')
  }
  
  const sanitized = sanitizeText(content, 10000)
  
  if (sanitized.length < 10) {
    throw new Error('Содержание должно содержать минимум 10 символов')
  }
  
  if (sanitized.length > 10000) {
    throw new Error('Содержание не должно превышать 10000 символов')
  }
  
  return sanitized
}

/**
 * Validates UUID format
 */
export function validateUUID(id) {
  if (!id || typeof id !== 'string') {
    return false
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

