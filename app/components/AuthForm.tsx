'use client'
import { useState } from 'react'
import styles from '../page.module.css'

export default function AuthForm({
  mode,
  onSuccess,
  onSwitchToRegister
}: {
  mode: 'login' | 'register'
  onSuccess: () => void
  onSwitchToRegister?: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth'
    const body = mode === 'login' 
      ? { username, password }
      : { username, password, email }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Call onSuccess callback to handle login state
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {mode === 'login' ? 'Login' : 'Create Account'}
      </h1>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.authForm}>
        {mode === 'register' && (
          <div className={styles.formGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        {mode === 'login' && (
          <div className={styles.formGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {mode === 'register' && (
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <button className={styles.controlButton} type="submit">
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      {mode === 'login' && (
        <div className={styles.switchAuth}>
          <p>Don't have an account?</p>
          <button
            className={styles.linkButton}
            onClick={() => onSwitchToRegister?.()}
          >
            Register here
          </button>
        </div>
      )}
    </div>
  )
}
