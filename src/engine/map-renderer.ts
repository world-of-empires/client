import { Container, Graphics, Application } from 'pixi.js'
import { TileType } from '@/game'
import { Camera } from './camera'
import { HALF_H, HALF_W } from './constants'
import { createTile } from './tile-factory'

export function gridToIso(gx: number, gy: number) {
    return {
        x: (gx - gy) * HALF_W,
        y: (gx + gy) * HALF_H
    }
}

export interface MapRendererOpts {
    map: TileType[][]
    app: Application
    onHover?: (type: TileType, gx: number, gy: number) => void
    onHoverOut?: () => void
    onClick?: (type: TileType, gx: number, gy: number) => void
}

export class MapRenderer {
    readonly world: Container
    readonly camera: Camera

    private highlight: Graphics | null = null
    private hx = -1
    private hy = -1
    private map: TileType[][]

    constructor(private opts: MapRendererOpts) {
        this.map = opts.map
        const H = opts.map.length
        const W = opts.map[0].length

        this.world = new Container()
        this.world.sortableChildren = true
        opts.app.stage.addChild(this.world)

        this.camera = new Camera(this.world, opts.app.canvas)

        this.renderTiles(W, H)

        const center = gridToIso(Math.floor(W / 2), Math.floor(H / 2))
        this.camera.centerOn(window.innerWidth, window.innerHeight, center.x, center.y)
    }

    private renderTiles(W: number, H: number) {
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const type = this.map[y][x]
                const tile = createTile(type)

                const iso = gridToIso(x, y)
                tile.x = iso.x
                tile.y = iso.y
                tile.zIndex = x + y

                tile.eventMode = 'static'
                tile.cursor = 'pointer'
                tile.hitArea = {
                    contains: (px: number, py: number) =>
                        Math.abs(px) / HALF_W + Math.abs(py) / HALF_H <= 1
                }

                tile.on('pointerover', () => this.showHighlight(x, y))
                tile.on('pointerout', () => this.hideHighlight())
                tile.on('pointertap', () => {
                    if (!this.camera.wasDrag) this.opts.onClick?.(type, x, y)
                })

                this.world.addChild(tile)
            }
        }
    }

    private showHighlight(gx: number, gy: number) {
        if (gx === this.hx && gy === this.hy) return
        this.hideHighlight()
        this.hx = gx
        this.hy = gy

        const iso = gridToIso(gx, gy)
        this.highlight = new Graphics()
        this.highlight.poly([
            { x: 0, y: -HALF_H },
            { x: HALF_W, y: 0 },
            { x: 0, y: HALF_H },
            { x: -HALF_W, y: 0 }
        ])
        this.highlight.stroke({ color: 0xffffff, width: 2, alpha: 0.85 })
        this.highlight.x = iso.x
        this.highlight.y = iso.y
        this.highlight.zIndex = 99999
        this.world.addChild(this.highlight)

        const type = this.map[gy]?.[gx]
        if (type !== undefined) this.opts.onHover?.(type, gx, gy)
    }

    private hideHighlight() {
        if (this.highlight) {
            this.highlight.destroy()
            this.highlight = null
        }
        this.hx = -1
        this.hy = -1
        this.opts.onHoverOut?.()
    }

    destroy() {
        this.camera.destroy()
        this.world.destroy({ children: true })
    }
}
