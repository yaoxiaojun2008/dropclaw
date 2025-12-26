'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
import AuthForm from './components/AuthForm'

function GameContent() {
  const [position, setPosition] = useState(0)
  const [clawPosition, setClawPosition] = useState(0)
  const [isDropping, setIsDropping] = useState(false)
  const [hasPrize, setHasPrize] = useState(false)
  const [credits, setCredits] = useState(5)

  const prizes = [
    { id: 1, name: 'Teddy Bear', caught: false },
    { id: 2, name: 'Toy Car', caught: false },
    { id: 3, name: 'Ball', caught: false }
  ]

  const moveLeft = () => {
    if (position > 0 && !isDropping) {
      setPosition(position - 10)
    }
  }

  const moveRight = () => {
    if (position < 100 && !isDropping) {
      setPosition(position + 10)
    }
  }

  const dropClaw = () => {
    if (!isDropping && credits > 0) {
      setCredits(credits - 1)
      setIsDropping(true)
      
      // Animate claw drop
      setTimeout(() => {
        setClawPosition(100)
        
        // Check for prize (50% chance)
        const gotPrize = Math.random() > 0.5
        setHasPrize(gotPrize)
        
        // Return claw
        setTimeout(() => {
          setClawPosition(0)
          setIsDropping(false)
          if (gotPrize) {
            // Mark prize as caught
            const updatedPrizes = [...prizes]
            const randomPrizeIndex = Math.floor(Math.random() * prizes.length)
            updatedPrizes[randomPrizeIndex].caught = true
          }
        }, 1000)
      }, 1000)
    }
  }

  return (
    <>
      <h1 className={styles.title}>Claw Machine Game</h1>
      <div className={styles.machine}>
        <div className={styles.clawRail} style={{ left: `${position}%` }}>
          <div 
            className={styles.claw} 
            style={{ bottom: `${clawPosition}%` }}
          >
            {hasPrize && <div className={styles.prize}>🎁</div>}
          </div>
        </div>
        
        <div className={styles.prizeArea}>
          {prizes.map(prize => (
            <div 
              key={prize.id}
              className={`${styles.prizeItem} ${prize.caught ? styles.caught : ''}`}
            >
              {prize.name}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <p>Credits: {credits}</p>
        <button className={styles.controlButton} onClick={moveLeft} disabled={isDropping}>← Move Left</button>
        <button className={styles.controlButton} onClick={moveRight} disabled={isDropping}>→ Move Right</button>
        <button className={styles.controlButton} onClick={dropClaw} disabled={isDropping || credits <= 0}>
          Drop Claw
        </button>
      </div>
    </>
  )
}

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
      <GameContent />
    </div>
  )
}
