import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, Paperclip, ArrowLeft, Code, MoreVertical, Image as ImageIcon, FileText, X, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { chatAPI, createWebSocket } from '../api'
import type { Message, Chat } from '../api'

interface ChatPageProps {
  backLink?: string
}

export default function ChatPage({ backLink = '/dashboard' }: ChatPageProps) {
  const { chatId } = useParams()
  const { user, token } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // Load chats
  useEffect(() => {
    chatAPI.getChats().then(setChats)
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!token) return

    const ws = createWebSocket(token)
    let isMounted = true
    
    // Add additional onopen handler (original is set in createWebSocket)
    ws.addEventListener('open', () => {
      if (isMounted) {
        console.log('WebSocket connected')
      }
    })

    ws.onerror = (error) => {
      if (isMounted) {
        console.error('WebSocket error:', error)
      }
    }

    ws.onclose = () => {
      if (isMounted) {
        console.log('WebSocket closed')
      }
    }
    
    ws.onmessage = async (event) => {
      if (!isMounted) return
      
      try {
        const data = JSON.parse(event.data)
        console.log('WebSocket message received:', data.type)
        
        if (data.type === 'new_message') {
          const message = data.message

          if (message.chat_id === chatId) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.some(m => m.id === message.id)) {
                return prev
              }
              return [...prev, message]
            })
            scrollToBottom()
          }
          
          // Update chat list
          setChats(prev => prev.map(chat => 
            chat.id === message.chat_id 
              ? { ...chat, last_message: message.content || '', unread_count: chat.unread_count + 1 }
              : chat
          ))
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }

    wsRef.current = ws

    return () => {
      isMounted = false
      console.log('Cleaning up WebSocket')
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [token, chatId, user?.id])

  // Load messages for selected chat
  useEffect(() => {
    if (chatId) {
      loadMessages()
      
      const chat = chats.find(c => c.id === chatId)
      if (chat) {
        setActiveChat(chat)
      }
    }
  }, [chatId, chats])

  const loadMessages = async () => {
    if (!chatId) return

    try {
      const msgs = await chatAPI.getMessages(chatId)
      setMessages(msgs)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !chatId) return

    setUploading(true)
    try {
      const result = await chatAPI.uploadFile(selectedFile)
      
      // Send message with file
      await chatAPI.sendMessage(chatId, '', 'file', {
        file_url: result.url,
        file_name: result.originalName,
        file_size: result.size,
        file_mimetype: result.mimetype,
      })

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      loadMessages()
    } catch (error: any) {
      alert(error.message || 'Ошибка загрузки файла')
    }
    setUploading(false)
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !chatId) return

    try {
      const content = newMessage.trim()
      const messageType = newMessage.includes('```') ? 'code' : 'text'
      
      const message = await chatAPI.sendMessage(chatId, content, messageType)
      setMessages(prev => [...prev, message])
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Ошибка отправки сообщения')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p.id !== user?.id)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <FileText className="w-5 h-5" />
    if (mimetype.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    if (mimetype.includes('pdf')) return <FileText className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Chat List - hidden on mobile when chat is open */}
      <div className={`${chatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r dark:border-gray-700 flex-col`}>
        <div className="p-4 border-b dark:border-gray-700">
          <Link to={backLink} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
            Назад
          </Link>
          <h2 className="text-lg font-semibold dark:text-white">Сообщения</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => {
            const other = getOtherParticipant(chat)
            const isActive = chat.id === chatId
            return (
              <Link
                key={chat.id}
                to={`${backLink}/chat/${chat.id}`}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 ${
                  isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="relative">
                  <img src={other?.avatar} alt="" className="w-12 h-12 rounded-full" />
                  {chat.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate dark:text-white">{other?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.last_message}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Chat Messages - full width on mobile */}
      {chatId && activeChat ? (
        <div className="flex-1 flex flex-col w-full">
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b dark:border-gray-700 flex items-center gap-3 md:gap-4">
            {/* Back button for mobile */}
            <Link to={backLink} className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <img 
              src={getOtherParticipant(activeChat)?.avatar} 
              alt="" 
              className="w-10 h-10 rounded-full" 
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium dark:text-white truncate">
                {getOtherParticipant(activeChat)?.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getOtherParticipant(activeChat)?.role === 'teacher' ? 'Преподаватель' : 'Студент'}
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <img src={message.sender_avatar} alt="" className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      {!isOwn && (
                        <div className="text-xs text-gray-500 mb-1">{message.sender_name}</div>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwn 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.message_type === 'file' && message.file_url ? (
                          <div className="space-y-2">
                            {message.file_mimetype?.startsWith('image/') ? (
                              <div>
                                <img 
                                  src={`http://localhost:3001${message.file_url}`}
                                  alt={message.file_name || 'Изображение'}
                                  className="max-w-full max-h-64 rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                                {message.file_name && (
                                  <div className="text-xs mt-1 opacity-75">{message.file_name}</div>
                                )}
                              </div>
                            ) : (
                              <a
                                href={`http://localhost:3001${message.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20"
                              >
                                {getFileIcon(message.file_mimetype)}
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{message.file_name || 'Файл'}</div>
                                  {message.file_size && (
                                    <div className="text-xs opacity-75">{formatFileSize(message.file_size)}</div>
                                  )}
                                </div>
                              </a>
                            )}
                            {message.content && (
                              <div className="mt-2 text-sm">{message.content}</div>
                            )}
                          </div>
                        ) : message.message_type === 'code' ? (
                          <pre className={`text-sm font-mono whitespace-pre-wrap ${
                            isOwn ? 'bg-blue-700' : 'bg-gray-200'
                          } rounded p-2 mt-1`}>
                            {message.content || ''}
                          </pre>
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {message.content || ''}
                          </p>
                        )}
                      </div>
                      <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="px-3 md:px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <FileText className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate dark:text-white">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 md:p-4 border-t dark:border-gray-700 safe-area-bottom">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0"
                title="Прикрепить файл"
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
              <button className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0">
                <Code className="w-5 h-5 text-gray-500" />
              </button>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Сообщение..."
                className="flex-1 px-3 md:px-4 py-2 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full resize-none max-h-32 text-sm md:text-base"
                rows={1}
                disabled={uploading}
              />
              <button
                onClick={selectedFile ? handleFileUpload : handleSend}
                disabled={(!newMessage.trim() && !selectedFile) || uploading}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
          Выберите чат
        </div>
      )}
    </div>
  )
}

// Start Chat Button
export function StartChatButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false)

  const handleStartChat = async () => {
    setLoading(true)
    try {
      const chat = await chatAPI.createDirect(userId)
      window.location.href = `/dashboard/chat/${chat.id}`
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Открытие...' : `Написать ${userName}`}
    </button>
  )
}
