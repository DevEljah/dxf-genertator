# DXF-Generator

Ein React + Vite Webanwendung zur automatischen Generierung von DXF-Dateien (CAD-Zeichnungen) aus Raummessungen.

**Gib Raumabmessungen ein → Lade eine saubere DXF-Datei herunter** – ohne CAD-Software bedienen zu müssen.

---

## Projektübersicht

### Was ist DXF-Generator?
Ein Tool zur Erstellung von Grundrissen und Raumgeometrien als DXF-Dateien. Perfekt für:
- Schnelle CAD-Grundelemente ohne teure Software
- Architektur- und Planungsprojekte
- Automatisierte Raumgenerierung

### Tech-Stack
- **React 19** mit React Compiler
- **Vite 7** (Bundler + Dev-Server)
- **dxf-writer** (1.18.4) – DXF-Generierung
- **Tailwind CSS** (inline)

---

## Versionsübersicht & Roadmap

### ✅ Version 1.0 – MVP (FERTIG)
**Features:**
- Eingabe: Breite, Tiefe, Wandstärke, Einheit (m/cm)
- Automatische Umrechnung in Millimeter
- DXF-Generierung mit 2 Layern:
  - `WAND_AUSSEN` (Außenkontur, rot)
  - `WAND_INNEN` (Innenkontur, gelb)
- DXF-Download direkt im Browser
- Einfaches UI + Placeholder für Vorschau
- Kompatibel mit AutoCAD, LibreCAD, etc.

**Status:** ✔️ Erfolgreich fertiggestellt

---

### 🔜 Version 1.1 – Türen (NÄCHSTER SCHRITT)
**Geplante Features:**
- Tür hinzufügen (an Außenwand)
- Parameter:
  - Türseite (oben, unten, links, rechts)
  - Türbreite
  - Abstand zum Eck
- Automatische Unterbrechung der Wandlinie
- Neuer Layer: `OEFFNUNG` (Tür/Fenster)
- Realistische Grundrisse mit Wandöffnungen

**Status:** ⏳ Wird als Nächstes implementiert

---

### 🔮 Version 1.2 – Vorschau & UX
**Geplante Features:**
- SVG-Vorschau direkt im Browser
- Input-Validierung:
  - Keine negativen Werte
  - Wandstärke < Raumgröße
  - Türbreite im gültigen Bereich
- UI-Überarbeitung & bessere Struktur
- Aussagekräftige Fehlermeldungen

**Status:** Nach Version 1.1

---

### 🌟 Version 1.3 – Komfort-Features
**Mögliche Erweiterungen:**
- Fenster-Öffnungen (Layer `OEFFNUNG`)
- Bemaßungslinien (Layer `MASSE`)
- Presets für Wandstärken (11.5, 17.5, 24 cm)
- Mehrere Räume nacheinander erzeugen
- Verbesserte DXF-Header

**Status:** Nach Version 1.2

---

### 🏗️ Version 1.4+ – Profi-Features (Zukunft)
**Langfristige Ideen:**
- Mehrraum-Layouts
- IFC-Export
- 3D-Extrusionen
- Fenster/Tür-Bibliotheken
- Möbel-Integration
- Automatische Raumbezeichnungen
- Export für BIM-Tools (Revit, ArchiCAD, Vectorworks)

**Status:** Zukünftige Erweiterung

---

## Schnelleinstieg

### Installation
```bash
npm install
```

### Entwicklung
```bash
npm run dev      # Vite Dev-Server (HMR aktiviert)
```

### Build
```bash
npm run build    # Produktions-Build → dist/
npm run preview  # Built-Output lokals anschauen
```

### Linting
```bash
npm run lint     # ESLint Prüfung
```

---

## Projektstruktur

```
src/
├── App.jsx                    # Hauptkomponente (State, DXF-Generierung)
├── components/
│   ├── RoomForm.jsx          # Input-Form (Breite, Tiefe, Wandstärke, Einheit)
│   └── PreviewPlaceholder.jsx # Platzhalter für zukünftige SVG-Vorschau
├── dxf/
│   └── generateRoomDXF.js     # DXF-Generierungs-Logik (Kernfunktion)
├── index.css
├── App.css
└── main.jsx
```

---

## Wie der DXF-Export funktioniert

1. **Benutzer gibt Werte ein** (z.B. 5m x 4m, 25cm Wandstärke)
2. **generateRoomDXF.js konvertiert in mm**: 5000 × 4000 × 250
3. **Zwei Rechtecke werden gezeichnet**:
   - Außen: (0, 0) → (5000, 4000)
   - Innen: (250, 250) → (4750, 3750)
4. **DXF-String wird generiert** → Mit `dxf-writer` API
5. **Download im Browser** → `raum_5x4_m.dxf`

---

## Lizenz & Info

**Entwickler:** Eljah  
**Stand:** Februar 2026
