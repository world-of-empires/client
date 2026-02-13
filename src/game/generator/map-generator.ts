import { MapConfig, TileType } from "../types"
import { noise2D, normalize } from '../noise'

export function generateMap(cfg: MapConfig): TileType[][] {
    const {
        width: W,
        height: H,
        seed = 42,
        scale = 12,
        oceanRatio = 0.35,
        falloff = 0.55,
    } = cfg

    const elev = noise2D(W, H, scale, 5, seed)
    const temp = noise2D(W, H, scale * 1.8, 3, seed + 1111)
    const mois = noise2D(W, H, scale * 1.4, 3, seed + 2222)

    applyIslandFalloff(elev, W, H, falloff)
    applyTemperatureGradient(temp, W, H)

    const map = assignBaseBiomes(elev, temp, mois, W, H, oceanRatio)

    // Водные зоны — НОВАЯ ВЕРСИЯ
    applyWaterZones(map, W, H)

    // Переходы суши
    for (let i = 0; i < 3; i++) applyTransitions(map, W, H)

    // ФИНАЛЬНАЯ ВАЛИДАЦИЯ — гарантия что Sea/Ocean не касаются суши
    enforceShallowBorder(map, W, H)

    return map
}

// ==========================================
// ISLAND FALLOFF
// ==========================================

function applyIslandFalloff(
    elev: number[][], W: number, H: number, falloff: number,
): void {
    const cx = W / 2
    const cy = H / 2

    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const dx = (x - cx) / cx
            const dy = (y - cy) / cy
            elev[y][x] = Math.max(0, elev[y][x] - Math.sqrt(dx * dx + dy * dy) * falloff)
        }

    normalize(elev, W, H)
}

// ==========================================
// TEMPERATURE
// ==========================================

function applyTemperatureGradient(
    temp: number[][], W: number, H: number,
): void {
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            temp[y][x] = (y / H) * 0.65 + temp[y][x] * 0.35
}

// ==========================================
// BASE BIOMES
// ==========================================

function assignBaseBiomes(
    elev: number[][], temp: number[][], mois: number[][],
    W: number, H: number, oceanRatio: number,
): TileType[][] {
    const map: TileType[][] = Array.from({ length: H }, () =>
        Array(W).fill(TileType.OCEAN),
    )

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (elev[y][x] < oceanRatio) continue

            const t = temp[y][x]
            const m = mois[y][x]

            if      (t < 0.12) map[y][x] = TileType.SNOW
            else if (t < 0.22) map[y][x] = TileType.TUNDRA
            else if (t < 0.32) map[y][x] = TileType.TAIGA
            else if (t > 0.82) map[y][x] = TileType.DESERT
            else if (t > 0.70) map[y][x] = m > 0.45 ? TileType.PLAINS : TileType.DESERT
            else if (t > 0.60) map[y][x] = m > 0.35 ? TileType.GRASS : TileType.PLAINS
            else               map[y][x] = TileType.GRASS
        }
    }

    return map
}

// ==========================================
// УТИЛИТЫ
// ==========================================

// 8 направлений — включая диагонали
const DIRS_8 = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
] as const

// 4 направления
const DIRS_4 = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
] as const

function isLand(t: TileType): boolean {
    return (
        t === TileType.GRASS  ||
        t === TileType.PLAINS ||
        t === TileType.DESERT ||
        t === TileType.TAIGA  ||
        t === TileType.TUNDRA ||
        t === TileType.SNOW
    )
}

function isDeepWater(t: TileType): boolean {
    return t === TileType.OCEAN || t === TileType.SEA
}

// ==========================================
// ВОДНЫЕ ЗОНЫ — ИСПРАВЛЕННАЯ ВЕРСИЯ
// ==========================================
// 
// Правило:
//   1. BFS по 8 направлениям от суши
//   2. dist = 1 → Shallow (прибрежная зона)
//   3. dist = 2..4 → Sea
//   4. dist > 4 → Ocean
//   5. ВАЛИДАЦИЯ: любой Sea/Ocean рядом (8 dir) с сушей → Shallow
//
// Это гарантирует что между сушей и Sea/Ocean
// ВСЕГДА есть минимум 1 тайл Shallow
// ==========================================

function applyWaterZones(map: TileType[][], W: number, H: number): void {
    // Шаг 1: BFS по 8 НАПРАВЛЕНИЯМ от суши
    const dist: number[][] = Array.from({ length: H }, () =>
        Array(W).fill(Infinity),
    )
    const q: number[] = [] // [x, y, x, y, ...]

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

        // BFS по 8 направлениям!
        for (const [dx, dy] of DIRS_8) {
            const nx = cx + dx
            const ny = cy + dy
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
            if (dist[ny][nx] <= nd) continue
            dist[ny][nx] = nd
            q.push(nx, ny)
        }
    }

    // Шаг 2: Назначаем водные зоны
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            if (isLand(map[y][x])) continue

            const d = dist[y][x]

            if (d <= 1) {
                map[y][x] = TileType.SHALLOW
            } else if (d <= 4) {
                map[y][x] = TileType.SEA
            } else {
                map[y][x] = TileType.OCEAN
            }
        }

    // Шаг 3: Валидация — ни один Sea/Ocean не должен касаться суши
    // (даже по диагонали)
    let fixed = true
    while (fixed) {
        fixed = false
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (!isDeepWater(map[y][x])) continue

                // Проверяем ВСЕ 8 соседей
                let touchesLand = false
                for (const [dx, dy] of DIRS_8) {
                    const nx = x + dx
                    const ny = y + dy
                    if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
                    if (isLand(map[ny][nx])) {
                        touchesLand = true
                        break
                    }
                }

                if (touchesLand) {
                    map[y][x] = TileType.SHALLOW
                    fixed = true
                }
            }
        }
    }
}

// ==========================================
// ФИНАЛЬНАЯ ВАЛИДАЦИЯ
// ==========================================
// Последний проход ПОСЛЕ всех переходов —
// гарантирует что никакие изменения в transitions
// не сломали правило "Shallow между сушей и водой"
// ==========================================

function enforceShallowBorder(map: TileType[][], W: number, H: number): void {
    let changed = true

    while (changed) {
        changed = false

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const current = map[y][x]

                // Правило A: Sea/Ocean касается суши → стать Shallow
                if (isDeepWater(current)) {
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

                // Правило B: Суша касается Ocean → 
                // соседний Ocean должен стать Shallow
                // (дополнительная защита)
                if (isLand(current)) {
                    for (const [dx, dy] of DIRS_8) {
                        const nx = x + dx
                        const ny = y + dy
                        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
                        if (map[ny][nx] === TileType.OCEAN || map[ny][nx] === TileType.SEA) {
                            map[ny][nx] = TileType.SHALLOW
                            changed = true
                        }
                    }
                }
            }
        }
    }

    // Финальная проверка: Sea не должна касаться суши
    // (только Shallow может)
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (map[y][x] !== TileType.SEA) continue

            for (const [dx, dy] of DIRS_8) {
                const nx = x + dx
                const ny = y + dy
                if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue

                // Sea рядом с Shallow — OK
                // Sea рядом с Ocean — OK
                // Sea рядом с Sea — OK
                // Sea рядом с сушей — НЕТ!
                if (isLand(map[ny][nx])) {
                    map[y][x] = TileType.SHALLOW
                    break
                }
            }
        }
    }
}

// ==========================================
// ПЕРЕХОДЫ СУШИ
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

            // Только сухопутные переходы — НЕ трогаем водные тайлы
            if (!isLand(c)) continue

            // Grass ↔ Desert → Plains
            if (c === TileType.GRASS && has(x, y, TileType.DESERT))
                map[y][x] = TileType.PLAINS
            if (c === TileType.DESERT && has(x, y, TileType.GRASS))
                map[y][x] = TileType.PLAINS

            // Grass ↔ Tundra → Taiga
            if (c === TileType.GRASS && has(x, y, TileType.TUNDRA))
                map[y][x] = TileType.TAIGA
            if (c === TileType.TUNDRA && has(x, y, TileType.GRASS))
                map[y][x] = TileType.TAIGA

            // Grass ↔ Snow → Taiga
            if (c === TileType.GRASS && has(x, y, TileType.SNOW))
                map[y][x] = TileType.TAIGA

            // Snow ↔ Grass → Tundra
            if (c === TileType.SNOW && has(x, y, TileType.GRASS))
                map[y][x] = TileType.TUNDRA

            // Snow ↔ Taiga → Tundra
            if (c === TileType.SNOW && has(x, y, TileType.TAIGA))
                map[y][x] = TileType.TUNDRA

            // Snow ↔ Plains → Tundra
            if (c === TileType.SNOW && has(x, y, TileType.PLAINS))
                map[y][x] = TileType.TUNDRA

            // Desert ↔ холодные → Plains
            if (c === TileType.DESERT && has(x, y, TileType.TAIGA, TileType.TUNDRA, TileType.SNOW))
                map[y][x] = TileType.PLAINS

            // Plains ↔ холодные → Grass
            if (c === TileType.PLAINS && has(x, y, TileType.TUNDRA, TileType.SNOW))
                map[y][x] = TileType.GRASS

            // Taiga ↔ Desert → Grass
            if (c === TileType.TAIGA && has(x, y, TileType.DESERT))
                map[y][x] = TileType.GRASS
        }
    }
}