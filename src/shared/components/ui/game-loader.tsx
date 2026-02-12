'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const GameCanvas = dynamic(() => import('./game-canvas').then(mod => mod.GameCanvas), {
    ssr: false,
    loading: () => (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
            }}
        >
            Загрузка игры...
        </div>
    )
})

export function GameLoader() {
    const router = useRouter()

    return (
        <>
            {/* Canvas на весь экран */}
            <GameCanvas />

            {/* HUD поверх canvas */}
            <div
                style={{
                    position: 'fixed',
                    top: 20,
                    left: 20,
                    zIndex: 10,
                    display: 'flex',
                    gap: '1rem'
                }}
            >
                <button
                    onClick={() => router.push('/')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    ← Выход
                </button>
            </div>

            {/* Счёт в правом верхнем углу */}
            <div
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 10,
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}
            >
                Счёт: 0
            </div>
        </>
    )
}
