# DXF-Generator: Copilot Instructions

## Project Overview

A React + Vite web application that generates DXF (CAD drawing) files from room dimensions. Users input room measurements (width, depth, wall thickness, unit) and download a DXF file with outer and inner wall contours.

**Key Stack:** React 19, Vite 7, `dxf-writer` library, Tailwind CSS (inline), React Compiler enabled

## Architecture

### Data Flow
1. **App.jsx** (main component): Holds config state (width, depth, wallThickness, unit)
2. **RoomForm.jsx**: Form inputs → updates config via `onChange` callback
3. **generateRoomDXF.js**: Pure function converting config → DXF string
4. **Download**: DXF string → Blob → browser download via `<a>` element

### Key Files & Responsibilities

| File | Purpose |
|------|---------|
| [src/App.jsx](src/App.jsx) | State management, DXF generation trigger, file download orchestration |
| [src/components/RoomForm.jsx](src/components/RoomForm.jsx) | Form UI with 4 inputs (width, depth, wallThickness, unit) |
| [src/dxf/generateRoomDXF.js](src/dxf/generateRoomDXF.js) | DXF generation logic: unit conversion → Drawing API calls |
| [src/components/PreviewPlaceholder.jsx](src/components/PreviewPlaceholder.jsx) | Placeholder (future 2D room preview) |

## Critical Patterns & Conventions

### Unit Handling
- **Input units**: User selects "m" (meters) or "cm" (centimeters)
- **Internal**: All calculations in millimeters via `convertToMm()`
- **DXF**: Drawing is marked as "Millimeters" in DXF header

Example from [src/dxf/generateRoomDXF.js](src/dxf/generateRoomDXF.js#L5-L9):
```javascript
function convertToMm(value, unit) {
  if (unit === "m") return value * 1000;
  if (unit === "cm") return value * 10;
  return value;
}
```

### DXF Generation
- Uses `dxf-writer` library's `Drawing` class (NOT `dxf` or `DxfWriter`)
- Creates two layers: "WAND_AUSSEN" (red, ACI=1) and "WAND_INNEN" (yellow, ACI=2)
- Outer rectangle: (0,0) to (widthMm, depthMm)
- Inner rectangle: offset by wall thickness on all sides
- Export via `toDxfString()` (not `stringify()` or other naming)

### Component Props Pattern
- Functional components only (no class components)
- Props drilling for simple state (config state lives in App, passed down)
- Event handlers use arrow function factories: `(field) => (e) => { ... }`

## Development Workflows

### Local Development
```bash
npm run dev      # Vite dev server, HMR enabled
npm run build    # Production build to dist/
npm run lint     # ESLint check (includes React hooks rules)
npm run preview  # Preview built output
```

### Build Configuration
- Vite with React plugin + Babel React Compiler enabled
- Compiler may impact dev/build performance (see [vite.config.js](vite.config.js))
- HMR configured via `@vitejs/plugin-react`

## Config Object Shape

Located in [src/App.jsx](src/App.jsx#L7-L12):
```javascript
{
  width: number,           // room width
  depth: number,           // room depth
  wallThickness: number,   // wall thickness
  unit: "m" | "cm"         // measurement unit
}
```

## External Dependencies

- **dxf-writer** (1.18.4): CAD file generation; API: `Drawing`, `setUnits()`, `addLayer()`, `drawLine()`, `toDxfString()`
- **React** (19.2.0): UI library with Compiler enabled
- **Vite** (7.2.4): Build tool & dev server

## Future Extensions

- PreviewPlaceholder → 2D canvas/SVG room visualization
- Door/window support (will extend DXF drawing logic)
- Additional measurement units (inches, feet)

## Notes for Maintainers

- German UI labels present; preserve language consistency when extending
- All measurements stored as numbers; validation happens in form inputs (step, min attributes)
- File downloads use ISO naming: `raum_{width}x{depth}_{unit}.dxf`
