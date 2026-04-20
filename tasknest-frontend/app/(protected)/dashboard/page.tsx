'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, boardsApi, Board, User } from '@/lib/api'
import Navbar from '@/components/Navbar'
import BoardCard from '@/components/BoardCard'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [me, allBoards] = await Promise.all([
          authApi.me(),
          boardsApi.getAll(),
        ])
        setUser(me)
        setBoards(allBoards)
      } catch (e: any) {
        if (e.status === 401) {
          document.cookie = 'accessToken=; path=/; max-age=0'
          router.push('/login')
        } else {
          setError('Ошибка загрузки данных')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault()
    const title = newBoardTitle.trim()
    if (!title) { setCreateError('Введите название'); return }
    setCreateError('')
    setCreating(true)
    try {
      const board = await boardsApi.create({ title })
      setBoards(prev => [board, ...prev])
      setNewBoardTitle('')
      setShowForm(false)
    } catch (e: any) {
      setCreateError(e.message || 'Ошибка создания доски')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteBoard(id: number) {
    if (!confirm('Удалить доску?')) return
    try {
      await boardsApi.delete(id)
      setBoards(prev => prev.filter(b => b.id !== id))
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Загружаем данные...</p>
      </div>
    )
  }

  if (!user) return null

  const isAdmin = user.role === 'ADMIN'

  return (
    <>
      <Navbar user={user} />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Доски</h1>
              <p className={styles.subtitle}>
                {boards.length === 0 ? 'Нет досок' : `${boards.length} ${boards.length === 1 ? 'доска' : boards.length < 5 ? 'доски' : 'досок'}`}
              </p>
            </div>
            {isAdmin && (
              <button
                className="btn-primary"
                onClick={() => setShowForm(s => !s)}
              >
                {showForm ? 'Отмена' : '+ Новая доска'}
              </button>
            )}
          </div>

          {showForm && isAdmin && (
            <form onSubmit={handleCreateBoard} className={styles.createForm}>
              <div className={styles.createRow}>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={e => setNewBoardTitle(e.target.value)}
                  placeholder="Название новой доски"
                  autoFocus
                />
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Создаём...' : 'Создать'}
                </button>
              </div>
              {createError && <span className="error-msg">{createError}</span>}
            </form>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          {boards.length === 0 ? (
            <div className={styles.empty}>
              <p>Нет досок.{isAdmin ? ' Создайте первую!' : ''}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {boards.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteBoard}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
