import { DEFAULT_MAP_H, DEFAULT_MAP_W } from '../constants/dimensions'

export enum TileType {
    OCEAN   = 0,
    SEA     = 1,
    SHALLOW = 2,
    GRASS   = 3,
    PLAINS  = 4,
    DESERT  = 5,
    SNOW    = 6,
}

export interface IsoPoint {
    x: number
    y: number
}

// ==========================================
// ФОРМА СУШИ
// ==========================================

export enum LandMassType {
    PANGAEA     = 'pangaea',
    CONTINENTS  = 'continents',
    ARCHIPELAGO = 'archipelago',
    LAKES       = 'lakes',
    FRACTAL     = 'fractal',
}

// ==========================================
// ДОЛИ БИОМОВ
// ==========================================

export interface BiomeWeights {
    snow: number       // 0–100
    grass: number
    plains: number
    desert: number
}

// ==========================================
// КОНФИГ ГЕНЕРАЦИИ
// ==========================================

export interface MapConfig {
    width: number
    height: number
    seed?: number

    // форма суши
    landMass: LandMassType
    oceanRatio: number          // 0.0 (всё суша) → 1.0 (всё вода)
    noiseScale: number          // размер пятен (1–30)
    noiseOctaves: number        // детализация (1–8)
    islandCount: number         // центров масс (1–12)

    // климат
    temperatureBias: number     // -1 (ледник) → +1 (пустыня)
    moistureBias: number        // -1 (сухо) → +1 (влажно)

    // доли биомов
    biomeWeights: BiomeWeights
}

// ==========================================
// ПРЕСЕТЫ
// ==========================================

export const MAP_PRESETS: Record<string, Partial<MapConfig>> = {
    default: {
        landMass: LandMassType.CONTINENTS,
        oceanRatio: 0.35,
        noiseScale: 12,
        noiseOctaves: 5,
        islandCount: 2,
        temperatureBias: 0,
        moistureBias: 0,
        biomeWeights: { snow: 15, grass: 35, plains: 25, desert: 25 },
    },

    pangaea: {
        landMass: LandMassType.PANGAEA,
        oceanRatio: 0.25,
        noiseScale: 18,
        noiseOctaves: 4,
        islandCount: 1,
        temperatureBias: 0,
        moistureBias: 0,
        biomeWeights: { snow: 15, grass: 35, plains: 25, desert: 25 },
    },

    archipelago: {
        landMass: LandMassType.ARCHIPELAGO,
        oceanRatio: 0.55,
        noiseScale: 6,
        noiseOctaves: 6,
        islandCount: 8,
        temperatureBias: 0.2,
        moistureBias: 0.2,
        biomeWeights: { snow: 5, grass: 40, plains: 30, desert: 25 },
    },

    desert_world: {
        landMass: LandMassType.PANGAEA,
        oceanRatio: 0.2,
        noiseScale: 14,
        noiseOctaves: 4,
        islandCount: 1,
        temperatureBias: 0.6,
        moistureBias: -0.5,
        biomeWeights: { snow: 5, grass: 15, plains: 25, desert: 55 },
    },

    ice_age: {
        landMass: LandMassType.CONTINENTS,
        oceanRatio: 0.3,
        noiseScale: 12,
        noiseOctaves: 5,
        islandCount: 2,
        temperatureBias: -0.6,
        moistureBias: 0.3,
        biomeWeights: { snow: 50, grass: 25, plains: 15, desert: 10 },
    },

    lakes: {
        landMass: LandMassType.LAKES,
        oceanRatio: 0.15,
        noiseScale: 5,
        noiseOctaves: 6,
        islandCount: 1,
        temperatureBias: 0,
        moistureBias: 0.3,
        biomeWeights: { snow: 10, grass: 40, plains: 25, desert: 25 },
    },

    tropical: {
        landMass: LandMassType.ARCHIPELAGO,
        oceanRatio: 0.45,
        noiseScale: 8,
        noiseOctaves: 5,
        islandCount: 6,
        temperatureBias: 0.4,
        moistureBias: 0.5,
        biomeWeights: { snow: 0, grass: 45, plains: 30, desert: 25 },
    },
}

// ==========================================
// ХЕЛПЕРЫ
// ==========================================

export function getDefaultConfig(width: number = DEFAULT_MAP_W, height: number = DEFAULT_MAP_H): MapConfig {
    return {
        width,
        height,
        seed: Math.floor(Math.random() * 999999),
        ...(MAP_PRESETS.default as Required<Omit<MapConfig, 'width' | 'height' | 'seed'>>),
    }
}

export function applyPreset(base: MapConfig, presetName: string): MapConfig {
    const preset = MAP_PRESETS[presetName]
    if (!preset) return base
    return {
        ...base,
        ...preset,
        biomeWeights: { ...base.biomeWeights, ...(preset.biomeWeights ?? {}) },
        seed: Math.floor(Math.random() * 999999),
    }
}