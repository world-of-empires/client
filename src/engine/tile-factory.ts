import { Container, Sprite, Graphics, Texture } from 'pixi.js'
import { TileType, TILE_COLORS } from '@/game'
import { HALF_W, HALF_H, ISO_TILE_W, ISO_TILE_H } from './constants'
import { getTileTexture } from './texture-loader'

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

function createTexturedTile(texture: Texture): Sprite {
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 0.5)

    const texW = texture.width
    const texH = texture.height

    if (texW === texH) {
        const s = ISO_TILE_W / texW
        sprite.scale.set(s, s * 0.5)
    } else if (texH < texW) {
        sprite.width = ISO_TILE_W
        sprite.height = ISO_TILE_H
    } else {
        sprite.width = ISO_TILE_W
        sprite.height = ISO_TILE_H
    }

    return sprite
}

function createColoredTile(type: TileType): Graphics {
    const g = new Graphics()
    const color = TILE_COLORS[type]
    g.poly([
        { x: 0, y: -HALF_H },
        { x: HALF_W, y: 0 },
        { x: 0, y: HALF_H },
        { x: -HALF_W, y: 0 }
    ])
    g.fill({ color })
    g.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 })
    return g
}
