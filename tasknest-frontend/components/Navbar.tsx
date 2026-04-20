'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi, User } from '@/lib/api'
import styles from './Navbar.module.css'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {}
    // Clear the accessToken cookie
    document.cookie = 'accessToken=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brand}>
          <span className={styles.brandIcon}>✦</span>
          <span className={styles.brandText}>TaskNest</span>
        </Link>

        <div className={styles.right}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name || user.email}</span>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
              {user.role}
            </span>
          </div>
          <button onClick={handleLogout} className={`btn-secondary btn-sm ${styles.logoutBtn}`}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  )
}
