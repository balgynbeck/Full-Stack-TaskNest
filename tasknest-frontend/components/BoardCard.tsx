'use client'

import Link from 'next/link'
import { Board } from '@/lib/api'
import styles from './BoardCard.module.css'

interface BoardCardProps {
  board: Board
  isAdmin: boolean
  onDelete: (id: number) => void
}

export default function BoardCard({ board, isAdmin, onDelete }: BoardCardProps) {
  const taskCount = board.tasks?.length ?? 0

  return (
    <Link href={`/boards/${board.id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{board.title}</h2>
          <span className={styles.count}>{taskCount} задач{taskCount === 1 ? 'а' : taskCount > 1 && taskCount < 5 ? 'и' : ''}</span>
        </div>

        <p className={styles.date}>
          Создана: {new Date(board.createdAt).toLocaleDateString('ru-RU')}
        </p>

        {isAdmin && (
          <div className={styles.actions} onClick={e => e.preventDefault()}>
            <button
              className="btn-danger btn-sm"
              onClick={() => onDelete(board.id)}
            >
              Удалить
            </button>
          </div>
        )}
      </article>
    </Link>
  )
}
