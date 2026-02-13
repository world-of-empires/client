import { TileType, MapConfig, LandMassType } from '../types'
import { Rng, noise2D, normalize } from '../noise'

// ==========================================
// ПУБЛИЧНЫЙ API
// ==========================================

export function generateMap(cfg: MapConfig): TileType[][] {
    const W = cfg.width
    const H = cfg.height
    const seed = cfg.seed ?? 42

    const elev = noise2D(W, H, cfg.noiseScale, cfg.noiseOctaves, seed)
    const temp = noise2D(W, H, cfg.noiseScale * 1.8, 3, seed + 1111)
    const mois = noise2D(W, H, cfg.noiseScale * 1.4, 3, seed + 2222)

    applyLandShape(elev, W, H, cfg)
    applyTemperature(temp, W, H, cfg.temperatureBias)
    applyMoisture(mois, W, H, cfg.moistureBias)

    const map = assignBiomes(elev, temp, mois, W, H, cfg)

    applyWaterZones(map, W, H)
    for (let i = 0; i < 3; i++) applyTransitions(map, W, H)
    enforceShallowBorder(map, W, H)

    return map
}

// ==========================================
// УТИЛИТЫ
// ==========================================

const DIRS_8 = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
] as const

function isLand(t: TileType): boolean {
    return t >= TileType.GRASS && t <= TileType.SNOW
}

function isDeepWater(t: TileType): boolean {
    return t === TileType.OCEAN || t === TileType.SEA
}

// ==========================================
// ФОРМА СУШИ
// ==========================================

function applyLandShape(
    elev: number[][],
    W: number,
    H: number,
    cfg: MapConfig,
): void {
    const cx = W / 2
    const cy = H / 2

    switch (cfg.landMass) {
        case LandMassType.PANGAEA: {
            for (let y = 0; y < H; y++)
                for (let x = 0; x < W; x++) {
                    const dx = (x - cx) / cx
                    const dy = (y - cy) / cy
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    elev[y][x] = Math.max(0, elev[y][x] - Math.pow(dist, 1.5) * 0.8)
                }
            normalize(elev, W, H)
            break
        }

        case LandMassType.CONTINENTS: {
            const centers = generateCenters(cfg.islandCount || 2, W, H, cfg.seed ?? 42)
            applyMultiCenterFalloff(elev, W, H, centers, 0.6)
            break
        }

        case LandMassType.ARCHIPELAGO: {
            const count = cfg.islandCount || 8
            const centers = generateCenters(count, W, H, cfg.seed ?? 42)
            applyMultiCenterFalloff(elev, W, H, centers, 0.3)

            const extra = noise2D(W, H, cfg.noiseScale * 0.5, 3, (cfg.seed ?? 42) + 5555)
            for (let y = 0; y < H; y++)
                for (let x = 0; x < W; x++)
                    elev[y][x] *= 0.6 + extra[y][x] * 0.4
            normalize(elev, W, H)
            break
        }

        case LandMassType.LAKES: {
            for (let y = 0; y < H; y++)
                for (let x = 0; x < W; x++) {
                    const dx = (x - cx) / cx
                    const dy = (y - cy) / cy
                    elev[y][x] = Math.max(0, elev[y][x] - Math.sqrt(dx * dx + dy * dy) * 0.2)
                }

            const lakeNoise = noise2D(W, H, cfg.noiseScale * 0.7, 4, (cfg.seed ?? 42) + 7777)
            for (let y = 0; y < H; y++)
                for (let x = 0; x < W; x++) {
                    if (lakeNoise[y][x] < 0.25)
                        elev[y][x] *= lakeNoise[y][x] * 2
                }
            normalize(elev, W, H)
            break
        }

        case LandMassType.FRACTAL:
        default: {
            for (let y = 0; y < H; y++)
                for (let x = 0; x < W; x++) {
                    const dx = (x - cx) / cx
                    const dy = (y - cy) / cy
                    elev[y][x] = Math.max(0, elev[y][x] - Math.sqrt(dx * dx + dy * dy) * 0.55)
                }
            normalize(elev, W, H)
            break
        }
    }
}

function generateCenters(
    count: number,
    W: number,
    H: number,
    seed: number,
): Array<{ x: number; y: number; radius: number }> {
    const rng = new Rng(seed + 9999)
    const margin = 0.15

    return Array.from({ length: count }, () => ({
        x: (margin + rng.next() * (1 - margin * 2)) * W,
        y: (margin + rng.next() * (1 - margin * 2)) * H,
        radius: (0.2 + rng.next() * 0.3) * Math.min(W, H),
    }))
}

function applyMultiCenterFalloff(
    elev: number[][],
    W: number,
    H: number,
    centers: Array<{ x: number; y: number; radius: number }>,
    edgeFalloff: number,
): void {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            let minDist = Infinity
            for (const c of centers) {
                const dx = (x - c.x) / c.radius
                const dy = (y - c.y) / c.radius
                minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy))
            }

            const ex = Math.min(x, W - 1 - x) / (W * 0.15)
            const ey = Math.min(y, H - 1 - y) / (H * 0.15)
            const edgeDist = Math.min(1, Math.min(ex, ey))

            const falloff = Math.pow(Math.min(minDist, 2) / 2, 1.5) * edgeFalloff
            const edge = (1 - edgeDist) * 0.5

            elev[y][x] = Math.max(0, elev[y][x] - falloff - edge)
        }
    }

    normalize(elev, W, H)
}

// ==========================================
// ТЕМПЕРАТУРА + ВЛАЖНОСТЬ
// ==========================================

function applyTemperature(temp: number[][], W: number, H: number, bias: number): void {
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const latitude = y / H
            let t = latitude * 0.65 + temp[y][x] * 0.35
            t += bias * 0.3
            temp[y][x] = Math.max(0, Math.min(1, t))
        }
}

function applyMoisture(mois: number[][], W: number, H: number, bias: number): void {
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            mois[y][x] = Math.max(0, Math.min(1, mois[y][x] + bias * 0.3))
}

// ==========================================
// НАЗНАЧЕНИЕ БИОМОВ ПО ВЕСАМ
// Порядок: Snow(холод) → Grass → Plains → Desert(жара)
// ==========================================

function assignBiomes(
    elev: number[][],
    temp: number[][],
    mois: number[][],
    W: number,
    H: number,
    cfg: MapConfig,
): TileType[][] {
    const map: TileType[][] = Array.from({ length: H }, () => Array(W).fill(TileType.OCEAN))

    const bw = cfg.biomeWeights
    const total = bw.snow + bw.grass + bw.plains + bw.desert
    if (total === 0) return map

    const snowEnd   = bw.snow / total
    const grassEnd  = snowEnd + bw.grass / total
    const plainsEnd = grassEnd + bw.plains / total
    // desert = остаток до 1.0

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (elev[y][x] < cfg.oceanRatio) continue

            const t = temp[y][x]
            const m = mois[y][x]

            if (t < snowEnd) {
                map[y][x] = TileType.SNOW
            } else if (t < grassEnd) {
                map[y][x] = TileType.GRASS
            } else if (t < plainsEnd) {
                map[y][x] = m > 0.6 ? TileType.GRASS : TileType.PLAINS
            } else {
                map[y][x] = m > 0.5 ? TileType.PLAINS : TileType.DESERT
            }
        }
    }

    return map
}

// ==========================================
// ВОДНЫЕ ЗОНЫ
// ==========================================

function applyWaterZones(map: TileType[][], W: number, H: number): void {
    const dist: number[][] = Array.from({ length: H }, () => Array(W).fill(Infinity))
    const q: number[] = []

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            if (isLand(map[y][x])) {
                dist[y][x] = 0
                q.push(x, y)
            }

    let head = 0
    while (head < q.length) {
        const cx = q[head++]
        const cy = q[head++]
        const nd = dist[cy][cx] + 1
        for (const [dx, dy] of DIRS_8) {
            const nx = cx + dx
            const ny = cy + dy
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
            if (dist[ny][nx] <= nd) continue
            dist[ny][nx] = nd
            q.push(nx, ny)
        }
    }

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            if (isLand(map[y][x])) continue
            const d = dist[y][x]
            map[y][x] = d <= 1 ? TileType.SHALLOW : d <= 4 ? TileType.SEA : TileType.OCEAN
        }

    // Валидация: Sea/Ocean не касается суши
    let fixed = true
    while (fixed) {
        fixed = false
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                if (!isDeepWater(map[y][x])) continue
                for (const [dx, dy] of DIRS_8) {
                    const nx = x + dx
                    const ny = y + dy
                    if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
                    if (isLand(map[ny][nx])) {
                        map[y][x] = TileType.SHALLOW
                        fixed = true
                        break
                    }
                }
            }
    }
}

// ==========================================
// ФИНАЛЬНАЯ ВАЛИДАЦИЯ
// ==========================================

function enforceShallowBorder(map: TileType[][], W: number, H: number): void {
    let changed = true
    while (changed) {
        changed = false
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                if (isDeepWater(map[y][x])) {
                    for (const [dx, dy] of DIRS_8) {
                        const nx = x + dx
                        const ny = y + dy
                        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
                        if (isLand(map[ny][nx])) {
                            map[y][x] = TileType.SHALLOW
                            changed = true
                            break
                        }
                    }
                }
                if (isLand(map[y][x])) {
                    for (const [dx, dy] of DIRS_8) {
                        const nx = x + dx
                        const ny = y + dy
                        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
                        if (isDeepWater(map[ny][nx])) {
                            map[ny][nx] = TileType.SHALLOW
                            changed = true
                        }
                    }
                }
            }
    }
}

// ==========================================
// ПЕРЕХОДЫ СУШИ
// Snow ↔ Grass → через Plains (переходная зона)
// Grass ↔ Desert → через Plains
// ==========================================

function applyTransitions(map: TileType[][], W: number, H: number): void {
    const orig = map.map(r => [...r])

    function has(x: number, y: number, ...types: TileType[]): boolean {
        for (const [dx, dy] of DIRS_8) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && types.includes(orig[ny][nx]))
                return true
        }
        return false
    }

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const c = orig[y][x]
            if (!isLand(c)) continue

            // Grass рядом с Desert → Plains
            if (c === TileType.GRASS && has(x, y, TileType.DESERT))
                map[y][x] = TileType.PLAINS
            if (c === TileType.DESERT && has(x, y, TileType.GRASS))
                map[y][x] = TileType.PLAINS

            // Snow рядом с Grass → Plains
            if (c === TileType.SNOW && has(x, y, TileType.GRASS))
                map[y][x] = TileType.PLAINS
            if (c === TileType.GRASS && has(x, y, TileType.SNOW))
                map[y][x] = TileType.PLAINS

            // Snow рядом с Desert → Plains
            if (c === TileType.SNOW && has(x, y, TileType.DESERT))
                map[y][x] = TileType.PLAINS
            if (c === TileType.DESERT && has(x, y, TileType.SNOW))
                map[y][x] = TileType.PLAINS
        }
    }
}
