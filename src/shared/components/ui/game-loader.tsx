'use client'

import dynamic from 'next/dynamic'

const GameCanvas = dynamic(() => import('./game-canvas').then(m => m.GameCanvas), {
    ssr: false,
    loading: () => (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: '#070d1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.4rem'
            }}
        >
            🗺️ Загрузка...
        </div>
    )
})

export function GameLoader() {
    return <GameCanvas />
}
