import { Assets, Texture } from 'pixi.js'
import { TILE_TEXTURE_PATHS } from '../constants'
import { TileType } from '../types'

// ==========================================
// ХРАНИЛИЩЕ ТЕКСТУР
// ==========================================

const textureCache = new Map<TileType, Texture>()
let loaded = false

// ==========================================
// ЗАГРУЗКА
// ==========================================

export async function loadAllTileTextures(): Promise<void> {
    if (loaded) return

    // Шаг 1: Регистрируем все текстуры в Assets
    const entries = Object.entries(TILE_TEXTURE_PATHS) as [string, string][]

    for (const [key, path] of entries) {
        const alias = `tile_${key}`

        // Проверяем, не зарегистрирован ли уже
        // Assets.add в v8 принимает объект
        Assets.add({ alias, src: path })
    }

    // Шаг 2: Загружаем ВСЕ разом через bundle
    const aliases = entries.map(([key]) => `tile_${key}`)

    try {
        const results = await Assets.load(aliases)

        // Шаг 3: Сохраняем в кэш
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

        // Fallback: загружаем по одной
        for (const [key, path] of entries) {
            try {
                const texture = await Assets.load<Texture>(path)

                if (texture && !texture.destroyed) {
                    textureCache.set(Number(key) as TileType, texture)
                    console.log(`✅ Loaded: ${path}`)
                }
            } catch (e) {
                console.warn(`⚠️ Could not load: ${path}`, e)
            }
        }
    }

    loaded = true
    console.log(`🗺️ Textures loaded: ${textureCache.size}/${entries.length}`)

    // Debug: показываем что загрузилось
    for (const [type, tex] of textureCache) {
        console.log(
            `  Tile ${type}: ${tex.width}×${tex.height}, destroyed=${tex.destroyed}`
        )
    }
}

// ==========================================
// ПОЛУЧЕНИЕ ТЕКСТУРЫ
// ==========================================

export function getTileTexture(type: TileType): Texture | null {
    return textureCache.get(type) ?? null
}

export function hasTexture(type: TileType): boolean {
    return textureCache.has(type)
}

export function getLoadedCount(): number {
    return textureCache.size
}