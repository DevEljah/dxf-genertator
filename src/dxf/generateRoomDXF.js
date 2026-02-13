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
  dxf.addLayer("WAND_AUSSEN", 1, "CONTINUOUS");
  dxf.addLayer("WAND_INNEN", 2, "CONTINUOUS");

  // Layer für Türen und Fenster erstellen
  const openingsByType = {};
  config.openings.forEach((opening) => {
    const key = opening.type === "door" ? "TUER" : "FENSTER";
    if (!openingsByType[key]) {
      openingsByType[key] = [];
    }
    openingsByType[key].push(opening);
  });

  Object.keys(openingsByType).forEach((layerName) => {
    const color = layerName === "TUER" ? 5 : 4; // Blau für Türen, Cyan für Fenster
    dxf.addLayer(layerName, color, "CONTINUOUS");
  });

  // Öffnungen nach Seite gruppieren (in Millimeter konvertiert)
  const convertedOpenings = config.openings.map((o) => ({
    ...o,
    widthMm: convertToMm(o.width, config.unit),
    distanceMm: convertToMm(o.distance, config.unit),
    layerName: o.type === "door" ? "TUER" : "FENSTER",
  }));

  // Außenkontur (mit Unterbrechungen) zeichnen
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
    drawOpeningMarker(dxf, widthMm, depthMm, opening);
  });

  return dxf.toDxfString();
}

function drawOuterWallWithOpenings(dxf, width, depth, openings) {
  // Öffnungen pro Seite sammeln und sortieren
  const openingsBySide = groupOpeningsBySide(openings);

  // Bottom Wall (Y=0, X von 0 bis width)
  drawWallSegment(
    dxf,
    { x: 0, y: 0 },
    { x: width, y: 0 },
    openingsBySide["bottom"] || [],
    "horizontal",
  );

  // Right Wall (X=width, Y von 0 bis depth)
  drawWallSegment(
    dxf,
    { x: width, y: 0 },
    { x: width, y: depth },
    openingsBySide["right"] || [],
    "vertical",
  );

  // Top Wall (Y=depth, X von width bis 0)
  drawWallSegment(
    dxf,
    { x: width, y: depth },
    { x: 0, y: depth },
    openingsBySide["top"] || [],
    "horizontal",
  );

  // Left Wall (X=0, Y von depth bis 0)
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
    if (!grouped[opening.side]) {
      grouped[opening.side] = [];
    }
    grouped[opening.side].push(opening);
  });

  // Öffnungen pro Seite sortieren
  Object.keys(grouped).forEach((side) => {
    grouped[side].sort((a, b) => a.distanceMm - b.distanceMm);
  });

  return grouped;
}

function drawWallSegment(dxf, start, end, openings, orientation) {
  let segments = [];

  if (orientation === "horizontal") {
    // Horizontal: X ändert sich
    const y = start.y;
    let currentX = start.x;
    const endX = end.x;
    const direction = endX > start.x ? 1 : -1;

    openings.forEach((opening) => {
      const openingStart = start.x + opening.distanceMm * direction;
      const openingEnd = openingStart + opening.widthMm * direction;

      if (direction > 0) {
        if (currentX < openingStart) {
          dxf.drawLine(currentX, y, openingStart, y);
        }
        currentX = openingEnd;
      } else {
        if (currentX > openingStart) {
          dxf.drawLine(currentX, y, openingStart, y);
        }
        currentX = openingEnd;
      }
    });

    // Restliche Segment zeichnen
    if (direction > 0 && currentX < endX) {
      dxf.drawLine(currentX, y, endX, y);
    } else if (direction < 0 && currentX > endX) {
      dxf.drawLine(currentX, y, endX, y);
    }
  } else {
    // Vertical: Y ändert sich
    const x = start.x;
    let currentY = start.y;
    const endY = end.y;
    const direction = endY > start.y ? 1 : -1;

    openings.forEach((opening) => {
      const openingStart = start.y + opening.distanceMm * direction;
      const openingEnd = openingStart + opening.widthMm * direction;

      if (direction > 0) {
        if (currentY < openingStart) {
          dxf.drawLine(x, currentY, x, openingStart);
        }
        currentY = openingEnd;
      } else {
        if (currentY > openingStart) {
          dxf.drawLine(x, currentY, x, openingStart);
        }
        currentY = openingEnd;
      }
    });

    // Restliche Segment zeichnen
    if (direction > 0 && currentY < endY) {
      dxf.drawLine(x, currentY, x, endY);
    } else if (direction < 0 && currentY > endY) {
      dxf.drawLine(x, currentY, x, endY);
    }
  }
}

function drawOpeningMarker(dxf, roomWidth, roomDepth, opening) {
  const { side, distanceMm, widthMm, type } = opening;

  if (type === "door") {
    // draw door swing arc (approximated with short line segments)
    let hx = 0;
    let hy = 0;
    let startDeg = 0;
    let endDeg = 90;

    if (side === "bottom") {
      // Tür schwingt nach oben (in den Raum)
      hx = distanceMm;
      hy = 0;
      startDeg = 0;
      endDeg = 90;
    } else if (side === "top") {
      // Tür schwingt nach unten (in den Raum)
      hx = distanceMm;
      hy = roomDepth;
      startDeg = 180;
      endDeg = 270;
    } else if (side === "left") {
      // Tür schwingt nach rechts (in den Raum)
      hx = 0;
      hy = roomDepth - distanceMm;
      startDeg = 270;
      endDeg = 360;
    } else if (side === "right") {
      // Tür schwingt nach links (in den Raum)
      hx = roomWidth;
      hy = distanceMm;
      startDeg = 90;
      endDeg = 180;
    }

    const radius = widthMm; // door leaf length ~ opening width
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

    // optional short line for door leaf at end position
    const leafX = hx + Math.cos(toRad(endDeg)) * radius;
    const leafY = hy + Math.sin(toRad(endDeg)) * radius;
    dxf.drawLine(hx, hy, leafX, leafY);
  } else {
    // window marker (simple line on wall edge)
    if (side === "bottom") {
      const x1 = distanceMm;
      const x2 = distanceMm + widthMm;
      dxf.drawLine(x1, 0, x2, 0);
    } else if (side === "top") {
      const x1 = distanceMm;
      const x2 = distanceMm + widthMm;
      dxf.drawLine(x1, roomDepth, x2, roomDepth);
    } else if (side === "left") {
      const y1 = distanceMm;
      const y2 = distanceMm + widthMm;
      dxf.drawLine(0, y1, 0, y2);
    } else if (side === "right") {
      const y1 = distanceMm;
      const y2 = distanceMm + widthMm;
      dxf.drawLine(roomWidth, y1, roomWidth, y2);
    }
  }
}
