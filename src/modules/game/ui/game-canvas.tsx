'use client'

import { Application } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GameHud } from './game-hud'
import { LoadingOverlay } from './loading-overlay'
import { MapRenderer, loadAllTileTextures } from '@/engine'
import { DEFAULT_MAP_H, DEFAULT_MAP_W, type MapConfig, TILE_NAMES, generateMap, getDefaultConfig } from '@/game'

export function GameCanvas() {
    const ref = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const rendRef = useRef<MapRenderer | null>(null)
    const initRef = useRef(false)

    const [hover, setHover] = useState<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready'>('loading')
    const [config, setConfig] = useState<MapConfig>(getDefaultConfig(DEFAULT_MAP_W, DEFAULT_MAP_H))
    const [stats, setStats] = useState<Record<string, number>>({})

    // ==========================================
    // BOOT
    // ==========================================

    const boot = useCallback(async (cfg: MapConfig) => {
        const el = ref.current
        if (!el) return

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

        if (!el.isConnected) {
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

        const map = generateMap(cfg)

        // Статистика
        const counts: Record<string, number> = {}
        const total = cfg.width * cfg.height
        for (const row of map)
            for (const t of row) {
                const name = TILE_NAMES[t]
                counts[name] = (counts[name] || 0) + 1
            }
        for (const k of Object.keys(counts)) counts[k] = Math.round((counts[k] / total) * 100)
        setStats(counts)

        rendRef.current = new MapRenderer({
            map,
            app,
            onHover: (t, gx, gy) => setHover(`${TILE_NAMES[t]} [${gx}, ${gy}]`),
            onHoverOut: () => setHover(null),
            onClick: (t, gx, gy) => console.log(`Click: ${TILE_NAMES[t]} (${gx},${gy})`)
        })

        setStatus('ready')
    }, [])

    useEffect(() => {
        if (initRef.current) return
        initRef.current = true
        boot(config)
        return () => {
            rendRef.current?.destroy()
            rendRef.current = null
            appRef.current?.destroy(true, { children: true })
            appRef.current = null
            initRef.current = false
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const regenerate = useCallback(
        (newCfg?: MapConfig) => {
            const cfg = newCfg ?? {
                ...config,
                seed: Math.floor(Math.random() * 999999)
            }
            setConfig(cfg)
            initRef.current = false
            boot(cfg)
            initRef.current = true
        },
        [config, boot]
    )

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <>
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    inset: 0,
                    overflow: 'hidden'
                }}
            />

            {status === 'loading' && <LoadingOverlay />}

            {status === 'ready' && (
                <GameHud
                    seed={config.seed ?? 0}
                    config={config}
                    stats={stats}
                    hover={hover}
                    onRegen={() => regenerate()}
                    onConfigChange={c => setConfig(c)}
                    onApply={c => regenerate(c)}
                />
            )}
        </>
    )
}
