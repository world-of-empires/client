import { TileType, TILE_COLORS, TILE_NAMES } from '@/game'

export function HoverInfo({ text }: { text: string }) {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 64,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                background: 'rgba(0,0,0,.8)',
                color: '#fff',
                padding: '5px 14px',
                borderRadius: 6,
                fontSize: '.85rem',
                pointerEvents: 'none'
            }}
        >
            {text}
        </div>
    )
}

export function Controls({ onRegen, seed }: { onRegen: () => void; seed: number }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 14,
                left: 14,
                zIndex: 10,
                display: 'flex',
                gap: 8,
                alignItems: 'center'
            }}
        >
            <button onClick={onRegen} style={btnStyle}>
                🔄 Новая карта
            </button>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.75rem' }}>seed: {seed}</span>
        </div>
    )
}

export function Legend() {
    const tiles = [
        TileType.OCEAN,
        TileType.SEA,
        TileType.SHALLOW,
        TileType.GRASS,
        TileType.PLAINS,
        TileType.DESERT,
        TileType.TAIGA,
        TileType.TUNDRA,
        TileType.SNOW
    ]

    return (
        <div
            style={{
                position: 'fixed',
                top: 14,
                right: 14,
                zIndex: 10,
                background: 'rgba(0,0,0,.75)',
                padding: '10px 14px',
                borderRadius: 8,
                color: '#fff',
                fontSize: '.8rem',
                lineHeight: 2
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Биомы:</div>
            {tiles.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                        style={{
                            display: 'inline-block',
                            width: 14,
                            height: 14,
                            background: '#' + TILE_COLORS[t].toString(16).padStart(6, '0'),
                            borderRadius: 2,
                            flexShrink: 0
                        }}
                    />
                    <span>{TILE_NAMES[t]}</span>
                </div>
            ))}
        </div>
    )
}

export function Hint() {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                background: 'rgba(0,0,0,.7)',
                color: 'rgba(255,255,255,.65)',
                padding: '6px 18px',
                borderRadius: 8,
                fontSize: '.8rem'
            }}
        >
            🖱️ Drag — перемещение &nbsp;|&nbsp; Scroll — зум
        </div>
    )
}

const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'rgba(0,0,0,.75)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,.2)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '.9rem'
}
