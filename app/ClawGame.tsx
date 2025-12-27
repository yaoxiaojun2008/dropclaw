'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ClawGame.module.css';

const INITIAL_DOLLS = [
  { id: 1, type: 'd1', left: 180, bottom: 140 },
  { id: 2, type: 'd2', left: 340, bottom: 80 }, // Adjusted right calc
  { id: 3, type: 'd3', left: 310, bottom: 30 }, // Adjusted right calc
  { id: 4, type: 'd4', left: 50, bottom: 100 },
  { id: 5, type: 'd5', left: 80, bottom: 30 },
];

export default function ClawGame() {
  // --- Refs for direct DOM manipulation (High Performance) ---
  const clawRef = useRef<HTMLDivElement>(null);
  const ropeRef = useRef<HTMLDivElement>(null);
  const clawBodyRef = useRef<HTMLDivElement>(null);
  const dollRefs = useRef<{ [key: number]: HTMLDivElement }>({}); // Store refs to each doll element
  const gameWindowRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- Mutable Game State (Refs) ---
  // We use refs for these so changing them doesn't trigger re-renders loop
  const gameStateRef = useRef('IDLE'); // IDLE, MOVING_DOWN, GRABBING, MOVING_UP
  const clawPos = useRef({ x: 200, y: 10 });
  const caughtDollIdRef = useRef<number | null>(null);

  // --- React State (For UI rendering) ---
  const [statusMsg, setStatusMsg] = useState('Swipe to move, tap to grab!');
  const [caughtDolls, setCaughtDolls] = useState<number[]>([]); // Array of IDs

  // Constants
  const MOVE_SPEED = 5;
  const DROP_SPEED = 4;
  const CLAW_START_Y = 10;

  // Touch control state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Initialize
  useEffect(() => {
    updateClawVisuals();

    // Keyboard listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'IDLE') return;

      const windowWidth = gameWindowRef.current?.offsetWidth || 400;
      const clawWidth = clawRef.current?.offsetWidth || 60;

      if (e.key === 'ArrowLeft') {
        clawPos.current.x = Math.max(0, clawPos.current.x - MOVE_SPEED);
        updateClawVisuals();
      } else if (e.key === 'ArrowRight') {
        clawPos.current.x = Math.min(windowWidth - clawWidth, clawPos.current.x + MOVE_SPEED);
        updateClawVisuals();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        startDrop();
      }
    };

    // Touch event handlers for game window
    const handleTouchStart = (e: TouchEvent) => {
      if (gameStateRef.current !== 'IDLE') return;
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameStateRef.current !== 'IDLE' || !touchStartX.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - (touchStartY.current || 0));

      // Only handle horizontal movement if it's more horizontal than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isDragging.current = true;
        const windowWidth = gameWindowRef.current?.offsetWidth || 400;
        const clawWidth = clawRef.current?.offsetWidth || 60;
        const moveAmount = deltaX * 0.5; // Sensitivity factor

        clawPos.current.x = Math.max(0, Math.min(windowWidth - clawWidth, clawPos.current.x + moveAmount));
        updateClawVisuals();

        touchStartX.current = touch.clientX;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameStateRef.current !== 'IDLE') return;

      const touch = e.changedTouches[0];
      const deltaX = Math.abs((touch.clientX - (touchStartX.current || 0)));
      const deltaY = Math.abs((touch.clientY - (touchStartY.current || 0)));

      // If it was a tap (not a drag), start drop
      if (!isDragging.current && deltaX < 10 && deltaY < 10) {
        startDrop();
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isDragging.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameWindow = gameWindowRef.current;
    if (gameWindow) {
      gameWindow.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameWindow.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameWindow.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameWindow) {
        gameWindow.removeEventListener('touchstart', handleTouchStart);
        gameWindow.removeEventListener('touchmove', handleTouchMove);
        gameWindow.removeEventListener('touchend', handleTouchEnd);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const updateClawVisuals = () => {
    if (clawRef.current && ropeRef.current) {
      clawRef.current.style.left = `${clawPos.current.x}px`;
      clawRef.current.style.top = `${clawPos.current.y}px`;
      ropeRef.current.style.height = `${20 + (clawPos.current.y - CLAW_START_Y)}px`;
    }
  };

  const startDrop = () => {
    if (gameStateRef.current !== 'IDLE') return;

    gameStateRef.current = 'MOVING_DOWN';
    setStatusMsg("Dropping...");
    caughtDollIdRef.current = null;
    gameLoop();
  };

  const gameLoop = () => {
    const state = gameStateRef.current;
    if (state === 'IDLE') return;

    const windowHeight = gameWindowRef.current?.offsetHeight || 350;
    const clawBodyHeight = clawBodyRef.current?.offsetHeight || 45;

    if (state === 'MOVING_DOWN') {
      clawPos.current.y += DROP_SPEED;

      // Check collision
      const hitDollId = checkCollision();

      if (hitDollId) {
        gameStateRef.current = 'GRABBING';
        caughtDollIdRef.current = hitDollId;
        setStatusMsg("Got one!");

        // Brief pause before lifting
        setTimeout(() => {
          gameStateRef.current = 'MOVING_UP';
          gameLoop();
        }, 500);
        return; // Break loop for timeout
      }
      // Floor collision
      else if (clawPos.current.y > windowHeight - clawBodyHeight - 20) {
         gameStateRef.current = 'GRABBING';
         setStatusMsg("Missed...");
         setTimeout(() => {
           gameStateRef.current = 'MOVING_UP';
           gameLoop();
         }, 500);
         return;
      }
    }
    else if (state === 'MOVING_UP') {
      clawPos.current.y -= DROP_SPEED;

      // Move the caught doll with the claw
      if (caughtDollIdRef.current) {
        const dollEl = dollRefs.current[caughtDollIdRef.current];
        if (dollEl) {
          // Calculate current visual bottom based on claw position
          // This is a simplified visual calculation
          const currentBottom = (windowHeight - clawPos.current.y - clawBodyHeight);
          dollEl.style.bottom = `${currentBottom - 10}px`; // -10 offset for visual overlap
        }
      }

      if (clawPos.current.y <= CLAW_START_Y) {
        clawPos.current.y = CLAW_START_Y;
        finishGrab();
        return;
      }
    }

    updateClawVisuals();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const checkCollision = (): number | null => {
    if (!clawBodyRef.current) return null;
    const clawRect = clawBodyRef.current.getBoundingClientRect();

    for (const doll of INITIAL_DOLLS) {
      // Don't check already caught dolls
      // We check the DOM class or the state. Checking state is safer.
      // But inside the loop we need quick access, let's use the caughtDolls state from closure
      // Note: In strict React, accessing state in loop works if state doesn't change during loop.
      // However, better to check if it's visible.
      const dollEl = dollRefs.current[doll.id];
      if (!dollEl || dollEl.style.opacity === '0') continue;

      const dollRect = dollEl.getBoundingClientRect();

      if (
        clawRect.left < dollRect.right &&
        clawRect.right > dollRect.left &&
        clawRect.bottom > dollRect.top &&
        clawRect.top < dollRect.bottom
      ) {
        return doll.id;
      }
    }
    return null;
  };

  const finishGrab = () => {
    gameStateRef.current = 'IDLE';
    updateClawVisuals();

    if (caughtDollIdRef.current) {
      setStatusMsg("Success! (Play again)");
      // Update React state to hide the doll permanently
      setCaughtDolls(prev => [...prev, caughtDollIdRef.current!]);

      // Check win condition
      if (caughtDolls.length + 1 === INITIAL_DOLLS.length) {
        setStatusMsg("All dolls collected! Resetting...");
        setTimeout(() => {
          setCaughtDolls([]);
          // Reset doll DOM positions
          INITIAL_DOLLS.forEach(d => {
             const el = dollRefs.current[d.id];
             if(el) {
                 el.style.opacity = '1';
                 el.style.bottom = `${d.bottom}px`;
             }
          });
        }, 3000);
      }
    } else {
      setStatusMsg("Missed. Try again.");
    }
    caughtDollIdRef.current = null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.machineContainer}>
        <header className={styles.header}>
          <h1>大唐娃娃机</h1>
          <p>Tang Dynasty Claw</p>
        </header>

        <div className={styles.gameWindow} ref={gameWindowRef}>
          {/* Claw Assembly */}
          <div className={styles.clawAssembly} ref={clawRef}>
            <div className={styles.rope} ref={ropeRef}></div>
            <div className={styles.catPaw} ref={clawBodyRef}>
              <div className={`${styles.toe}`} style={{left:'2px'}}></div>
              <div className={`${styles.toe}`} style={{left:'18px', top:'-8px'}}></div>
              <div className={`${styles.toe}`} style={{right:'18px', top:'-8px'}}></div>
              <div className={`${styles.toe}`} style={{right:'2px'}}></div>
            </div>
          </div>

          {/* Dolls */}
          {INITIAL_DOLLS.map((doll) => (
            <div
              key={doll.id}
              ref={el => { if (el) dollRefs.current[doll.id] = el; }}
              className={`${styles.doll} ${caughtDolls.includes(doll.id) ? styles.caught : ''}`}
              style={{ left: `${doll.left}px`, bottom: `${doll.bottom}px` }}
            >
              {/* Conditional rendering based on doll type */}
              {doll.type === 'd1' && <><div className={`${styles.head} ${styles.d1Head}`}></div><div className={styles.d1Body}></div></>}
              {doll.type === 'd2' && <><div className={`${styles.head} ${styles.d2Head}`}></div><div className={styles.d2Body}></div></>}
              {doll.type === 'd3' && <><div className={`${styles.head} ${styles.d3Head}`}></div><div className={styles.d3Body}></div></>}
              {doll.type === 'd4' && <><div className={`${styles.head} ${styles.d4Head}`}></div><div className={styles.d4Body}></div></>}
              {doll.type === 'd5' && <><div className={`${styles.head} ${styles.d5Head}`}></div><div className={styles.d5Body}></div></>}
            </div>
          ))}
        </div>

        <div className={styles.statusMessage}>{statusMsg}</div>

        {/* Controls */}
        <div className={styles.controlPanel}>
          <div className={styles.joystickArea}>
            <div className={styles.joystickBase}></div>
            <div className={styles.joystickStick}><div className={styles.joystickKnob}></div></div>
          </div>

          <div className={styles.buttonGroup}>
            <div>
              <button className={`${styles.gameBtn} ${styles.btnPink}`} onClick={startDrop}></button>
              <div>抓取 (Grab)</div>
            </div>
            <div>
              <button className={`${styles.gameBtn} ${styles.btnGreen}`} onClick={startDrop}></button>
              <div>下降 (Drop)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
