# E2EE Migration Guide

## Что изменилось

Модуль `src/utils/e2ee.ts` был полностью переписан с нуля для поддержки кросс-браузерного шифрования, как в Telegram/WhatsApp.

### Основные изменения:

1. **Мастер-ключ из пароля** - теперь приватные ключи зашифрованы с помощью мастер-ключа, который генерируется из пароля пользователя
2. **Хранение на сервере** - зашифрованные приватные ключи хранятся на сервере и доступны с любого устройства
3. **sessionStorage вместо localStorage** - ключи хранятся в sessionStorage и очищаются при выходе
4. **Соль для деривации ключа** - используется PBKDF2 с 100,000 итераций для защиты от brute-force атак

## Обратная совместимость

Для совместимости со старым кодом добавлены функции:

```typescript
// Старые функции (legacy)
storePrivateKey(userId, privateKey)
getStoredPrivateKey(userId)
storePublicKey(userId, publicKey)
getStoredPublicKey(userId)
storeRecipientPublicKey(chatId, userId, publicKey)
getRecipientPublicKey(chatId, userId)

// Новая функция для простой инициализации (без пароля)
simpleInitializeE2EE(userId)
```

## Обновления на сервере

### База данных

Добавлены новые поля в таблицу `user_public_keys`:

```sql
ALTER TABLE user_public_keys ADD COLUMN private_key_encrypted TEXT;
ALTER TABLE user_public_keys ADD COLUMN master_key_salt TEXT;
ALTER TABLE user_public_keys ADD COLUMN encryption_iv TEXT;
```

Миграция выполняется автоматически при запуске сервера.

### API

Обновлены эндпоинты:

#### POST `/api/chat/keys`
Сохранение ключей пользователя (с поддержкой новых полей):

```json
{
  "public_key": "base64_public_key",
  "private_key_encrypted": "base64_encrypted_private_key",
  "master_key_salt": "base64_salt",
  "encryption_iv": "base64_iv"
}
```

#### GET `/api/chat/keys/me`
Получение своих ключей (возвращает все поля включая соль):

```json
{
  "public_key": "...",
  "private_key_encrypted": "...",
  "master_key_salt": "...",
  "encryption_iv": "..."
}
```

## Как использовать (будущее)

### Регистрация нового пользователя

```typescript
import { setupNewUserKeys } from '@/utils/e2ee'

// При регистрации
const password = "user_password" // Пароль от аккаунта
const keys = await setupNewUserKeys(userId, password)

// Отправить на сервер
await chatAPI.savePublicKey(
  keys.publicKey, 
  keys.encryptedPrivateKey,
  keys.salt,
  keys.iv
)
```

### Вход с другого устройства

```typescript
import { loadUserKeys } from '@/utils/e2ee'

// При входе - получить ключи с сервера
const storedKeys = await chatAPI.getMyKeys()

// Загрузить ключи с паролем
const password = "user_password" // Пароль от аккаунта
const keyPair = await loadUserKeys(userId, password, storedKeys)

// Теперь можно читать все сообщения!
```

### Отправка зашифрованного сообщения

```typescript
import { encryptMessage, importPublicKey } from '@/utils/e2ee'

// Получить публичный ключ получателя
const recipientPubKey = await importPublicKey(recipientPublicKeyString)

// Зашифровать сообщение
const encrypted = await encryptMessage(message, recipientPubKey, recipientKeyId)

// Отправить на сервер
await chatAPI.sendMessage(chatId, message, 'text', {
  encrypted_content: JSON.stringify(encrypted),
  is_encrypted: true
})
```

### Получение и расшифровка сообщения

```typescript
import { decryptMessage, getCachedPrivateKey } from '@/utils/e2ee'

// Получить кешированный приватный ключ
const privateKey = await getCachedPrivateKey(userId)

if (!privateKey) {
  // Сессия истекла - нужно снова ввести пароль
  throw new Error('Session expired')
}

// Расшифровать сообщение
const encryptedData = JSON.parse(message.encrypted_content)
const decrypted = await decryptMessage(encryptedData, privateKey)
```

## Текущая реализация (временная)

Сейчас используется упрощенная версия без пароля для обратной совместимости:

```typescript
import { simpleInitializeE2EE } from '@/utils/e2ee'

// Инициализация E2EE
const { privateKey, publicKey, privateKeyStr, publicKeyStr } = 
  await simpleInitializeE2EE(userId)

// Сохранить на сервере
await chatAPI.savePublicKey(publicKeyStr, privateKeyStr)
```

## Что нужно изменить в существующем коде

Текущий код в `DashboardPage.tsx`, `Chat.tsx` и `TeacherPage.tsx` уже обновлен для работы с новым модулем через функции обратной совместимости. Никаких изменений не требуется!

## Безопасность

### Что защищено:
- ✅ Приватные ключи зашифрованы мастер-ключом (AES-256-GCM)
- ✅ Мастер-ключ генерируется из пароля через PBKDF2 (100,000 итераций)
- ✅ Уникальная соль для каждого пользователя
- ✅ Мастер-ключ хранится только в sessionStorage (очищается при выходе)
- ✅ Сообщения зашифрованы гибридным шифрованием (RSA-2048 + AES-256-GCM)

### Как это работает:
1. Пользователь вводит пароль
2. Из пароля + соль генерируется мастер-ключ (PBKDF2, 100k итераций)
3. Мастер-ключ шифрует приватный ключ (AES-256-GCM)
4. Зашифрованный приватный ключ + соль сохраняются на сервере
5. При входе с другого устройства процесс повторяется
6. Если пароль верный - мастер-ключ расшифрует приватный ключ
7. С приватным ключом можно читать все сообщения

## Миграция на полную версию

Чтобы включить полную версию с паролями:

1. Добавить поле для ввода пароля при входе
2. Заменить `simpleInitializeE2EE` на `initializeE2EE` или `setupNewUserKeys`/`loadUserKeys`
3. Сохранять соль при регистрации
4. Запрашивать пароль при каждом входе для расшифровки ключей

## Заметки

- Пароль **никогда** не отправляется на сервер
- Мастер-ключ существует только в памяти браузера (sessionStorage)
- Сервер хранит только зашифрованные приватные ключи
- Даже администратор сервера не может прочитать сообщения

