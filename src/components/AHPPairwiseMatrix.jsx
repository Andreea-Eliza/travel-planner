// src/components/AHPPairwiseMatrix.jsx - VERSIUNE CORECTATĂ
import React from "react";

export default function AHPPairwiseMatrix({ criteria, ahpMatrix, setAhpMatrix }) {
  
  // Verifică dacă matricea este corect inițializată
  if (!criteria || criteria.length === 0) {
    return <p>Nu există criterii definite.</p>;
  }

  const n = criteria.length;
  
  // Asigură-te că matricea are dimensiunea corectă
  if (!ahpMatrix || ahpMatrix.length !== n || ahpMatrix[0]?.length !== n) {
    return <p>Se inițializează matricea AHP...</p>;
  }

  const handleChange = (i, j, value) => {
    const val = parseFloat(value);
    
    // Validare
    if (isNaN(val) || val <= 0 || val > 9) return;
    
    // Creează o nouă matrice
    const newMatrix = ahpMatrix.map(row => [...row]);
    newMatrix[i][j] = val;
    
    // Setează reciproca (evită împărțirea la zero)
    if (val !== 0) {
      newMatrix[j][i] = 1 / val;
    } else {
      newMatrix[j][i] = 0;
    }
    
    setAhpMatrix(newMatrix);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ minWidth: '400px' }}>
        <thead>
          <tr>
            <th style={{ backgroundColor: '#f2f2f2' }}></th>
            {criteria.map((c) => (
              <th key={c.id} style={{ backgroundColor: '#f2f2f2', padding: '10px' }}>
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((cRow, i) => (
            <tr key={cRow.id}>
              <td style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', padding: '10px' }}>
                {cRow.name}
              </td>
              {criteria.map((cCol, j) => (
                <td key={cCol.id} style={{ textAlign: 'center', padding: '8px' }}>
                  {i === j ? (
                    <div style={{ 
                      padding: '8px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      1
                    </div>
                  ) : i < j ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="9"
                      value={ahpMatrix[i]?.[j] || 1}
                      onChange={(e) => handleChange(i, j, e.target.value)}
                      style={{ 
                        width: '70px',
                        padding: '6px',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      title={`Compară ${cRow.name} cu ${cCol.name}`}
                    />
                  ) : (
                    <div style={{ 
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {ahpMatrix[i]?.[j]?.toFixed(2) || '1.00'}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
        <strong>Notă:</strong> Introdu valori doar în triunghiul superior. Valorile reciproce se calculează automat.
      </p>
    </div>
  );
}