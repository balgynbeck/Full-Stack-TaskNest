'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import styles from './register.module.css'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Введите имя'
    if (!email) e.email = 'Введите email'
    else if (!validateEmail(email)) e.email = 'Некорректный формат email'
    if (!password) e.password = 'Введите пароль'
    else if (password.length < 6) e.password = 'Минимум 6 символов'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setErrors({})
    setLoading(true)
    try {
      const { accessToken } = await authApi.register({ name: name.trim(), email, password })
      const maxAge = 60 * 15
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`
      await new Promise(r => setTimeout(r, 50))
      window.location.href = '/dashboard'
    } catch (err: any) {
      if (err.status === 409 || (err.message && err.message.toLowerCase().includes('email'))) {
        setErrors({ form: 'Этот email уже занят' })
      } else {
        setErrors({ form: err.message || 'Ошибка регистрации' })
      }
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

        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте свой аккаунт</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Имя</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Иван Иванов"
              autoComplete="name"
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

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
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          {errors.form && (
            <div className={styles.formError}>{errors.form}</div>
          )}

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.footer}>
          Уже есть аккаунт?{' '}
          <Link href="/login" className={styles.link}>Войти</Link>
        </p>
      </div>
    </div>
  )
}
