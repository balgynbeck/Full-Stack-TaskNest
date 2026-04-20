# TaskNest Frontend

Next.js 14 фронтенд для системы управления задачами TaskNest.

## Технологии

- Next.js 14 (App Router)
- TypeScript
- CSS Modules

## Запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить переменные окружения

Файл `.env.local` уже создан:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Запустить

```bash
npm run dev
```

Фронтенд будет доступен на http://localhost:3001

## Структура

```
app/
  (auth)/
    login/page.tsx         # Страница входа
    register/page.tsx      # Страница регистрации
  (protected)/
    dashboard/page.tsx     # Список досок
    boards/[id]/page.tsx   # Kanban-доска с задачами
  layout.tsx
  page.tsx                 # Редирект → /dashboard
middleware.ts              # Защита маршрутов
lib/
  api.ts                   # API-клиент (fetch + credentials)
  auth.ts                  # Утилиты токенов
components/
  Navbar.tsx               # Навбар с именем, ролью, кнопкой выхода
  BoardCard.tsx            # Карточка доски
  TaskCard.tsx             # Карточка задачи
```

## Логика авторизации

- Токены: бекенд возвращает `accessToken` в теле ответа, `refreshToken` в HTTP-only cookie
- При входе/регистрации `accessToken` сохраняется в обычный cookie (читаемый middleware)
- Middleware проверяет наличие `accessToken` cookie и защищает маршруты `/dashboard`, `/boards/*`
- При выходе cookie очищается, редирект на `/login`

## Роли

- **USER** — просмотр досок и задач, создание задач
- **ADMIN** — все функции USER + создание/удаление досок, смена статуса и удаление задач
