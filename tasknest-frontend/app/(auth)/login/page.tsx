'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import styles from './login.module.css'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email) e.email = 'Введите email'
    else if (!validateEmail(email)) e.email = 'Некорректный формат email'
    if (!password) e.password = 'Введите пароль'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setErrors({})
    setLoading(true)
    try {
      const { accessToken } = await authApi.login({ email, password })
      // Set cookie BEFORE navigation so middleware sees it
      const maxAge = 60 * 15 // 15 minutes
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`
      // Small delay to ensure cookie is written, then hard navigate
      await new Promise(r => setTimeout(r, 50))
      window.location.href = '/dashboard'
    } catch (err: any) {
      setErrors({ form: err.message || 'Неверный email или пароль' })
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>TaskNest</span>
        </div>

        <h1 className={styles.title}>Вход в систему</h1>
        <p className={styles.subtitle}>Добро пожаловать обратно</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          {errors.form && (
            <div className={styles.formError}>{errors.form}</div>
          )}

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className={styles.footer}>
          Нет аккаунта?{' '}
          <Link href="/register" className={styles.link}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
