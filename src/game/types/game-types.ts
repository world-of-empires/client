export enum TileType {
    OCEAN = 0,
    SEA = 1,
    SHALLOW = 2,
    GRASS = 3,
    PLAINS = 4,
    DESERT = 5,
    TAIGA = 6,
    TUNDRA = 7,
    SNOW = 8
}

export interface MapConfig {
    width: number
    height: number
    seed?: number
    scale?: number
    oceanRatio?: number
    falloff?: number
}

export interface IsoPoint {
    x: number
    y: number
}
