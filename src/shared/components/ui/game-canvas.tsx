'use client'

import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'

export function GameCanvas() {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const initCalled = useRef(false)

    useEffect(() => {
        if (!containerRef.current || initCalled.current) return
        initCalled.current = true

        const container = containerRef.current

        async function initApp() {
            const app = new Application()

            await app.init({
                // Берём размеры окна
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x1e1e1e,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                // Растягиваем canvas на весь контейнер
                resizeTo: window
            })

            if (!container.isConnected) {
                app.destroy(true, { children: true })
                return
            }

            appRef.current = app
            container.appendChild(app.canvas)

            // Стили canvas — на весь экран
            app.canvas.style.position = 'fixed'
            app.canvas.style.top = '0'
            app.canvas.style.left = '0'
            app.canvas.style.width = '100%'
            app.canvas.style.height = '100%'

            // Пример объекта
            const graphics = new Graphics().rect(100, 100, 200, 200).fill({ color: 0x00ff00 })

            app.stage.addChild(graphics)

            // Game loop
            app.ticker.add(ticker => {
                graphics.rotation += 0.01 * ticker.deltaTime
            })
        }

        initApp()

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true, { children: true })
                appRef.current = null
            }
            initCalled.current = false
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden'
            }}
        />
    )
}
