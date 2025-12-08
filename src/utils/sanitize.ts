// HTML sanitization utility to prevent XSS attacks

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Sanitizes HTML string by removing potentially dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
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
 * Sanitizes text input by removing control characters and limiting length
 */
export function sanitizeText(text: string, maxLength: number = 10000): string {
  if (!text) return ''
  
  // Remove control characters except newlines and tabs
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  // Limit length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength)
  }
  
  return text.trim()
}

