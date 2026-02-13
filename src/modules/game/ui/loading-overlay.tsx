export function LoadingOverlay() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: '#070d1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: '#fff',
                fontSize: '1.4rem'
            }}
        >
            <div style={{ fontSize: '3rem' }}>🗺️</div>
            <div>Генерация мира...</div>
        </div>
    )
}
