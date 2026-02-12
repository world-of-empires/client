'use client'

import { Application } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
    DEFAULT_MAP_H,
    DEFAULT_MAP_W,
    MapRenderer,
    TILE_COLORS,
    TILE_NAMES,
    TileType,
    generateMap,
    getLoadedCount,
    loadAllTileTextures
} from '@/shared/game'

export function GameCanvas() {
    const ref = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const rendRef = useRef<MapRenderer | null>(null)
    const initRef = useRef(false)
    const bootIdRef = useRef(0)

    const [hover, setHover] = useState<string | null>(null)
    const [seed, setSeed] = useState(0)
    const [status, setStatus] = useState<'loading' | 'ready'>('loading')

    const boot = useCallback(async (forceSeed?: number) => {
        const el = ref.current
        if (!el) return

        const bootId = ++bootIdRef.current
        setStatus('loading')

        // Cleanup previous
        rendRef.current?.destroy()
        rendRef.current = null
        if (appRef.current) {
            appRef.current.destroy(true, { children: true })
            appRef.current = null
        }

        // Create app
        const app = new Application()
        await app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x070d1a,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            resizeTo: window
        })

        if (!el.isConnected || bootId !== bootIdRef.current) {
            app.destroy(true, { children: true })
            return
        }

        appRef.current = app
        while (el.firstChild) el.removeChild(el.firstChild)
        el.appendChild(app.canvas)
        app.canvas.style.position = 'fixed'
        app.canvas.style.top = '0'
        app.canvas.style.left = '0'

        // Load textures
        await loadAllTileTextures()
        if (bootId !== bootIdRef.current) return
        console.log(`Textures ready: ${getLoadedCount()}/9`)

        // Generate map
        const s = forceSeed ?? Math.floor(Math.random() * 999999)
        setSeed(s)

        const map = generateMap({
            width: DEFAULT_MAP_W,
            height: DEFAULT_MAP_H,
            seed: s
        })

        // Render (skip if superseded by another boot or app was destroyed)
        if (bootId !== bootIdRef.current || !app.stage) return
        rendRef.current = new MapRenderer({
            map,
            app,
            onHover: (t, gx, gy) => setHover(`${TILE_NAMES[t]}  [${gx}, ${gy}]`),
            onHoverOut: () => setHover(null),
            onClick: (t, gx, gy) => console.log(`Click: ${TILE_NAMES[t]} (${gx},${gy})`)
        })

        setStatus('ready')
    }, [])

    useEffect(() => {
        if (initRef.current) return
        initRef.current = true
        boot()

        return () => {
            rendRef.current?.destroy()
            rendRef.current = null
            appRef.current?.destroy(true, { children: true })
            appRef.current = null
            initRef.current = false
        }
    }, [boot])

    const regen = useCallback(() => {
        initRef.current = false
        boot(Math.floor(Math.random() * 999999))
        initRef.current = true
    }, [boot])

    return (
        <>
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    overflow: 'hidden'
                }}
            />

            {status === 'loading' && <LoadingOverlay />}

            {status === 'ready' && (
                <>
                    {hover && <HoverInfo text={hover} />}
                    <Controls onRegen={regen} seed={seed} />
                    <Legend />
                    <Hint />
                </>
            )}
        </>
    )
}

// ==========================================
// UI COMPONENTS
// ==========================================

function LoadingOverlay() {
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
            <div>Загрузка текстур и генерация мира...</div>
        </div>
    )
}

function HoverInfo({ text }: { text: string }) {
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

function Controls({ onRegen, seed }: { onRegen: () => void; seed: number }) {
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
            <button onClick={onRegen} style={btn}>
                🔄 Новая карта
            </button>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.75rem' }}>seed: {seed}</span>
        </div>
    )
}

function Legend() {
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

function Hint() {
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

const btn: React.CSSProperties = {
    padding: '8px 16px',
    background: 'rgba(0,0,0,.75)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,.2)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '.9rem'
}
