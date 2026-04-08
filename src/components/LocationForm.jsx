// src/components/LocationForm.jsx
import { useState } from "react";

export default function LocationForm({ addLocation }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [season, setSeason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    addLocation({ name, city, type, season });
    setName("");
    setCity("");
    setType("");
    setSeason("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Nume locatie *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Oras / Tara *"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tip activitate (optional)</option>
          <option value="plaja">🏖️ Plaja</option>
          <option value="munte">⛰️ Munte</option>
          <option value="city-break">🏙️ City Break</option>
          <option value="cultural">🏛️ Cultural</option>
          <option value="aventura">🧗 Aventura</option>
          <option value="wellness">🧘 Wellness & Spa</option>
          <option value="camping">⛺ Camping</option>
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          <option value="">Sezon recomandat (optional)</option>
          <option value="iarna">❄️ Iarna</option>
          <option value="primavara">🌷 Primavara</option>
          <option value="vara">☀️ Vara</option>
          <option value="toamna">🍂 Toamna</option>
          <option value="toate">🌈 Toate anotimpurile</option>
        </select>
      </div>

      <button type="submit" style={{ width: "100%" }}>
        Adauga locatie
      </button>

      <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-light)" }}>
        <small>* Campuri obligatorii</small>
      </div>
    </form>
  );
}
