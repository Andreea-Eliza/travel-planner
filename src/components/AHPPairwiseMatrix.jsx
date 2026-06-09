// src/components/AHPPairwiseMatrix.jsx
import React from "react";

export default function AHPPairwiseMatrix({ criteria, ahpMatrix, setAhpMatrix }) {
  // Verifică dacă matricea este corect inițializată
  if (!criteria || criteria.length === 0) {
    return <p className="ahp-empty">Nu există criterii definite.</p>;
  }

  const n = criteria.length;

  // Asigură-te că matricea are dimensiunea corectă
  if (!ahpMatrix || ahpMatrix.length !== n || ahpMatrix[0]?.length !== n) {
    return <p className="ahp-empty">Se inițializează matricea AHP...</p>;
  }

  const handleChange = (i, j, value) => {
    const val = parseFloat(value);

    // Validare
    if (isNaN(val) || val <= 0 || val > 9) return;

    // Creează o nouă matrice
    const newMatrix = ahpMatrix.map((row) => [...row]);
    newMatrix[i][j] = val;

    // Setează reciproca (evită împărțirea la zero)
    newMatrix[j][i] = val !== 0 ? 1 / val : 0;

    setAhpMatrix(newMatrix);
  };

  return (
    <>
      <div className="ahp-matrix-scroll">
        <table className="ahp-matrix-table">
          <thead>
            <tr>
              <th className="ahp-corner"></th>
              {criteria.map((c) => (
                <th key={c.id} className="ahp-col-head">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((cRow, i) => (
              <tr key={cRow.id}>
                <th scope="row" className="ahp-row-head">
                  {cRow.name}
                </th>
                {criteria.map((cCol, j) => (
                  <td key={cCol.id} className="ahp-cell">
                    {i === j ? (
                      <div className="ahp-diagonal">1</div>
                    ) : i < j ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="9"
                        value={ahpMatrix[i]?.[j] || 1}
                        onChange={(e) => handleChange(i, j, e.target.value)}
                        className="ahp-input"
                        title={`Compară ${cRow.name} cu ${cCol.name}`}
                      />
                    ) : (
                      <div className="ahp-reciprocal">
                        {ahpMatrix[i]?.[j]?.toFixed(2) || "1.00"}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ahp-note">
        <strong>Notă:</strong> Introdu valori doar în triunghiul superior.
        Valorile reciproce se calculează automat.
      </p>
    </>
  );
}
