# Правила и архитектура проекта World of Empires (client)

Документ для использования при генерации кода через ИИ. Следуй этим правилам при создании или изменении файлов.

---

## 1. Архитектура приложения

### 1.1. Разделение слоёв

| Слой | Путь | Зависимости | Назначение |
|------|------|-------------|------------|
| **game** | `src/game/` | Нет (чистый TS) | Игровая логика: типы, константы, генерация карты, шум. Без React, без Pixi, без DOM. |
| **engine** | `src/engine/` | game, Pixi.js | Рендеринг: камера, карта, текстуры, тайлы. Pixi + DOM, без React. |
| **modules** | `src/modules/` | game, engine, React | React-компоненты, страницы, UI. |
| **app** | `src/app/` | modules | Next.js App Router. Только роутинг и layout. |

### 1.2. Зависимости между слоями

```
app  →  modules  →  engine
                 →  game
```

- `game` не импортирует из `engine`, `modules`, `app`
- `engine` импортирует только из `game` (типы, константы)
- `modules` импортирует из `game` и `engine`
- `app` импортирует только из `modules`

---

## 2. Структура каталогов

```
src/
├── app/                    # Next.js App Router
│   ├── (root)/
│   │   ├── page.tsx
│   │   └── game/
│   │       ├── page.tsx
│   │       └── layout.tsx
│   ├── layout.tsx
│   └── styles/
│
├── game/                   # Чистая игровая логика
│   ├── types/
│   │   ├── game-types.ts   # реализация
│   │   └── index.ts        # только re-export
│   ├── constants/
│   │   ├── map-constants.ts
│   │   └── index.ts
│   ├── noise/
│   │   ├── noise.ts
│   │   └── index.ts
│   ├── generator/
│   │   ├── map-generator.ts
│   │   └── index.ts
│   └── index.ts
│
├── engine/                 # Игровой движок (Pixi)
│   ├── camera.ts
│   ├── map-renderer.ts
│   ├── texture-loader.ts
│   ├── tile-factory.ts
│   ├── constants.ts
│   └── index.ts
│
└── modules/                # React-модули
    ├── home/
    │   ├── ui/
    │   │   ├── home-page.tsx
    │   │   └── index.ts
    │   └── index.ts
    └── game/
        ├── ui/
        │   ├── game-page.tsx
        │   ├── game-loader.tsx
        │   ├── game-canvas.tsx
        │   ├── game-hud.tsx
        │   ├── loading-overlay.tsx
        │   └── index.ts
        └── index.ts
```

---

## 3. Куда помещать файлы

| Тип кода | Куда |
|----------|------|
| Типы, интерфейсы, enum | `game/types/<имя>.ts` |
| Константы (размеры, цвета, названия) | `game/constants/<имя>-constants.ts` |
| Чистые функции (генерация, шум) | `game/generator/`, `game/noise/` |
| Pixi-рендеринг, камера | `engine/` |
| React-компоненты | `modules/<фича>/ui/` |
| Страницы Next.js | `app/(root)/<route>/page.tsx` |

---

## 4. Правила именования файлов

### 4.1. Kebab-case

Все имена файлов — в **kebab-case** (через дефис):

```
✅ game-canvas.tsx
✅ map-generator.ts
✅ loading-overlay.tsx
✅ game-types.ts

❌ GameCanvas.tsx
❌ mapGenerator.ts
❌ loading_overlay.tsx
```

### 4.2. Многословные имена

Для составных понятий используй дефис:

- `game-canvas` (не `gamecanvas`)
- `map-renderer` (не `maprenderer`)
- `texture-loader` (не `textureloader`)
- `home-page` (не `homepage`)

### 4.3. Расширения

- `.ts` — TypeScript без JSX
- `.tsx` — TypeScript с JSX (React)

---

## 5. Index-файлы (Public API)

**index.ts / index.tsx** — только re-export. Никакой реализации.

```ts
// ✅ Правильно
export * from './game-types'
export { GamePage } from './game-page'

// ❌ Неправильно — реализация в index
export enum TileType { ... }
export function generateMap() { ... }
```

Реализация — в отдельных файлах (`game-types.ts`, `map-generator.ts` и т.п.).

---

## 6. Path aliases

| Alias | Разрешение |
|-------|------------|
| `@/*` | `./src/*` |
| `@/game` | `./src/game/index.ts` |
| `@/engine` | `./src/engine/index.ts` |

Примеры импортов:

```ts
import { TileType, generateMap, TILE_NAMES } from '@/game'
import { MapRenderer, loadAllTileTextures } from '@/engine'
import { GamePage } from '@/modules/game'
```

---

## 7. Стиль кода (Prettier)

- Без точек с запятой (`semi: false`)
- Одинарные кавычки (`singleQuote: true`)
- Без trailing comma
- `printWidth: 120`
- `tabWidth: 4`
- `arrowParens: "avoid"` — `x => x` вместо `(x) => x` для одного аргумента

---

## 8. Импорты

Порядок импортов (Prettier):

1. Сторонние модули (`react`, `pixi.js`)
2. `@/app/*`
3. `@/modules/*`
4. `@/game`, `@/engine`
5. Относительные (`../`, `./`)

---

## 9. React-компоненты

- Именованный экспорт: `export function GameCanvas() { ... }`
- `'use client'` — для компонентов с хуками, ref, event handlers
- Динамический импорт для тяжёлых/клиентских модулей (Pixi): `dynamic(..., { ssr: false })`

---

## 10. App Router

- Страницы — в `app/(root)/<route>/page.tsx`
- Контент страницы — в модулях: `import { GamePage } from '@/modules/game'`
- В `app/` — только роутинг и layout, без бизнес-логики

---

## 11. Добавление новой фичи

1. Создать `modules/<фича>/ui/<компонент>.tsx` (kebab-case)
2. Создать `modules/<фича>/ui/index.ts` с re-export
3. Создать `modules/<фича>/index.ts` с re-export
4. Добавить страницу в `app/(root)/<route>/page.tsx` с импортом из `@/modules/<фича>`

Если нужна игровая логика — в `game/`. Если нужен рендеринг — в `engine/`.

---

*Документ актуален для версии 0.2.1*

**Как обновлять:** см. DEVELOPER_GUIDE.md
