
export default function RoomForm({ config, onChange, onGenerate }) {
  const handleChange = (field) => (e) => {
    const value = field === "unit" ? e.target.value : Number(e.target.value);
    onChange({ ...config, [field]: value });
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onGenerate(); }}>
      <div className="form-group">
        <label htmlFor="width" className="form-label">
          Breite
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
          Tiefe
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
          Wandstärke
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

      <button
        type="submit"
        className="btn-primary mt-2"
      >
        DXF generieren
      </button>
    </form>
  );
}
