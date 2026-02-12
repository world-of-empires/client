import { Container, Sprite, Graphics, Texture } from 'pixi.js'
import { TileType } from '../types'
import { TILE_COLORS, HALF_W, HALF_H, ISO_TILE_W, ISO_TILE_H } from '../constants'
import { getTileTexture } from './texture-loader'

// ==========================================
// СОЗДАНИЕ ТАЙЛА
// ==========================================

/**
 * Создает тайл
 * @param type - тип тайла
 * @returns - контейнер с тайлом
 */
export function createTile(type: TileType): Container {
    const container = new Container()
    const texture = getTileTexture(type)

    if (texture) {
        container.addChild(createTexturedTile(texture))
    } else {
        container.addChild(createColoredTile(type))
    }

    return container
}

// ==========================================
// ВАРИАНТ 1: PNG ТЕКСТУРА
// ==========================================

/**
 * Создает текстурированный тайл
 * @param texture - текстура
 * @returns - спрайт с тайлом
 */
function createTexturedTile(texture: Texture): Sprite {
    const sprite = new Sprite(texture)

    // Anchor в центр спрайта
    sprite.anchor.set(0.5, 0.5)

    // =============================================
    // ВАЖНО: подгоняем размер PNG под изометрическую сетку
    //
    // Если ваш PNG 64×64 (квадрат, вид сверху):
    //   → нужно сжать по Y и повернуть
    //
    // Если ваш PNG уже изометрический ромб:
    //   → просто задаём размер
    //
    // Если ваш PNG 64×32 (уже правильные пропорции):
    //   → просто задаём размер
    // =============================================

    const texW = texture.width
    const texH = texture.height

    if (texW === texH) {
        // КВАДРАТНЫЙ PNG (64×64) → изометрическая трансформация
        // Масштабируем чтобы ширина = ISO_TILE_W
        const s = ISO_TILE_W / texW
        sprite.scale.set(s, s * 0.5)  // сжимаем по Y вдвое
    } else if (texH < texW) {
        // Уже широкий/плоский (возможно изометрический)
        sprite.width = ISO_TILE_W
        sprite.height = ISO_TILE_H
    } else {
        // Высокий PNG — подгоняем по ширине
        sprite.width = ISO_TILE_W
        sprite.height = ISO_TILE_H
    }

    return sprite
}

// ==========================================
// ВАРИАНТ 2: FALLBACK ЦВЕТНОЙ РОМБ
// ==========================================

/**
 * Создает цветной тайл
 * @param type - тип тайла
 * @returns - графический объект с тайлом
 */
function createColoredTile(type: TileType): Graphics {
    const g = new Graphics()
    const color = TILE_COLORS[type]

    g.poly([
        { x: 0,      y: -HALF_H },
        { x: HALF_W,  y: 0 },
        { x: 0,      y: HALF_H },
        { x: -HALF_W, y: 0 },
    ])
    g.fill({ color })
    g.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 })

    return g
}