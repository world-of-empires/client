'use client'

import React from 'react'

import { type BiomeWeights, LandMassType, MAP_PRESETS, type MapConfig, applyPreset } from '@/game'
import { TILE_COLORS, TILE_NAMES, TileType } from '@/game'

interface SettingsPanelProps {
    config: MapConfig
    stats: Record<string, number>
    onChange: (config: MapConfig) => void
    onApply: (config: MapConfig) => void
    onClose: () => void
}

export function SettingsPanel({ config, stats, onChange, onApply, onClose }: SettingsPanelProps) {
    const update = (partial: Partial<MapConfig>) => onChange({ ...config, ...partial })

    const updateBiome = (key: keyof BiomeWeights, value: number) => {
        onChange({ ...config, biomeWeights: { ...config.biomeWeights, [key]: value } })
    }

    const selectPreset = (name: string) => {
        const newCfg = applyPreset(config, name)
        onChange(newCfg)
        onApply(newCfg)
    }

    return (
        <div className='fixed top-[60px] left-3 z-20 max-h-[calc(100vh-100px)] w-[320px] overflow-y-auto rounded-xl border border-white/15 bg-black/90 p-4 text-sm text-white backdrop-blur-md'>
            {/* Header */}
            <div className='mb-3 flex items-center justify-between'>
                <b className='text-base'>⚙️ Настройки карты</b>
                <button
                    onClick={onClose}
                    className='rounded-lg border border-white/20 bg-white/10 px-2 py-[2px] text-xs hover:bg-white/15'
                >
                    ✕
                </button>
            </div>

            {/* Presets */}
            <Section title='🎯 Пресеты'>
                <div className='flex flex-wrap gap-1'>
                    {Object.keys(MAP_PRESETS).map(name => (
                        <button
                            key={name}
                            onClick={() => selectPreset(name)}
                            className='rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] capitalize hover:bg-white/15'
                        >
                            {PRESET_LABELS[name] ?? name}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Land Shape */}
            <Section title='🌍 Форма суши'>
                <select
                    value={config.landMass}
                    onChange={e => update({ landMass: e.target.value as LandMassType })}
                    className='mb-2 w-full rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm'
                >
                    <option value={LandMassType.PANGAEA}>Пангея (1 континент)</option>
                    <option value={LandMassType.CONTINENTS}>Континенты (2-3)</option>
                    <option value={LandMassType.ARCHIPELAGO}>Архипелаг (острова)</option>
                    <option value={LandMassType.LAKES}>Суша с озёрами</option>
                    <option value={LandMassType.FRACTAL}>Фрактальная</option>
                </select>

                <Slider
                    label='Доля воды'
                    value={config.oceanRatio}
                    min={0}
                    max={0.8}
                    step={0.05}
                    display={`${Math.round(config.oceanRatio * 100)}%`}
                    onChange={v => update({ oceanRatio: v })}
                />
                <Slider
                    label='Масштаб шума'
                    value={config.noiseScale}
                    min={3}
                    max={25}
                    step={1}
                    display={`${config.noiseScale}`}
                    onChange={v => update({ noiseScale: v })}
                />
                <Slider
                    label='Детализация'
                    value={config.noiseOctaves}
                    min={1}
                    max={8}
                    step={1}
                    display={`${config.noiseOctaves}`}
                    onChange={v => update({ noiseOctaves: v })}
                />
                <Slider
                    label='Центров масс'
                    value={config.islandCount}
                    min={1}
                    max={12}
                    step={1}
                    display={`${config.islandCount}`}
                    onChange={v => update({ islandCount: v })}
                />
            </Section>

            {/* Climate */}
            <Section title='🌡️ Климат'>
                <Slider
                    label='Температура'
                    value={config.temperatureBias}
                    min={-1}
                    max={1}
                    step={0.1}
                    display={tempLabel(config.temperatureBias)}
                    onChange={v => update({ temperatureBias: v })}
                />
                <Slider
                    label='Влажность'
                    value={config.moistureBias}
                    min={-1}
                    max={1}
                    step={0.1}
                    display={moistLabel(config.moistureBias)}
                    onChange={v => update({ moistureBias: v })}
                />
            </Section>

            {/* Biome Weights */}
            <Section title='🌿 Доли биомов'>
                <BiomeSlider label='❄️ Snow' value={config.biomeWeights.snow} onChange={v => updateBiome('snow', v)} />
                <BiomeSlider
                    label='🌿 Grass'
                    value={config.biomeWeights.grass}
                    onChange={v => updateBiome('grass', v)}
                />
                <BiomeSlider
                    label='🌾 Plains'
                    value={config.biomeWeights.plains}
                    onChange={v => updateBiome('plains', v)}
                />
                <BiomeSlider
                    label='🏜️ Desert'
                    value={config.biomeWeights.desert}
                    onChange={v => updateBiome('desert', v)}
                />
            </Section>

            {/* Stats */}
            {Object.keys(stats).length > 0 && (
                <Section title='📊 Текущая карта'>
                    {Object.entries(stats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, pct]) => (
                            <div key={name} className='mb-1 flex items-center gap-2'>
                                <div
                                    className='h-2 min-w-1 rounded-sm'
                                    style={{
                                        width: `${Math.max(pct, 2)}%`,
                                        background: getBiomeColor(name)
                                    }}
                                />
                                <span className='text-[11px] opacity-70'>
                                    {name} {pct}%
                                </span>
                            </div>
                        ))}
                </Section>
            )}

            {/* Apply */}
            <button
                onClick={() => onApply({ ...config, seed: Math.floor(Math.random() * 999999) })}
                className='mt-2 w-full rounded-lg bg-green-500 px-3 py-2 font-bold text-white hover:bg-green-600'
            >
                🔄 Применить и сгенерировать
            </button>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className='mb-4'>
            <div className='mb-1 border-b border-white/10 pb-1 text-sm font-semibold'>{title}</div>
            {children}
        </div>
    )
}

function Slider({
    label,
    value,
    min,
    max,
    step,
    display,
    onChange
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    display: string
    onChange: (v: number) => void
}) {
    return (
        <div className='mb-2'>
            <div className='mb-1 flex justify-between'>
                <span className='text-sm'>{label}</span>
                <span className='text-[11px] opacity-60'>{display}</span>
            </div>
            <input
                type='range'
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className='w-full accent-green-500'
            />
        </div>
    )
}

function BiomeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className='mb-1 flex items-center gap-2'>
            <span className='w-20 shrink-0 text-sm'>{label}</span>
            <input
                type='range'
                min={0}
                max={100}
                step={1}
                value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className='flex-1 accent-green-500'
            />
            <span className='w-8 text-right text-[11px] opacity-60'>{value}</span>
        </div>
    )
}

const PRESET_LABELS: Record<string, string> = {
    default: 'Стандарт',
    pangaea: 'Пангея',
    archipelago: 'Архипелаг',
    desert_world: 'Пустыня',
    ice_age: 'Ледник',
    lakes: 'Озёра',
    tropical: 'Тропики'
}

function tempLabel(v: number): string {
    if (v > 0.3) return `+${v.toFixed(1)} 🔥 жарко`
    if (v > 0) return `+${v.toFixed(1)} тепло`
    if (v < -0.3) return `${v.toFixed(1)} 🥶 холодно`
    if (v < 0) return `${v.toFixed(1)} прохладно`
    return '0 норма'
}

function moistLabel(v: number): string {
    if (v > 0.3) return `+${v.toFixed(1)} 💧 влажно`
    if (v > 0) return `+${v.toFixed(1)} умеренно`
    if (v < -0.3) return `${v.toFixed(1)} 🏜️ сухо`
    if (v < 0) return `${v.toFixed(1)} суховато`
    return '0 норма'
}

function getBiomeColor(name: string): string {
    const entry = Object.entries(TILE_NAMES).find(([, v]) => v === name)
    if (!entry) return '#666666'
    const color = TILE_COLORS[Number(entry[0]) as TileType]
    return '#' + (color >>> 0).toString(16).padStart(6, '0')
}
