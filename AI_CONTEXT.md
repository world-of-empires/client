# Контекст для ИИ — World of Empires (client)

Документ описывает **уже реализованный код** проекта. Используй его вместе с **ARCHITECTURE.md** при генерации нового функционала.

**Перед генерацией кода:**
1. Прочитай **ARCHITECTURE.md** — правила, структура, именование.
2. Используй этот документ — что уже есть, какие API доступны.
3. Не дублируй существующий код. Используй готовые функции и компоненты.

---

## 1. Связь документов

| Документ | Назначение |
|----------|------------|
| **ARCHITECTURE.md** | Как устроен проект, куда класть файлы, правила именования |
| **AI_CONTEXT.md** (этот) | Что уже реализовано, какие функции есть, как их вызывать |

---

## 2. Модуль `@/game` — игровая логика

### 2.1. Типы

```ts
import { TileType, MapConfig, IsoPoint } from '@/game'
```

| Экспорт | Описание |
|---------|----------|
| `TileType` | enum: OCEAN, SEA, SHALLOW, GRASS, PLAINS, DESERT, TAIGA, TUNDRA, SNOW |
| `MapConfig` | `{ width, height, seed?, scale?, oceanRatio?, falloff? }` |
| `IsoPoint` | `{ x: number, y: number }` |

### 2.2. Константы

```ts
import { DEFAULT_MAP_W, DEFAULT_MAP_H, TILE_NAMES, TILE_COLORS } from '@/game'
```

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `DEFAULT_MAP_W` | `64` | Ширина карты по умолчанию |
| `DEFAULT_MAP_H` | `64` | Высота карты по умолчанию |
| `TILE_NAMES` | `Record<TileType, string>` | Названия биомов (ocean, grass, desert...) |
| `TILE_COLORS` | `Record<TileType, number>` | Hex-цвета для fallback (0x4caf50 и т.д.) |

### 2.3. Функции

```ts
import { generateMap } from '@/game'
```

| Функция | Сигнатура | Описание |
|---------|-----------|----------|
| `generateMap` | `(cfg: MapConfig) => TileType[][]` | Процедурная генерация карты (остров, биомы, водные зоны) |

### 2.4. Шум (noise)

```ts
import { Rng, noise2D, normalize } from '@/game'
```

| Экспорт | Описание |
|---------|----------|
| `Rng` | Класс: `new Rng(seed)`, метод `.next()` → [0, 1] |
| `noise2D` | `(w, h, scale, octaves, seed) => number[][]` — value noise |
| `normalize` | `(a: number[][], w, h) => void` — нормализация 2D-массива в [0, 1] |

---

## 3. Модуль `@/engine` — рендеринг (Pixi)

### 3.1. Текстуры

```ts
import { loadAllTileTextures, getLoadedCount } from '@/engine'
```

| Функция | Сигнатура | Описание |
|---------|-----------|----------|
| `loadAllTileTextures` | `() => Promise<void>` | Загружает все тайлы. Вызывать до рендера. |
| `getLoadedCount` | `() => number` | Количество загруженных текстур |

**Порядок:** `await loadAllTileTextures()` перед созданием `MapRenderer`.

### 3.2. MapRenderer

```ts
import { MapRenderer, gridToIso, type MapRendererOpts } from '@/engine'
```

| Экспорт | Описание |
|---------|----------|
| `MapRenderer` | Класс: рендерит `TileType[][]` в изометрическую карту |
| `gridToIso` | `(gx, gy) => { x, y }` — преобразование сетки в изо-координаты |
| `MapRendererOpts` | Интерфейс опций |

**MapRendererOpts:**
```ts
{
  map: TileType[][]
  app: Application  // Pixi Application
  onHover?: (type: TileType, gx: number, gy: number) => void
  onHoverOut?: () => void
  onClick?: (type: TileType, gx: number, gy: number) => void
}
```

**Инстанс:**

```ts
const renderer = new MapRenderer({ map, app, onHover, onClick })
renderer.world   // Container (Pixi)
renderer.camera  // Camera
renderer.destroy()
```

### 3.3. Camera

```ts
import { Camera } from '@/engine'
```

Создаётся внутри `MapRenderer`. Доступ к `renderer.camera`.

| Свойство/метод | Описание |
|----------------|----------|
| `camera.x`, `camera.y` | Позиция |
| `camera.zoom` | Масштаб (0.15–4) |
| `camera.centerOn(screenW, screenH, worldX, worldY)` | Центрирование |
| `camera.wasDrag` | `true` если был drag (не клик) |
| `camera.destroy()` | Снятие слушателей |

### 3.4. Tile factory

```ts
import { createTile } from '@/engine'
```

| Функция | Сигнатура | Описание |
|---------|-----------|----------|
| `createTile` | `(type: TileType) => Container` | Создаёт Pixi-спрайт тайла (текстура или fallback Graphics) |

**Использование:** внутри `MapRenderer`. Для кастомного рендера — импортировать из `@/engine`.

### 3.5. Константы engine (внутренние)

В `engine/constants.ts` (не экспортируются в index):

- `ISO_TILE_W = 64`, `ISO_TILE_H = 32`, `HALF_W`, `HALF_H`
- `TILE_TEXTURE_PATHS` — пути к PNG (`/assets/tilles/ocean.png` и т.д.)

---

## 4. Модули `@/modules/` — React

### 4.1. home

```ts
import { HomePage } from '@/modules/home'
```

| Компонент | Props | Описание |
|-----------|-------|----------|
| `HomePage` | — | Главная: приветствие + кнопка «Start Game» |

### 4.2. game

```ts
import { GamePage, GameLoader, GameCanvas } from '@/modules/game'
```

| Компонент | Props | Описание |
|-----------|-------|----------|
| `GamePage` | — | Обёртка: рендерит `GameLoader` |
| `GameLoader` | — | Dynamic import `GameCanvas` (ssr: false) + loading |
| `GameCanvas` | — | Полный экран: Pixi + HUD (Legend, Controls, Hint, HoverInfo) |

**Внутренние компоненты** (в `game-hud.tsx`, `loading-overlay.tsx`):

| Компонент | Props | Описание |
|-----------|-------|----------|
| `HoverInfo` | `{ text: string }` | Подсказка при наведении на тайл |
| `Controls` | `{ onRegen: () => void, seed: number }` | Кнопка «Новая карта» + seed |
| `Legend` | — | Легенда биомов (цвета + названия) |
| `Hint` | — | «Drag — перемещение | Scroll — зум» |
| `LoadingOverlay` | — | «Загрузка текстур и генерация мира...» |

---

## 5. App Router

| Маршрут | Файл | Компонент |
|---------|------|------------|
| `/` | `app/(root)/page.tsx` | `HomePage` |
| `/game` | `app/(root)/game/page.tsx` | `GamePage` |

---

## 6. Типичный сценарий генерации

### Добавить новый биом

1. Добавить в `TileType` (game/types/game-types.ts)
2. Добавить в `TILE_NAMES`, `TILE_COLORS` (game/constants/map-constants.ts)
3. Добавить путь в `TILE_TEXTURE_PATHS` (engine/constants.ts)
4. Добавить PNG в `public/assets/tilles/`
5. Обновить логику в `map-generator.ts` (если нужен новый биом в генерации)

### Добавить новый UI-элемент в игру

1. Создать `modules/game/ui/<имя>.tsx` (kebab-case)
2. Добавить re-export в `modules/game/ui/index.ts`
3. Добавить в `GameCanvas` или `GameHUD` при необходимости

### Добавить новую страницу

1. Создать `modules/<фича>/ui/<страница>.tsx`
2. Создать `modules/<фича>/ui/index.ts` и `modules/<фича>/index.ts`
3. Создать `app/(root)/<route>/page.tsx` с импортом из `@/modules/<фича>`

---

## 7. Промпт для ИИ (шаблон)

При обращении к ИИ можно использовать:

```
Проект: World of Empires (client). 
Архитектура: ARCHITECTURE.md
Реализованный код: AI_CONTEXT.md

Задача: [описание]

Учитывай:
- Существующие модули @/game, @/engine
- Не дублируй функции (generateMap, loadAllTileTextures, createTile и т.д.)
- Следуй kebab-case и структуре из ARCHITECTURE.md
```

---

*Документ актуален для версии 0.2.2. Обновляй при добавлении нового API.*

**Как обновлять:** см. DEVELOPER_GUIDE.md (раздел «Как правильно зафиксировать изменения»)
