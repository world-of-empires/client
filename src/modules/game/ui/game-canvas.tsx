'use client'

import { Application } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MAP_H, DEFAULT_MAP_W, generateMap, TILE_NAMES } from '@/game'
import { getLoadedCount, loadAllTileTextures, MapRenderer } from '@/engine'
import { Controls, Hint, HoverInfo, Legend } from './game-hud'
import { LoadingOverlay } from './loading-overlay'

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

        rendRef.current?.destroy()
        rendRef.current = null
        if (appRef.current) {
            appRef.current.destroy(true, { children: true })
            appRef.current = null
        }

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

        await loadAllTileTextures()
        if (bootId !== bootIdRef.current) return
        console.log(`Textures ready: ${getLoadedCount()}/9`)

        const s = forceSeed ?? Math.floor(Math.random() * 999999)
        setSeed(s)

        const map = generateMap({
            width: DEFAULT_MAP_W,
            height: DEFAULT_MAP_H,
            seed: s
        })

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
