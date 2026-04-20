'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { authApi, boardsApi, tasksApi, BoardWithTasks, Task, TaskStatus, User } from '@/lib/api'
import Navbar from '@/components/Navbar'
import TaskCard from '@/components/TaskCard'
import styles from './board.module.css'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: '📋 To Do' },
  { status: 'in_progress', label: '🔄 В работе' },
  { status: 'done', label: '✅ Готово' },
]

export default function BoardPage() {
  const router = useRouter()
  const params = useParams()
  const boardId = Number(params.id)

  const [user, setUser] = useState<User | null>(null)
  const [board, setBoard] = useState<BoardWithTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New task form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [taskError, setTaskError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [me, boardData] = await Promise.all([
          authApi.me(),
          boardsApi.getOne(boardId),
        ])
        setUser(me)
        setBoard(boardData)
      } catch (e: any) {
        if (e.status === 401) {
          document.cookie = 'accessToken=; path=/; max-age=0'
          router.push('/login')
        } else if (e.status === 404) {
          setError('Доска не найдена')
        } else {
          setError('Ошибка загрузки')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [boardId, router])

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setTaskError('Введите название задачи'); return }
    setTaskError('')
    setCreating(true)
    try {
      const task = await tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        boardId,
      })
      setBoard(prev => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev)
      setTitle('')
      setDescription('')
      setStatus('todo')
      setShowTaskForm(false)
    } catch (e: any) {
      setTaskError(e.message || 'Ошибка создания задачи')
    } finally {
      setCreating(false)
    }
  }

  function handleTaskUpdate(updated: Task) {
    setBoard(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === updated.id ? updated : t),
    } : prev)
  }

  function handleTaskDelete(id: number) {
    setBoard(prev => prev ? {
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    } : prev)
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Загружаем доску...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.loadingPage}>
        <p className={styles.errorText}>{error}</p>
        <Link href="/dashboard" className="btn-secondary">← Назад</Link>
      </div>
    )
  }

  if (!user || !board) return null

  const isAdmin = user.role === 'ADMIN'

  return (
    <>
      <Navbar user={user} />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.breadcrumb}>
              <Link href="/dashboard" className={styles.back}>← Назад</Link>
              <span className={styles.sep}>/</span>
              <h1 className={styles.boardTitle}>{board.title}</h1>
            </div>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowTaskForm(s => !s)}
            >
              {showTaskForm ? 'Отмена' : '+ Задача'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className={styles.taskForm}>
              <h3 className={styles.formTitle}>Новая задача</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Название задачи"
                    autoFocus
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Статус</label>
                  <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">В работе</option>
                    <option value="done">Готово</option>
                  </select>
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Описание</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Необязательное описание"
                  rows={2}
                />
              </div>
              {taskError && <span className="error-msg">{taskError}</span>}
              <button type="submit" className="btn-primary btn-sm" disabled={creating}>
                {creating ? 'Создаём...' : 'Создать задачу'}
              </button>
            </form>
          )}

          <div className={styles.columns}>
            {COLUMNS.map(col => {
              const tasks = board.tasks.filter(t => t.status === col.status)
              return (
                <div key={col.status} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>{col.label}</span>
                    <span className={styles.columnCount}>{tasks.length}</span>
                  </div>
                  <div className={styles.taskList}>
                    {tasks.length === 0 ? (
                      <div className={styles.emptyColumn}>Нет задач</div>
                    ) : (
                      tasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isAdmin={isAdmin}
                          onUpdate={handleTaskUpdate}
                          onDelete={handleTaskDelete}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}
