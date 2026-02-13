import Drawing from "dxf-writer";

// interne Umrechnung auf Millimeter
function convertToMm(value, unit) {
  if (unit === "m") return value * 1000;
  if (unit === "cm") return value * 10;
  return value;
}

export function generateRoomDXF(config) {
  const dxf = new Drawing();
  dxf.setUnits("Millimeters");

  const widthMm = convertToMm(config.width, config.unit);
  const depthMm = convertToMm(config.depth, config.unit);
  const wallMm = convertToMm(config.wallThickness, config.unit);

  // Layer anlegen
  dxf.addLayer("WAND_AUSSEN", 1, "CONTINUOUS"); // rot
  dxf.addLayer("WAND_INNEN", 2, "CONTINUOUS"); // gelb

  // FEHLENDER LAYER → jetzt hinzugefügt
  dxf.addLayer("FENSTER_PFOSTEN", 7, "CONTINUOUS"); // weiß

  // Layer für Türen und Fenster erstellen
  const openingsByType = {};
  config.openings.forEach((opening) => {
    const key = opening.type === "door" ? "TUER" : "FENSTER";
    if (!openingsByType[key]) openingsByType[key] = [];
    openingsByType[key].push(opening);
  });

  Object.keys(openingsByType).forEach((layerName) => {
    const color = layerName === "TUER" ? 5 : 4; // TUER=blau, FENSTER=cyan
    dxf.addLayer(layerName, color, "CONTINUOUS");
  });

  // Öffnungen konvertieren
  const convertedOpenings = config.openings.map((o) => ({
    ...o,
    widthMm: convertToMm(o.width, config.unit),
    distanceMm: convertToMm(o.distance, config.unit),
    layerName: o.type === "door" ? "TUER" : "FENSTER",
  }));

  // Außenkontur mit Öffnungen
  dxf.setActiveLayer("WAND_AUSSEN");
  drawOuterWallWithOpenings(dxf, widthMm, depthMm, convertedOpenings);

  // Innenkontur
  const ix = wallMm;
  const iy = wallMm;
  const iWidth = widthMm - 2 * wallMm;
  const iDepth = depthMm - 2 * wallMm;

  dxf.setActiveLayer("WAND_INNEN");
  dxf.drawLine(ix, iy, ix + iWidth, iy);
  dxf.drawLine(ix + iWidth, iy, ix + iWidth, iy + iDepth);
  dxf.drawLine(ix + iWidth, iy + iDepth, ix, iy + iDepth);
  dxf.drawLine(ix, iy + iDepth, ix, iy);

  // Öffnungen zeichnen
  convertedOpenings.forEach((opening) => {
    dxf.setActiveLayer(opening.layerName);
    drawOpeningMarker(dxf, widthMm, depthMm, wallMm, opening);
  });

  return dxf.toDxfString();
}

function drawOuterWallWithOpenings(dxf, width, depth, openings) {
  const openingsBySide = groupOpeningsBySide(openings);

  drawWallSegment(
    dxf,
    { x: 0, y: 0 },
    { x: width, y: 0 },
    openingsBySide["bottom"] || [],
    "horizontal",
  );
  drawWallSegment(
    dxf,
    { x: width, y: 0 },
    { x: width, y: depth },
    openingsBySide["right"] || [],
    "vertical",
  );
  drawWallSegment(
    dxf,
    { x: width, y: depth },
    { x: 0, y: depth },
    openingsBySide["top"] || [],
    "horizontal",
  );
  drawWallSegment(
    dxf,
    { x: 0, y: depth },
    { x: 0, y: 0 },
    openingsBySide["left"] || [],
    "vertical",
  );
}

function groupOpeningsBySide(openings) {
  const grouped = {};
  openings.forEach((opening) => {
    if (!grouped[opening.side]) grouped[opening.side] = [];
    grouped[opening.side].push(opening);
  });

  Object.keys(grouped).forEach((side) => {
    grouped[side].sort((a, b) => a.distanceMm - b.distanceMm);
  });

  return grouped;
}

function drawWallSegment(dxf, start, end, openings, orientation) {
  if (orientation === "horizontal") {
    const y = start.y;
    let currentX = start.x;
    const endX = end.x;
    const direction = endX > start.x ? 1 : -1;

    openings.forEach((opening) => {
      const openingStart = start.x + opening.distanceMm * direction;
      const openingEnd = openingStart + opening.widthMm * direction;

      if (direction > 0) {
        if (currentX < openingStart) dxf.drawLine(currentX, y, openingStart, y);
        currentX = openingEnd;
      } else {
        if (currentX > openingStart) dxf.drawLine(currentX, y, openingStart, y);
        currentX = openingEnd;
      }
    });

    if (direction > 0 && currentX < endX) dxf.drawLine(currentX, y, endX, y);
    if (direction < 0 && currentX > endX) dxf.drawLine(currentX, y, endX, y);
  } else {
    const x = start.x;
    let currentY = start.y;
    const endY = end.y;
    const direction = endY > start.y ? 1 : -1;

    openings.forEach((opening) => {
      const openingStart = start.y + opening.distanceMm * direction;
      const openingEnd = openingStart + opening.widthMm * direction;

      if (direction > 0) {
        if (currentY < openingStart) dxf.drawLine(x, currentY, x, openingStart);
        currentY = openingEnd;
      } else {
        if (currentY > openingStart) dxf.drawLine(x, currentY, x, openingStart);
        currentY = openingEnd;
      }
    });

    if (direction > 0 && currentY < endY) dxf.drawLine(x, currentY, x, endY);
    if (direction < 0 && currentY > endY) dxf.drawLine(x, currentY, x, endY);
  }
}

function drawOpeningMarker(dxf, roomWidth, roomDepth, wallMm, opening) {
  const { side, distanceMm, widthMm, type } = opening;

  if (type === "door") {
    let hx = 0,
      hy = 0,
      startDeg = 0,
      endDeg = 90;

    if (side === "bottom") {
      hx = distanceMm;
      hy = 0;
      startDeg = 0;
      endDeg = 90;
    } else if (side === "top") {
      hx = roomWidth - distanceMm;
      hy = roomDepth;
      startDeg = 180;
      endDeg = 270;
    } else if (side === "left") {
      hx = 0;
      hy = roomDepth - distanceMm;
      startDeg = 270;
      endDeg = 360;
    } else if (side === "right") {
      hx = roomWidth;
      hy = distanceMm;
      startDeg = 90;
      endDeg = 180;
    }

    const radius = widthMm;
    const steps = 16;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const step = (endDeg - startDeg) / steps;

    let prevX = hx + Math.cos(toRad(startDeg)) * radius;
    let prevY = hy + Math.sin(toRad(startDeg)) * radius;

    for (let i = 1; i <= steps; i++) {
      const ang = startDeg + step * i;
      const nx = hx + Math.cos(toRad(ang)) * radius;
      const ny = hy + Math.sin(toRad(ang)) * radius;
      dxf.drawLine(prevX, prevY, nx, ny);
      prevX = nx;
      prevY = ny;
    }

    const leafX = hx + Math.cos(toRad(endDeg)) * radius;
    const leafY = hy + Math.sin(toRad(endDeg)) * radius;
    dxf.drawLine(hx, hy, leafX, leafY);
  } else {
    // FENSTER: perfekte Abstände (3 Segmente)
    const seg = wallMm / 3;

    // Pfosten-Layer (weiß)
    const PFOSTEN = "FENSTER_PFOSTEN";

    //
    //  BOTTOM
    //
    if (side === "bottom") {
      const x1 = distanceMm;
      const x2 = distanceMm + widthMm;

      // Außenwand im Fensterbereich cyan
      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(x1, 0, x2, 0);

      // Außenpfosten (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(x1, 0, x1, wallMm);
      dxf.drawLine(x2, 0, x2, wallMm);

      // Fensterlinien (cyan)
      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(x1, seg, x2, seg);
      dxf.drawLine(x1, 2 * seg, x2, 2 * seg);

      // Außenpfosten verbinden (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(x1, seg, x1, 2 * seg);
      dxf.drawLine(x2, seg, x2, 2 * seg);

      // Mittelpfosten (cyan) → Quadrate links & rechts
      const mid1 = x1 + seg;
      const mid2 = x2 - seg;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(mid1, seg, mid1, 2 * seg);
      dxf.drawLine(mid2, seg, mid2, 2 * seg);
    }

    //
    //  TOP
    //
    if (side === "top") {
      const x1 = roomWidth - distanceMm - widthMm;
      const x2 = roomWidth - distanceMm;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(x1, roomDepth, x2, roomDepth);

      // Außenpfosten (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(x1, roomDepth - wallMm, x1, roomDepth);
      dxf.drawLine(x2, roomDepth - wallMm, x2, roomDepth);

      // Fensterlinien (cyan)
      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(x1, roomDepth - seg, x2, roomDepth - seg);
      dxf.drawLine(x1, roomDepth - 2 * seg, x2, roomDepth - 2 * seg);

      // Außenpfosten verbinden (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(x1, roomDepth - seg, x1, roomDepth - 2 * seg);
      dxf.drawLine(x2, roomDepth - seg, x2, roomDepth - 2 * seg);

      // Mittelpfosten (cyan)
      const mid1 = x1 + seg;
      const mid2 = x2 - seg;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(mid1, roomDepth - seg, mid1, roomDepth - 2 * seg);
      dxf.drawLine(mid2, roomDepth - seg, mid2, roomDepth - 2 * seg);
    }

    //
    //  LEFT
    //
    if (side === "left") {
      const y1 = roomDepth - distanceMm - widthMm;
      const y2 = roomDepth - distanceMm;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(0, y1, 0, y2);

      // Außenpfosten (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(0, y1, wallMm, y1);
      dxf.drawLine(0, y2, wallMm, y2);

      // Fensterlinien (cyan)
      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(seg, y1, seg, y2);
      dxf.drawLine(2 * seg, y1, 2 * seg, y2);

      // Außenpfosten verbinden (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(seg, y1, 2 * seg, y1);
      dxf.drawLine(seg, y2, 2 * seg, y2);

      // Mittelpfosten (cyan)
      const mid1 = y1 + seg;
      const mid2 = y2 - seg;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(seg, mid1, 2 * seg, mid1);
      dxf.drawLine(seg, mid2, 2 * seg, mid2);
    }

    //
    //  RIGHT
    //
    if (side === "right") {
      const y1 = distanceMm;
      const y2 = distanceMm + widthMm;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(roomWidth, y1, roomWidth, y2);

      // Außenpfosten (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(roomWidth - wallMm, y1, roomWidth, y1);
      dxf.drawLine(roomWidth - wallMm, y2, roomWidth, y2);

      // Fensterlinien (cyan)
      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(roomWidth - seg, y1, roomWidth - seg, y2);
      dxf.drawLine(roomWidth - 2 * seg, y1, roomWidth - 2 * seg, y2);

      // Außenpfosten verbinden (weiß)
      dxf.setActiveLayer(PFOSTEN);
      dxf.drawLine(roomWidth - seg, y1, roomWidth - 2 * seg, y1);
      dxf.drawLine(roomWidth - seg, y2, roomWidth - 2 * seg, y2);

      // Mittelpfosten (cyan)
      const mid1 = y1 + seg;
      const mid2 = y2 - seg;

      dxf.setActiveLayer("FENSTER");
      dxf.drawLine(roomWidth - seg, mid1, roomWidth - 2 * seg, mid1);
      dxf.drawLine(roomWidth - seg, mid2, roomWidth - 2 * seg, mid2);
    }
  }
}
