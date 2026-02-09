
import { useState } from "react";
import RoomForm from "./components/RoomForm";
import PreviewPlaceholder from "./components/PreviewPlaceholder";
import { generateRoomDXF } from "./dxf/generateRoomDXF";

export default function App() {
  const [config, setConfig] = useState({
    width: 5,
    depth: 4,
    wallThickness: 0.24,
    unit: "m",
  });

  const handleGenerate = () => {
    const dxfString = generateRoomDXF(config);
    const blob = new Blob([dxfString], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `raum_${config.width}x${config.depth}_${config.unit}.dxf`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md space-y-6">
        <h1 className="text-xl font-semibold">DXF‑Raumgenerator</h1>
        <p className="text-slate-600 text-sm">
          Gib Maße ein und lade eine DXF-Datei herunter. Vorschau & Türen folgen später.
        </p>

        <PreviewPlaceholder />

        <RoomForm config={config} onChange={setConfig} onGenerate={handleGenerate} />
      </div>
    </div>
  );
}
