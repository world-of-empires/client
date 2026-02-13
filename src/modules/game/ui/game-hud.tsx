'use client'

import { useState } from 'react'

import { SettingsPanel } from './settings-panel'
import { type MapConfig, TILE_COLORS, TILE_NAMES, TileType } from '@/game'

interface GameHudProps {
    seed: number
    config: MapConfig
    stats: Record<string, number>
    hover: string | null
    onRegen: () => void
    onConfigChange: (config: MapConfig) => void
    onApply: (config: MapConfig) => void
}

export function GameHud({ seed, config, stats, hover, onRegen, onConfigChange, onApply }: GameHudProps) {
    const [showSettings, setShowSettings] = useState(false)

    return (
        <>
            {/* Hover */}
            {hover && <HoverInfo text={hover} />}

            {/* Top bar */}
            <div className='fixed top-3 left-3 z-20 flex items-center gap-2'>
                <button onClick={onRegen} className={btnClass}>
                    🔄 Новая
                </button>

                <button onClick={() => setShowSettings(s => !s)} className={btnClass}>
                    ⚙️ Настройки
                </button>

                <span className='text-[11px] text-white/40'>seed: {seed}</span>
            </div>

            {/* Settings */}
            {showSettings && (
                <SettingsPanel
                    config={config}
                    stats={stats}
                    onChange={onConfigChange}
                    onApply={c => {
                        onApply(c)
                        setShowSettings(false)
                    }}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Legend */}
            <Legend />

            {/* Hint */}
            <Hint />
        </>
    )
}

function HoverInfo({ text }: { text: string }) {
    return (
        <div className='pointer-events-none fixed bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/80 px-3 py-1.5 text-sm text-white'>
            {text}
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
        <div className='fixed top-3 right-3 z-10 rounded-lg bg-black/75 px-3.5 py-2.5 text-[13px] leading-7 text-white'>
            <div className='mb-1 font-bold'>Биомы:</div>

            {tiles.map(t => (
                <div key={t} className='flex items-center gap-2'>
                    <span
                        className='inline-block h-3.5 w-3.5 rounded-[3px]'
                        style={{ background: toHexColor(TILE_COLORS[t]) }}
                    />
                    <span className='text-white/90'>{TILE_NAMES[t]}</span>
                </div>
            ))}
        </div>
    )
}

function Hint() {
    return (
        <div className='fixed bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-1.5 text-[13px] text-white/65'>
            🖱️ Drag — перемещение | Scroll — зум | ⚙️ — настройки
        </div>
    )
}

const btnClass =
    'rounded-lg border border-white/20 bg-black/75 px-4 py-2 text-sm text-white hover:bg-black/85 active:scale-[0.99]'

function toHexColor(color: number) {
    return '#' + (color >>> 0).toString(16).padStart(6, '0')
}
