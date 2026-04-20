const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getCookie('accessToken')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json()
        document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 15}; SameSite=Lax`
        const retryHeaders = { ...headers, Authorization: `Bearer ${accessToken}` }
        const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers: retryHeaders,
        })
        if (retryRes.ok) {
          const text = await retryRes.text()
          return text ? JSON.parse(text) : ({} as T)
        }
      }
    } catch {}
    document.cookie = 'accessToken=; path=/; max-age=0'
    const err = new Error('Unauthorized') as Error & { status: number }
    err.status = 401
    throw err
  }

  if (!response.ok) {
    let errorMessage = 'Ошибка запроса'
    try {
      const error = await response.json()
      errorMessage = Array.isArray(error.message) ? error.message[0] : error.message || errorMessage
    } catch {}
    const err = new Error(errorMessage) as Error & { status: number }
    err.status = response.status
    throw err
  }

  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text)
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest<{ accessToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiRequest<{ accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => apiRequest<User>('/auth/me'),
  refresh: () => apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),
}

export const boardsApi = {
  getAll: () => apiRequest<Board[]>('/boards'),
  getOne: (id: number) => apiRequest<BoardWithTasks>(`/boards/${id}`),
  create: (data: { title: string }) =>
    apiRequest<Board>('/boards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { title: string }) =>
    apiRequest<Board>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<Board>(`/boards/${id}`, { method: 'DELETE' }),
}

export const tasksApi = {
  create: (data: { title: string; description?: string; status?: TaskStatus; boardId: number }) =>
    apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ title: string; description: string; status: TaskStatus }>) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest<Task>(`/tasks/${id}`, { method: 'DELETE' }),
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface User {
  id: number
  name?: string
  email: string
  role: 'USER' | 'ADMIN'
}

export interface Board {
  id: number
  title: string
  createdAt: string
  tasks?: Task[]
}

export interface Task {
  id: number
  title: string
  description?: string
  status: TaskStatus
  boardId: number
  userId: number
  createdAt: string
  user?: User
}

export interface BoardWithTasks extends Board {
  tasks: Task[]
}
