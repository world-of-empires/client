import { MapConfig, TileType } from '../types'
import { noise2D, normalize } from '../noise'

export function generateMap(cfg: MapConfig): TileType[][] {
    const {
        width: W,
        height: H,
        seed = 42,
        scale = 12,
        oceanRatio = 0.35,
        falloff = 0.55
    } = cfg

    const elev = noise2D(W, H, scale, 5, seed)
    const temp = noise2D(W, H, scale * 1.8, 3, seed + 1111)
    const mois = noise2D(W, H, scale * 1.4, 3, seed + 2222)

    const cx = W / 2,
        cy = H / 2
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const dx = (x - cx) / cx,
                dy = (y - cy) / cy
            elev[y][x] = Math.max(0, elev[y][x] - Math.sqrt(dx * dx + dy * dy) * falloff)
        }
    normalize(elev, W, H)

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            temp[y][x] = (y / H) * 0.65 + temp[y][x] * 0.35

    const map: TileType[][] = Array.from({ length: H }, () => Array(W).fill(TileType.OCEAN))

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (elev[y][x] < oceanRatio) {
                map[y][x] = TileType.OCEAN
                continue
            }

            const t = temp[y][x],
                m = mois[y][x]

            if (t < 0.12) map[y][x] = TileType.SNOW
            else if (t < 0.22) map[y][x] = TileType.TUNDRA
            else if (t < 0.32) map[y][x] = TileType.TAIGA
            else if (t > 0.82) map[y][x] = TileType.DESERT
            else if (t > 0.7) map[y][x] = m > 0.45 ? TileType.PLAINS : TileType.DESERT
            else if (t > 0.6) map[y][x] = m > 0.35 ? TileType.GRASS : TileType.PLAINS
            else map[y][x] = TileType.GRASS
        }
    }

    waterZones(map, W, H)

    for (let i = 0; i < 3; i++) transitions(map, W, H)

    return map
}

function waterZones(map: TileType[][], W: number, H: number): void {
    const isW = (t: TileType) =>
        t === TileType.OCEAN || t === TileType.SEA || t === TileType.SHALLOW

    const dist: number[][] = Array.from({ length: H }, () => Array(W).fill(Infinity))
    const q: number[] = []

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            if (!isW(map[y][x])) {
                dist[y][x] = 0
                q.push(x, y)
            }

    let head = 0
    while (head < q.length) {
        const cx = q[head++],
            cy = q[head++],
            nd = dist[cy][cx] + 1
        for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ]) {
            const nx = cx + dx,
                ny = cy + dy
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
            if (dist[ny][nx] <= nd) continue
            dist[ny][nx] = nd
            q.push(nx, ny)
        }
    }

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            if (!isW(map[y][x])) continue
            const d = dist[y][x]
            map[y][x] = d <= 1 ? TileType.SHALLOW : d <= 3 ? TileType.SEA : TileType.OCEAN
        }
}

function transitions(map: TileType[][], W: number, H: number): void {
    const o = map.map(r => [...r])
    const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
    ]

    function has(x: number, y: number, ...types: TileType[]): boolean {
        for (const [dx, dy] of dirs) {
            const nx = x + dx,
                ny = y + dy
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && types.includes(o[ny][nx]))
                return true
        }
        return false
    }

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const c = o[y][x]

            if (c === TileType.GRASS && has(x, y, TileType.DESERT)) map[y][x] = TileType.PLAINS
            if (c === TileType.DESERT && has(x, y, TileType.GRASS)) map[y][x] = TileType.PLAINS

            if (c === TileType.GRASS && has(x, y, TileType.TUNDRA)) map[y][x] = TileType.TAIGA
            if (c === TileType.TUNDRA && has(x, y, TileType.GRASS)) map[y][x] = TileType.TAIGA

            if (c === TileType.GRASS && has(x, y, TileType.SNOW)) map[y][x] = TileType.TAIGA

            if (c === TileType.SNOW && has(x, y, TileType.GRASS)) map[y][x] = TileType.TUNDRA
            if (c === TileType.SNOW && has(x, y, TileType.TAIGA)) map[y][x] = TileType.TUNDRA
            if (c === TileType.SNOW && has(x, y, TileType.PLAINS)) map[y][x] = TileType.TUNDRA

            if (
                c === TileType.DESERT &&
                has(x, y, TileType.TAIGA, TileType.TUNDRA, TileType.SNOW)
            )
                map[y][x] = TileType.PLAINS

            if (c === TileType.PLAINS && has(x, y, TileType.TUNDRA, TileType.SNOW))
                map[y][x] = TileType.GRASS

            if (c === TileType.TAIGA && has(x, y, TileType.DESERT)) map[y][x] = TileType.GRASS
        }
    }
}
