import { Container } from 'pixi.js'

export class Camera {
    x = 0
    y = 0
    zoom = 0.8
    minZoom = 0.15
    maxZoom = 4

    private dragging = false
    private moved = false
    private startX = 0
    private startY = 0
    private camX0 = 0
    private camY0 = 0

    private boundMove: (e: PointerEvent) => void
    private boundUp: () => void

    constructor(
        private world: Container,
        private canvas: HTMLCanvasElement
    ) {
        this.boundMove = this.onMove.bind(this)
        this.boundUp = this.onUp.bind(this)
        this.attach()
    }

    private attach() {
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
        this.canvas.addEventListener('pointerdown', this.onDown)
        window.addEventListener('pointermove', this.boundMove)
        window.addEventListener('pointerup', this.boundUp)
        this.canvas.style.cursor = 'grab'
    }

    private onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const mx = e.offsetX
        const my = e.offsetY
        const wx = (mx - this.x) / this.zoom
        const wy = (my - this.y) / this.zoom
        this.zoom *= e.deltaY < 0 ? 1.15 : 0.87
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom))
        this.x = mx - wx * this.zoom
        this.y = my - wy * this.zoom
        this.apply()
    }

    private onDown = (e: PointerEvent) => {
        this.dragging = true
        this.moved = false
        this.startX = e.clientX
        this.startY = e.clientY
        this.camX0 = this.x
        this.camY0 = this.y
        this.canvas.style.cursor = 'grabbing'
    }

    private onMove(e: PointerEvent) {
        if (!this.dragging) return
        const dx = e.clientX - this.startX
        const dy = e.clientY - this.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.moved = true
        this.x = this.camX0 + dx
        this.y = this.camY0 + dy
        this.apply()
    }

    private onUp() {
        this.dragging = false
        this.canvas.style.cursor = 'grab'
    }

    get wasDrag() {
        return this.moved
    }

    apply() {
        this.world.x = this.x
        this.world.y = this.y
        this.world.scale.set(this.zoom)
    }

    centerOn(screenW: number, screenH: number, worldX: number, worldY: number) {
        this.x = screenW / 2 - worldX * this.zoom
        this.y = screenH / 2 - worldY * this.zoom
        this.apply()
    }

    destroy() {
        this.canvas.removeEventListener('wheel', this.onWheel)
        this.canvas.removeEventListener('pointerdown', this.onDown)
        window.removeEventListener('pointermove', this.boundMove)
        window.removeEventListener('pointerup', this.boundUp)
    }
}
