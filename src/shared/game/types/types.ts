// ==========================================
// ТАЙЛЫ
// ==========================================

export enum TileType {
    OCEAN   = 0,
    SEA     = 1,
    SHALLOW = 2,
    GRASS   = 3,
    PLAINS  = 4,
    DESERT  = 5,
    TAIGA   = 6,
    TUNDRA  = 7,
    SNOW    = 8,
}

// ==========================================
// КОНФИГУРАЦИЯ МАПЫ
// ==========================================

export interface MapConfig {
    width: number
    height: number
    seed?: number
    scale?: number
    oceanRatio?: number
    falloff?: number
}

// ==========================================
// ИЗОМЕТРИЧЕСКАЯ ТОЧКА
// ==========================================

export interface IsoPoint {
    x: number
    y: number
}