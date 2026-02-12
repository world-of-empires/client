import { Assets, Texture } from 'pixi.js'
import { TileType } from '@/game'
import { TILE_TEXTURE_PATHS } from './constants'

const textureCache = new Map<TileType, Texture>()
let loaded = false

export async function loadAllTileTextures(): Promise<void> {
    if (loaded) return

    const entries = Object.entries(TILE_TEXTURE_PATHS) as [string, string][]

    for (const [key, path] of entries) {
        Assets.add({ alias: `tile_${key}`, src: path })
    }

    const aliases = entries.map(([key]) => `tile_${key}`)

    try {
        const results = await Assets.load(aliases)
        for (const [key] of entries) {
            const alias = `tile_${key}`
            const texture = results[alias] as Texture | undefined
            if (texture && !texture.destroyed) {
                textureCache.set(Number(key) as TileType, texture)
            } else {
                console.warn(`⚠️ Texture invalid or missing: ${alias}`)
            }
        }
    } catch (err) {
        console.error('❌ Failed to load textures as bundle, trying one by one...', err)
        for (const [key, path] of entries) {
            try {
                const texture = await Assets.load<Texture>(path)
                if (texture && !texture.destroyed) {
                    textureCache.set(Number(key) as TileType, texture)
                }
            } catch (e) {
                console.warn(`⚠️ Could not load: ${path}`, e)
            }
        }
    }

    loaded = true
    console.log(`🗺️ Textures loaded: ${textureCache.size}/${entries.length}`)
}

export function getTileTexture(type: TileType): Texture | null {
    return textureCache.get(type) ?? null
}

export function getLoadedCount(): number {
    return textureCache.size
}
