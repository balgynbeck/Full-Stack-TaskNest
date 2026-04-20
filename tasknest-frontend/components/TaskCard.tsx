'use client'

import { useState } from 'react'
import { Task, TaskStatus, tasksApi } from '@/lib/api'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  isAdmin: boolean
  onUpdate: (task: Task) => void
  onDelete: (id: number) => void
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'В работе',
  done: 'Готово',
}

const statusBadge: Record<TaskStatus, string> = {
  todo: 'badge-todo',
  in_progress: 'badge-progress',
  done: 'badge-done',
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

export default function TaskCard({ task, isAdmin, onUpdate, onDelete }: TaskCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleStatusChange() {
    if (!isAdmin) return
    setLoading(true)
    try {
      const updated = await tasksApi.update(task.id, { status: nextStatus[task.status] })
      onUpdate(updated)
    } catch {}
    setLoading(false)
  }

  async function handleDelete() {
    if (!isAdmin) return
    setLoading(true)
    try {
      await tasksApi.delete(task.id)
      onDelete(task.id)
    } catch {}
    setLoading(false)
  }

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{task.title}</h3>
        <span className={`badge ${statusBadge[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}

      {task.user && (
        <p className={styles.author}>
          👤 {task.user.name || task.user.email}
        </p>
      )}

      {isAdmin && (
        <div className={styles.actions}>
          <button
            className={`btn-secondary btn-sm ${styles.statusBtn}`}
            onClick={handleStatusChange}
            disabled={loading}
          >
            → {statusLabels[nextStatus[task.status]]}
          </button>
          <button
            className="btn-danger btn-sm"
            onClick={handleDelete}
            disabled={loading}
          >
            Удалить
          </button>
        </div>
      )}
    </article>
  )
}
