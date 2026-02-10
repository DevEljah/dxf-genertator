
export default function RoomForm({ config, onChange, onAddOpening, onRemoveOpening, onUpdateOpening, onGenerate }) {
  const handleChange = (field) => (e) => {
    if (field === "unit") {
      onChange({ ...config, [field]: e.target.value });
    } else {
      onChange({ ...config, [field]: Number(e.target.value) });
    }
  };

  const unitLabel = config.unit === "m" ? "m" : "cm";

  // validation helpers (convert to mm)
  const convertToMm = (value, unit) => {
    if (unit === "m") return value * 1000;
    if (unit === "cm") return value * 10;
    return value;
  };

  const widthMm = convertToMm(config.width || 0, config.unit);
  const depthMm = convertToMm(config.depth || 0, config.unit);
  const wallMm = convertToMm(config.wallThickness || 0, config.unit);

  const errors = [];
  if (!(config.width > 0)) errors.push("Breite muss größer als 0 sein.");
  if (!(config.depth > 0)) errors.push("Tiefe muss größer als 0 sein.");
  if (!(config.wallThickness > 0)) errors.push("Wandstärke muss größer als 0 sein.");
  // ensure inner dimensions positive
  if (wallMm * 2 >= widthMm) errors.push("Wandstärke zu groß für die Raum-Breite.");
  if (wallMm * 2 >= depthMm) errors.push("Wandstärke zu groß für die Raum-Tiefe.");

  // validate openings
  config.openings.forEach((o, i) => {
    const ow = convertToMm(o.width || 0, config.unit);
    const od = convertToMm(o.distance || 0, config.unit);
    if (!(o.width > 0)) errors.push(`Öffnung ${i + 1}: Breite muss größer als 0 sein.`);
    if (od < 0) errors.push(`Öffnung ${i + 1}: Abstand darf nicht negativ sein.`);
    if (o.side === "bottom" || o.side === "top") {
      if (od + ow > widthMm + 1e-6) errors.push(`Öffnung ${i + 1}: Breite + Abstand passt nicht in die Raum-Breite.`);
    } else {
      if (od + ow > depthMm + 1e-6) errors.push(`Öffnung ${i + 1}: Breite + Abstand passt nicht in die Raum-Tiefe.`);
    }
  });

  const hasErrors = errors.length > 0;

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); if (!hasErrors) onGenerate(); }}>
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          <strong className="block">Fehler:</strong>
          <ul className="list-disc list-inside text-sm">
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}
      {/* Raumdimensionen */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Raumdimensionen</h2>
        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="width" className="form-label">
              Breite ({unitLabel})
            </label>
            <input
              id="width"
              type="number"
              value={config.width}
              onChange={handleChange("width")}
              className="input-field"
              min="0.1"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="depth" className="form-label">
              Tiefe ({unitLabel})
            </label>
            <input
              id="depth"
              type="number"
              value={config.depth}
              onChange={handleChange("depth")}
              className="input-field"
              min="0.1"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wallThickness" className="form-label">
              Wandstärke ({unitLabel})
            </label>
            <input
              id="wallThickness"
              type="number"
              value={config.wallThickness}
              onChange={handleChange("wallThickness")}
              className="input-field"
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit" className="form-label">
              Einheit
            </label>
            <select
              id="unit"
              value={config.unit}
              onChange={handleChange("unit")}
              className="input-field"
            >
              <option value="m">Meter</option>
              <option value="cm">Zentimeter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Öffnungen (Türen & Fenster) */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Öffnungen (Türen & Fenster)</h2>
          <button
            type="button"
            onClick={onAddOpening}
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
          >
            + Hinzufügen
          </button>
        </div>

        {config.openings.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">Keine Öffnungen hinzugefügt</p>
        ) : (
          <div className="space-y-4">
            {config.openings.map((opening, index) => (
              <div key={opening.id} className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-medium text-slate-900">Öffnung {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveOpening(opening.id)}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition"
                  >
                    Entfernen
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor={`type-${opening.id}`} className="form-label">
                        Typ
                      </label>
                      <select
                        id={`type-${opening.id}`}
                        value={opening.type}
                        onChange={(e) => onUpdateOpening(opening.id, { type: e.target.value })}
                        className="input-field"
                      >
                        <option value="door">Tür</option>
                        <option value="window">Fenster</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`side-${opening.id}`} className="form-label">
                        Seite
                      </label>
                      <select
                        id={`side-${opening.id}`}
                        value={opening.side}
                        onChange={(e) => onUpdateOpening(opening.id, { side: e.target.value })}
                        className="input-field"
                      >
                        <option value="right">Rechts</option>
                        <option value="left">Links</option>
                        <option value="bottom">Unten</option>
                        <option value="top">Oben</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor={`width-${opening.id}`} className="form-label">
                        Breite ({unitLabel})
                      </label>
                      <input
                        id={`width-${opening.id}`}
                        type="number"
                        value={opening.width}
                        onChange={(e) => onUpdateOpening(opening.id, { width: Number(e.target.value) })}
                        className="input-field"
                        min="0.1"
                        step="0.1"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`distance-${opening.id}`} className="form-label">
                        Abstand zum Eck ({unitLabel})
                      </label>
                      <input
                        id={`distance-${opening.id}`}
                        type="number"
                        value={opening.distance}
                        onChange={(e) => onUpdateOpening(opening.id, { distance: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary mt-2 w-full"
        disabled={hasErrors}
      >
        DXF generieren
      </button>
    </form>
  );
}
