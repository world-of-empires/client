import { TileType } from '@/game'

// Изометрические размеры тайла
export const ISO_TILE_W = 64
export const ISO_TILE_H = 32
export const HALF_W = ISO_TILE_W / 2
export const HALF_H = ISO_TILE_H / 2

// Пути к текстурам
export const TILE_TEXTURE_PATHS: Record<TileType, string> = {
    [TileType.OCEAN]: '/assets/tilles/ocean.png',
    [TileType.SEA]: '/assets/tilles/sea.png',
    [TileType.SHALLOW]: '/assets/tilles/shallow.png',
    [TileType.GRASS]: '/assets/tilles/grass.png',
    [TileType.PLAINS]: '/assets/tilles/plains.png',
    [TileType.DESERT]: '/assets/tilles/desert.png',
    [TileType.SNOW]: '/assets/tilles/snow.png'
}
