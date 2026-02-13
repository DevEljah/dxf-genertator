function convertToMm(value, unit) {
  if (unit === "m") return value * 1000;
  if (unit === "cm") return value * 10;
  return value;
}

export default function PreviewPlaceholder({ config }) {
  const svgW = 300;
  const svgH = 240;
  const pad = 10;

  const roomW = convertToMm(config.width || 0, config.unit);
  const roomH = convertToMm(config.depth || 0, config.unit);
  const wall = convertToMm(config.wallThickness || 0, config.unit);

  const scale = Math.min(
    (svgW - pad * 2) / Math.max(roomW, 1),
    (svgH - pad * 2) / Math.max(roomH, 1),
  );

  const toPxX = (x) => pad + x * scale;
  const toPxY = (y) => pad + (roomH - y) * scale; // flip Y so origin bottom-left

  // compute outer wall segments similar to generator
  const openings = (config.openings || []).map((o) => ({
    ...o,
    widthMm: convertToMm(o.width || 0, config.unit),
    distanceMm: convertToMm(o.distance || 0, config.unit),
  }));

  const groupBySide = () => {
    const grouped = { bottom: [], top: [], left: [], right: [] };
    openings.forEach((o) => grouped[o.side].push(o));
    Object.keys(grouped).forEach((k) =>
      grouped[k].sort((a, b) => a.distanceMm - b.distanceMm),
    );
    return grouped;
  };

  const grouped = groupBySide();

  const wallLines = [];

  // helper to add horizontal segments
  const addHorizontal = (y, startX, endX, sideOpenings) => {
    let cur = startX;
    const dir = endX > startX ? 1 : -1;
    sideOpenings.forEach((op) => {
      const s = startX + op.distanceMm * dir;
      const e = s + op.widthMm * dir;
      if ((dir > 0 && cur < s) || (dir < 0 && cur > s)) {
        wallLines.push([cur, y, s, y]);
      }
      cur = e;
    });
    if ((dir > 0 && cur < endX) || (dir < 0 && cur > endX))
      wallLines.push([cur, y, endX, y]);
  };

  const addVertical = (x, startY, endY, sideOpenings) => {
    let cur = startY;
    const dir = endY > startY ? 1 : -1;
    sideOpenings.forEach((op) => {
      const s = startY + op.distanceMm * dir;
      const e = s + op.widthMm * dir;
      if ((dir > 0 && cur < s) || (dir < 0 && cur > s)) {
        wallLines.push([x, cur, x, s]);
      }
      cur = e;
    });
    if ((dir > 0 && cur < endY) || (dir < 0 && cur > endY))
      wallLines.push([x, cur, x, endY]);
  };

  addHorizontal(0, 0, roomW, grouped.bottom || []);
  addVertical(roomW, 0, roomH, grouped.right || []);
  addHorizontal(roomH, roomW, 0, grouped.top || []);
  addVertical(0, roomH, 0, grouped.left || []);

  return (
    <div style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          border: "1px solid #e2e8f0",
          borderRadius: "0.375rem",
          background: "#fff",
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={svgW} height={svgH} fill="transparent" />

        {/* draw wall segments */}
        {wallLines.map((ln, i) => (
          <line
            key={i}
            x1={toPxX(ln[0])}
            y1={toPxY(ln[1])}
            x2={toPxX(ln[2])}
            y2={toPxY(ln[3])}
            stroke="#ef4444"
            strokeWidth={Math.max(1, wall * scale)}
            strokeLinecap="butt"
          />
        ))}

        {/* inner rectangle */}
        <rect
          x={toPxX(wall)}
          y={toPxY(roomH - wall)}
          width={(roomW - 2 * wall) * scale}
          height={(roomH - 2 * wall) * scale}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1}
        />

        {/* openings markers: doors as arcs, windows as short lines */}
        {openings.map((op, idx) => {
          if (op.type === "window") {
            if (op.side === "bottom" || op.side === "top") {
              const y = op.side === "bottom" ? 0 : roomH;
              const x1 = op.distanceMm;
              const x2 = op.distanceMm + op.widthMm;
              return (
                <line
                  key={idx}
                  x1={toPxX(x1)}
                  y1={toPxY(y)}
                  x2={toPxX(x2)}
                  y2={toPxY(y)}
                  stroke="#06b6d4"
                  strokeWidth={2}
                />
              );
            } else {
              const x = op.side === "left" ? 0 : roomW;
              const y1 = op.distanceMm;
              const y2 = op.distanceMm + op.widthMm;
              return (
                <line
                  key={idx}
                  x1={toPxX(x)}
                  y1={toPxY(y1)}
                  x2={toPxX(x)}
                  y2={toPxY(y2)}
                  stroke="#06b6d4"
                  strokeWidth={2}
                />
              );
            }
          }

          // door: draw simple arc using path (approximate)
          if (op.type === "door") {
            const steps = 12;
            let points = [];
            let cx = 0;
            let cy = 0;
            let start = 0;
            let end = Math.PI / 2;
            const r = op.widthMm;

            if (op.side === "bottom") {
              // schwingt nach oben
              cx = op.distanceMm;
              cy = 0;
              start = 0;
              end = Math.PI / 2;
            } else if (op.side === "top") {
              // Tür schwingt nach unten (in den Raum)
              cx = roomW - op.distanceMm; // WICHTIG: Spiegelung wie im DXF
              cy = roomH;
              start = Math.PI; // 180°
              end = (3 * Math.PI) / 2; // 270°
            } else if (op.side === "left") {
              // schwingt nach rechts
              cx = 0;
              cy = roomH - op.distanceMm;
              start = (3 * Math.PI) / 2;
              end = 2 * Math.PI;
            } else if (op.side === "right") {
              // schwingt nach links
              cx = roomW;
              cy = op.distanceMm;
              start = Math.PI / 2;
              end = Math.PI;
            }

            for (let i = 0; i <= steps; i++) {
              const t = start + ((end - start) * i) / steps;
              const x = cx + Math.cos(t) * r;
              const y = cy + Math.sin(t) * r;
              points.push(`${toPxX(x)},${toPxY(y)}`);
            }

            return (
              <polyline
                key={idx}
                points={points.join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}
