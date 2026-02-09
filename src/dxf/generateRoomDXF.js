
import Drawing from "dxf-writer";

// interne Umrechnung auf Millimeter (wie bisher)
function convertToMm(value, unit) {
  if (unit === "m") return value * 1000;
  if (unit === "cm") return value * 10;
  return value;
}

export function generateRoomDXF(config) {
  // Wichtig: In dieser Library heißt die Klasse "Drawing"
  const dxf = new Drawing();

  // (optional, aber empfehlenswert) Einheiten im DXF-Header setzen
  // Die Geometrie rechnen wir ohnehin in mm, das passt zusammen.
  dxf.setUnits("Millimeters"); // unterstützt lt. README u.a. "Millimeters"
  // https://www.npmjs.com/package/dxf-writer (API-Übersicht)  [1](https://www.npmjs.com/package/dxf-writer)

  const widthMm = convertToMm(config.width, config.unit);
  const depthMm = convertToMm(config.depth, config.unit);
  const wallMm = convertToMm(config.wallThickness, config.unit);

  // Layer anlegen (Farben = ACI-Nummern: 1=Rot, 2=Gelb)
  dxf.addLayer("WAND_AUSSEN", 1, "CONTINUOUS");
  dxf.addLayer("WAND_INNEN", 2, "CONTINUOUS");

  // Außenkontur (Layer vorher aktivieren)
  dxf.setActiveLayer("WAND_AUSSEN");
  dxf.drawLine(0, 0, widthMm, 0);
  dxf.drawLine(widthMm, 0, widthMm, depthMm);
  dxf.drawLine(widthMm, depthMm, 0, depthMm);
  dxf.drawLine(0, depthMm, 0, 0);

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

  // In dieser Library heißt der Export "toDxfString()" (nicht stringify)
  return dxf.toDxfString();
}