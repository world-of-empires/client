import { TileType } from '../types'

export const TILE_NAMES: Record<TileType, string> = {
    [TileType.OCEAN]: 'ocean',
    [TileType.SEA]: 'sea',
    [TileType.SHALLOW]: 'shallow',
    [TileType.GRASS]: 'grass',
    [TileType.PLAINS]: 'plains',
    [TileType.DESERT]: 'desert',
    [TileType.TAIGA]: 'taiga',
    [TileType.TUNDRA]: 'tundra',
    [TileType.SNOW]: 'snow'
}

export const TILE_COLORS: Record<TileType, number> = {
    [TileType.OCEAN]: 0x0d47a1,
    [TileType.SEA]: 0x1565c0,
    [TileType.SHALLOW]: 0x42a5f5,
    [TileType.GRASS]: 0x4caf50,
    [TileType.PLAINS]: 0xc0ca33,
    [TileType.DESERT]: 0xffb74d,
    [TileType.TAIGA]: 0x2e7d32,
    [TileType.TUNDRA]: 0x78909c,
    [TileType.SNOW]: 0xe8eaf6
}
