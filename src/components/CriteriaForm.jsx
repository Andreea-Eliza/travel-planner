// src/components/CriteriaForm.jsx
import { useState } from "react";
import "./CriteriaForm.css";

export default function CriteriaForm({ addCriteria, criteria = [] }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedWeight = parseFloat(weight);

    if (!name || !weight) {
      setError("Completeaza toate campurile");
      return;
    }

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) + parsedWeight;

    if (totalWeight > 100) {
      const remaining = 100 - criteria.reduce((sum, c) => sum + c.weight, 0);
      setError(`Greutatea totala nu poate depasi 100%. Mai poti adauga maxim ${remaining}%`);
      return;
    }

    addCriteria({ name, weight: parsedWeight });
    setName("");
    setWeight("");
    setError("");
  };

  const usedWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const remaining = 100 - usedWeight;
  const isFull = remaining <= 0;

  return (
    <div className="criteria-form">
      <form onSubmit={handleSubmit} className={`criteria-form-fields ${isFull ? "disabled" : ""}`}>
        <div className="criteria-input-group">
          <input
            type="text"
            placeholder={isFull ? "Limita atinsa" : "Nume criteriu"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="criteria-input"
            disabled={isFull}
            required
          />
          <div className="criteria-weight-input">
            <input
              type="number"
              placeholder="0"
              value={weight}
              min="1"
              max={remaining}
              onChange={(e) => setWeight(e.target.value)}
              className="criteria-input weight"
              disabled={isFull}
              required
            />
            <span className="weight-suffix">%</span>
          </div>
        </div>
        <button type="submit" className="criteria-submit" disabled={isFull}>
          {isFull ? "100% atins" : "Adauga"}
        </button>
      </form>

      {error && <div className="criteria-error">{error}</div>}

      <div className="criteria-progress">
        <div className="progress-info">
          <span className="progress-label">Greutate folosita</span>
          <span className={`progress-value ${usedWeight === 100 ? "complete" : ""}`}>
            {usedWeight}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-bar-fill ${usedWeight === 100 ? "complete" : usedWeight > 80 ? "warning" : ""}`}
            style={{ width: `${usedWeight}%` }}
          />
        </div>
        <span className="progress-remaining">{remaining}% disponibil</span>
      </div>
    </div>
  );
}
