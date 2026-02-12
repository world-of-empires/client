export class Rng {
    private s: number

    constructor(seed: number) {
        this.s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1
    }

    next(): number {
        this.s = (this.s * 16807) % 2147483647
        return (this.s - 1) / 2147483646
    }
}

function smooth(t: number): number {
    return t * t * (3 - 2 * t)
}

export function noise2D(
    w: number,
    h: number,
    scale: number,
    octaves: number,
    seed: number
): number[][] {
    const rng = new Rng(seed)
    const out: number[][] = Array.from({ length: h }, () => Array(w).fill(0))

    for (let o = 0; o < octaves; o++) {
        const freq = Math.pow(2, o) / scale
        const amp = Math.pow(0.5, o)
        const gs = Math.ceil(Math.max(w, h) * freq) + 2
        const grid: number[][] = Array.from({ length: gs }, () =>
            Array.from({ length: gs }, () => rng.next())
        )

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const fx = x * freq
                const fy = y * freq
                const ix = Math.floor(fx)
                const iy = Math.floor(fy)
                const sx = smooth(fx - ix)
                const sy = smooth(fy - iy)

                const v = (gx: number, gy: number) => grid[gy % gs]?.[gx % gs] ?? 0

                const top = v(ix, iy) + sx * (v(ix + 1, iy) - v(ix, iy))
                const bot = v(ix, iy + 1) + sx * (v(ix + 1, iy + 1) - v(ix, iy + 1))

                out[y][x] += (top + sy * (bot - top)) * amp
            }
        }
    }

    normalize(out, w, h)
    return out
}

export function normalize(a: number[][], w: number, h: number): void {
    let min = Infinity
    let max = -Infinity

    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            if (a[y][x] < min) min = a[y][x]
            if (a[y][x] > max) max = a[y][x]
        }

    const range = max - min || 1

    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) a[y][x] = (a[y][x] - min) / range
}
