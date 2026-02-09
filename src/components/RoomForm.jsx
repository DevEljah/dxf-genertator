
export default function RoomForm({ config, onChange, onGenerate }) {
  const handleChange = (field) => (e) => {
    const value = field === "unit" ? e.target.value : Number(e.target.value);
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="width" className="block text-sm mb-1">
          Breite
        </label>
        <input
          id="width"
          type="number"
          value={config.width}
          onChange={handleChange("width")}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label htmlFor="depth" className="block text-sm mb-1">
          Tiefe
        </label>
        <input
          id="depth"
          type="number"
          value={config.depth}
          onChange={handleChange("depth")}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label htmlFor="wallThickness" className="block text-sm mb-1">
          Wandstärke
        </label>
        <input
          id="wallThickness"
          type="number"
          value={config.wallThickness}
          onChange={handleChange("wallThickness")}
          className="w-full border rounded px-2 py-1"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="unit" className="block text-sm mb-1">
          Einheit
        </label>
        <select
          id="unit"
          value={config.unit}
          onChange={handleChange("unit")}
          className="w-full border rounded px-2 py-1"
        >
          <option value="m">Meter</option>
          <option value="cm">Zentimeter</option>
        </select>
      </div>

      <button
        onClick={onGenerate}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        DXF generieren
      </button>
    </div>
  );
}
