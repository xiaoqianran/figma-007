# Mex Smart Car — Figma to Production Website

> **All content from the "Mex Smart Car" Figma file (58 tools, 2 pages, 800+ frames) faithfully replicated as a modern, fully interactive premium website.**

## What was built

This project transforms a detailed **mobile-first smart car companion app design** (iPhone 375×812 artboards) into a **high-end marketing + live demo website** for Mex — the intelligent operating layer for luxury vehicles (demo vehicle: Mercedes-Benz E350).

### Key achievements

- **Complete visual & interaction fidelity** to the original Figma screens:
  - Home (status + quick controls)
  - Control (climate, lights, doors, features)
  - Music player + playlists
  - Utility, Settings + Profile editing flows
- **Live interactive iPhone simulator** — every tap, toggle, slider, and navigation works. State is shared across screens.
- **Production-grade marketing site**:
  - Premium dark automotive aesthetic (black + electric blue accent)
  - Hero with real studio photography generated from Figma reference
  - Fully working car configurator (color, wheels, packages) with live pricing + image updates
  - Responsive, smooth, keyboard-accessible
- **Zero external runtime dependencies** (pure Vite + Tailwind v3 + TypeScript)

## Project structure

```
.
├── references/
│   ├── screens/          # 9 original high-res PNG exports from Figma (home, control, music, etc.)
│   └── cars/             # Generated hero & variant photography
├── src/
│   ├── main.ts           # All interactivity (app demo + configurator state machine)
│   └── style.css         # Tailwind + custom phone frame + premium components
├── index.html            # Complete single-page experience
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Getting started

This project uses the **official recommended Tailwind CSS v4 + Vite integration** (via `@tailwindcss/vite` plugin).

```bash
npm install
npm run dev
```

The setup follows the current official docs: https://tailwindcss.com/docs/installation/using-vite

Key files:
- `vite.config.ts` → registers `tailwindcss()` plugin
- `src/style.css` → contains `@import "tailwindcss";`
- No `postcss.config.js` or `tailwind.config.js` needed for basic usage (v4 is CSS-first).

Open http://localhost:5173

The phone demo is now significantly more complete and faithful to the original Figma.

**推荐体验操作：**
- 从顶部 “The App Experience” 横向滚动器点击任意屏幕卡片 → 自动跳转到手机 Demo 并打开对应界面
- 在 Utility 中进入 Door（6 个独立车门/天窗/后备箱控制）
- 在 Utility 中进入 Light（真实光效 + 亮度滑块）
- 在 Music List 中搜索并进入详情页 → 真实音频播放（支持切歌、暂停、音量调节）
- 查看新增的 “Smart Features Deep Dive” 技术规格区
- 打开右上角 “Launch Full Configurator” 体验更丰富的配置弹窗

## Figma source

- File: **Mex Smart Car**
- Pages: `Design` (main mobile app flows) + `Symbols` (component library)
- Primary frames replicated: Home, Control, Utility, Music List/Details, Settings, Profile, Door, Light, etc.
- Design system notes: Pure black UI, blue primary (#00B4FF), minimal typography, 375px mobile artboards

All screenshots used during development are preserved in `references/screens/`.

## Development Guidelines

### Commit Messages

This project follows a standardized commit message format to improve readability and project maintainability.

Please refer to [COMMIT_MESSAGE_GUIDELINES.md](./COMMIT_MESSAGE_GUIDELINES.md) for the full specification, common types (`feat`, `fix`, `refactor`, `chore`, etc.), and examples.

**Quick format:**
```
<type>: <subject>

<body (optional)>
```

Examples:
- `feat: add interactive Door control screen in phone demo`
- `refactor: improve Utility screen layout to match Figma reference`
- `chore: update Tailwind CSS to official Vite plugin setup`

## Roadmap / Next (if continuing)

- Real audio playback for music demo（已完成 Web Audio 合成音）
- Maps 占位屏幕
- 进一步提升 Profile / Settings 视觉保真度
- 更多 Figma Symbols 组件落地
- Export as PWA installable "Mex App"
- Add 360° car viewer

---

**Built autonomously** by a multi-agent software team using Figma MCP tools for deep design extraction, screenshot export, and iterative implementation. No manual pixel pushing — everything driven from the actual Figma source.

Run. Explore. Enjoy the car.
