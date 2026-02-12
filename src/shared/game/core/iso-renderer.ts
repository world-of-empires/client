import { Container, Sprite, Texture, Assets, Application, Graphics } from 'pixi.js'
import { TILE_TEXTURE_PATHS, TILE_COLORS, ISO_TILE_W, ISO_TILE_H, HALF_H, HALF_W } from '../constants'
import { TileType } from '../types'
import { Camera } from './camera'


// ==========================================
// ЗАГРУЗКА ТЕКСТУР
// ==========================================

let texturesLoaded = false
const textures: Partial<Record<TileType, Texture>> = {}

export async function loadTileTextures(): Promise<void> {
    if (texturesLoaded) return

    const entries = Object.entries(TILE_TEXTURE_PATHS) as [string, string][]

    // Загружаем все текстуры параллельно
    const promises = entries.map(async ([key, path]) => {
        try {
            const texture = await Assets.load(path)
            textures[Number(key) as TileType] = texture
        } catch (err) {
            console.warn(`Failed to load texture: ${path}`, err)
        }
    })

    await Promise.all(promises)
    texturesLoaded = true

    console.log(
        `✅ Loaded ${Object.keys(textures).length}/${entries.length} tile textures`
    )
}

function getTileTexture(type: TileType): Texture | null {
    return textures[type] ?? null
}


// ==========================================
// СОЗДАНИЕ ТАЙЛ-СПРАЙТА
// ==========================================

function createTileSprite(type: TileType): Container {
    const container = new Container()
    const texture = getTileTexture(type)

    if (texture) {
        // ---- PNG ТЕКСТУРА ----
        const sprite = new Sprite(texture)

        // Предполагаем PNG 64×64, ставим anchor в центр-верх ромба
        sprite.anchor.set(0.5, 0.5)

        // Если ваш PNG уже изометрический (ромб) — используем as-is
        // Если PNG квадратный (вид сверху) — нужна трансформация:
        //
        // Для квадратного тайла → изометрия:
        // sprite.scale.set(1, 0.5)
        // sprite.rotation = Math.PI / 4
        //
        // Для уже изометрического PNG — просто размер:
        sprite.width = ISO_TILE_W
        sprite.height = ISO_TILE_H

        container.addChild(sprite)
    } else {
        // ---- FALLBACK: цветной ромб ----
        const g = new Graphics()
        const color = TILE_COLORS[type]

        g.poly([
            { x: 0,   y: -HALF_H },
            { x: HALF_W,  y: 0 },
            { x: 0,   y: HALF_H },
            { x: -HALF_W, y: 0 },
        ])
        g.fill({ color })
        g.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 })

        container.addChild(g)
    }

    return container
}
