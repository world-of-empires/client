import { TileType } from '../types'

// ==========================================
// РАЗМЕРЫ
// ==========================================

export const ISO_TILE_W = 64
export const ISO_TILE_H = 32
export const HALF_W = ISO_TILE_W / 2   // 32
export const HALF_H = ISO_TILE_H / 2   // 16

export const DEFAULT_MAP_W = 64
export const DEFAULT_MAP_H = 64

// ==========================================
// ПУТИ К ТЕКСТУРАМ
// ==========================================

export const TILE_TEXTURE_PATHS: Record<TileType, string> = {
    [TileType.OCEAN]:   '/assets/tilles/ocean.png',
    [TileType.SEA]:     '/assets/tilles/sea.png',
    [TileType.SHALLOW]: '/assets/tilles/shallow.png',
    [TileType.GRASS]:   '/assets/tilles/grass.png',
    [TileType.PLAINS]:  '/assets/tilles/plains.png',
    [TileType.DESERT]:  '/assets/tilles/desert.png',
    [TileType.TAIGA]:   '/assets/tilles/taiga.png',
    [TileType.TUNDRA]:  '/assets/tilles/tundra.png',
    [TileType.SNOW]:    '/assets/tilles/snow.png',
}

// ==========================================
// FALLBACK ЦВЕТА
// ==========================================

export const TILE_COLORS: Record<TileType, number> = {
    [TileType.OCEAN]:   0x0d47a1,
    [TileType.SEA]:     0x1565c0,
    [TileType.SHALLOW]: 0x42a5f5,
    [TileType.GRASS]:   0x4caf50,
    [TileType.PLAINS]:  0xc0ca33,
    [TileType.DESERT]:  0xffb74d,
    [TileType.TAIGA]:   0x2e7d32,
    [TileType.TUNDRA]:  0x78909c,
    [TileType.SNOW]:    0xe8eaf6,
}

// ==========================================
// НАЗВАНИЯ
// ==========================================

export const TILE_NAMES: Record<TileType, string> = {
    [TileType.OCEAN]:   'ocean',
    [TileType.SEA]:     'sea',
    [TileType.SHALLOW]: 'shallow',
    [TileType.GRASS]:   'grass',
    [TileType.PLAINS]:  'plains',
    [TileType.DESERT]:  'desert',
    [TileType.TAIGA]:   'taiga',
    [TileType.TUNDRA]:  'tundra',
    [TileType.SNOW]:    'snow',
}