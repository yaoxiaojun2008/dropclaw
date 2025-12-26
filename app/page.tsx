'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
import AuthForm from './components/AuthForm'
import ClawGame from './ClawGame'

export default function ClawMachine() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (loggedIn) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true')
    setIsLoggedIn(true)
    setShowRegister(false)
  }

  const handleRegisterSuccess = () => {
    // Show success message after registration
    setRegistrationSuccess(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return showRegister ? (
      <div className={styles.container}>
        {registrationSuccess ? (
          <div className={styles.successMessage}>
            <h1 className={styles.title}>Registration Successful!</h1>
            <p>Your registration is successful, please refresh this page to return to the login page.</p>
            <button
              className={styles.controlButton}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <AuthForm mode="register" onSuccess={handleRegisterSuccess} />
        )}
      </div>
    ) : (
      <div className={styles.container}>
        <AuthForm
          mode="login"
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setShowRegister(true)}
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.controlButton}
        onClick={handleLogout}
        style={{ position: 'absolute', top: 20, right: 20 }}
      >
        Logout
      </button>
      <ClawGame />
    </div>
  )
}
