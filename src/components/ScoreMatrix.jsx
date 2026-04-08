// src/components/ScoreMatrix.jsx
import { useState, useEffect } from 'react';

export default function ScoreMatrix({ locations, criteria, scores, onScoreChange }) {
  const [activeCell, setActiveCell] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);

  // Auto-hide help after 5 seconds
  useEffect(() => {
    if (showHelp) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showHelp]);

  if (locations.length === 0 || criteria.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>Începe notarea!</h3>
        <p>Adaugă cel puțin o locație și un criteriu pentru a începe notarea.</p>
        <div className="tip-box">
          <strong>💡 Sfat:</strong> Completează mai întâi criteriile și locațiile, apoi revino aici pentru notare.
        </div>
      </div>
    );
  }

  // Calculează procentul de completare
  const calculateCompletion = () => {
    let filled = 0;
    let total = locations.length * criteria.length;
    
    locations.forEach(loc => {
      criteria.forEach(crit => {
        const score = scores[loc.id]?.[crit.id];
        if (score !== undefined && score !== '' && !isNaN(score)) {
          filled++;
        }
      });
    });
    
    return Math.round((filled / total) * 100);
  };

  const completionPercent = calculateCompletion();

  // Calculează scorul mediu pentru fiecare criteriu
  const calculateCriterionAverage = (criterionId) => {
    const validScores = locations
      .map(loc => scores[loc.id]?.[criterionId])
      .filter(score => score !== undefined && score !== '' && !isNaN(score))
      .map(score => parseFloat(score));
    
    if (validScores.length === 0) return null;
    
    const sum = validScores.reduce((a, b) => a + b, 0);
    return sum / validScores.length;
  };

  // Calculează scorul total pentru fiecare locație
  const calculateLocationTotal = (locationId) => {
    let total = 0;
    let count = 0;
    
    criteria.forEach(crit => {
      const score = scores[locationId]?.[crit.id];
      if (score !== undefined && score !== '' && !isNaN(score)) {
        total += parseFloat(score);
        count++;
      }
    });
    
    return count > 0 ? (total / count).toFixed(1) : null;
  };

  const handleInputChange = (locId, critId, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      onScoreChange(locId, critId, value);
    } else if (value === '') {
      onScoreChange(locId, critId, '');
    }
  };

  const handleInputFocus = (locId, critId) => {
    setActiveCell(`${locId}-${critId}`);
  };

  const handleInputBlur = () => {
    setActiveCell(null);
  };

  const getScoreColor = (score) => {
    if (score === undefined || score === '') return '#ffffff';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '#ffffff';

    // Gradient lavanda - de la deschis (0) la violet inchis (10)
    const intensity = numScore / 10;
    const r = Math.round(237 - (113 * intensity));
    const g = Math.round(232 - (140 * intensity));
    const b = Math.round(255 - (3 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getScoreDescription = (score) => {
    if (score === undefined || score === '' || isNaN(parseFloat(score))) {
      return 'Necompletat';
    }
    
    const numScore = parseFloat(score);
    if (numScore <= 2) return 'Foarte slab';
    if (numScore <= 4) return 'Slab';
    if (numScore <= 6) return 'Acceptabil';
    if (numScore <= 8) return 'Bun';
    return 'Excelent';
  };

  const handleCriterionClick = (criterion) => {
    setSelectedCriterion(criterion);
    setShowHelp(true);
  };

  return (
    <div className="score-matrix-container">
      <div className="matrix-header">
        <div></div>

        <div className="header-controls">
          <div className="completion-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="completion-text">
              {completionPercent}% completat
            </span>
          </div>
          
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="help-button"
            title="Arată/ascunde ajutor"
          >
            {showHelp ? '❌' : '❓'} Ajutor
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="help-panel">
          <h4>🎯 Cum să notezi corect:</h4>
          <div className="help-grid">
            <div className="help-item">
              <div className="help-score" style={{ backgroundColor: 'rgb(255, 100, 100)' }}>0-2</div>
              <span className="help-text">Foarte slab - Nu recomandat</span>
            </div>
            <div className="help-item">
              <div className="help-score" style={{ backgroundColor: 'rgb(255, 180, 100)' }}>3-4</div>
              <span className="help-text">Slab - Multe dezavantaje</span>
            </div>
            <div className="help-item">
              <div className="help-score" style={{ backgroundColor: 'rgb(255, 255, 100)' }}>5-6</div>
              <span className="help-text">Acceptabil - Decizie echilibrată</span>
            </div>
            <div className="help-item">
              <div className="help-score" style={{ backgroundColor: 'rgb(180, 255, 100)' }}>7-8</div>
              <span className="help-text">Bun - Recomandat</span>
            </div>
            <div className="help-item">
              <div className="help-score" style={{ backgroundColor: 'rgb(100, 255, 100)' }}>9-10</div>
              <span className="help-text">Excelent - Foarte recomandat</span>
            </div>
          </div>
          <p className="help-tip">
            <strong>💡 Sfat:</strong> Folosește valorile fracționare (ex: 7.5) pentru evaluări mai precise.
          </p>
        </div>
      )}

      {selectedCriterion && showHelp && (
        <div className="criterion-detail">
          <h4>📋 Detalii criteriu: {selectedCriterion.name}</h4>
          <p><strong>Greutate:</strong> {selectedCriterion.weight}%</p>
          <p><strong>Scor mediu:</strong> {
            calculateCriterionAverage(selectedCriterion.id) 
              ? calculateCriterionAverage(selectedCriterion.id).toFixed(1) 
              : 'N/A'
          }</p>
          <button 
            onClick={() => setSelectedCriterion(null)}
            className="close-button"
          >
            Închide
          </button>
        </div>
      )}

      <div className="matrix-info-bar">
        <div className="info-item">
          <span className="info-label">Locații:</span>
          <span className="info-value">{locations.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Criterii:</span>
          <span className="info-value">{criteria.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Celule totale:</span>
          <span className="info-value">{locations.length * criteria.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status:</span>
          <span className={`info-value status-${completionPercent === 100 ? 'complete' : 'incomplete'}`}>
            {completionPercent === 100 ? '✅ Complet' : '🔄 În lucru'}
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table className="score-table">
          <thead>
            <tr>
              <th className="sticky-header location-header">
                <div>📍 Locație</div>
                <div className="sub-header">(scor mediu)</div>
              </th>
              <th className="sticky-header">🏙️ Oraș</th>
              <th className="sticky-header">🏷️ Tip</th>
              {criteria.map((c) => {
                return (
                  <th
                    key={c.id} 
                    className="sticky-header criterion-header"
                    onClick={() => handleCriterionClick(c)}
                    title={`Click pentru detalii: ${c.name} - ${c.weight}%`}
                  >
                    <div className="criterion-title">
                      <span className="criterion-name">{c.name}</span>
                      <span className="criterion-weight">{c.weight}%</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => {
              const locationTotal = calculateLocationTotal(loc.id);
              return (
                <tr key={loc.id}>
                  <td className="location-name-cell">
                    <div className="location-name">
                      <strong>{loc.name}</strong>
                    </div>
                    {locationTotal && (
                      <div className="location-total">
                        Avg: <span className="total-score">{locationTotal}</span>
                      </div>
                    )}
                  </td>
                  <td className="location-city-cell">
                    <span className="city-text">{loc.city}</span>
                  </td>
                  <td className="location-type-cell">
                    <span className="type-badge">{loc.type}</span>
                    {loc.season && (
                      <span className="season-badge" title={`Sezon: ${loc.season}`}>
                        {loc.season === 'iarna' && '❄️'}
                        {loc.season === 'primăvara' && '🌷'}
                        {loc.season === 'vara' && '☀️'}
                        {loc.season === 'toamna' && '🍂'}
                        {loc.season === 'toate' && '🌈'}
                      </span>
                    )}
                  </td>
                  {criteria.map((c) => {
                    const score = scores[loc.id]?.[c.id];
                    const isActive = activeCell === `${loc.id}-${c.id}`;
                    
                    return (
                      <td key={c.id} className="score-cell">
                        <div className="score-input-container">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={score !== undefined ? score : ''}
                            onChange={(e) => handleInputChange(loc.id, c.id, e.target.value)}
                            onFocus={() => handleInputFocus(loc.id, c.id)}
                            onBlur={handleInputBlur}
                            className={`score-input ${isActive ? 'active' : ''}`}
                            style={{ 
                              backgroundColor: getScoreColor(score),
                              borderColor: isActive ? '#3498db' : '#ddd'
                            }}
                            placeholder="0-10"
                            aria-label={`Scor pentru ${loc.name} la criteriu ${c.name}`}
                          />
                          {score !== undefined && score !== '' && !isNaN(parseFloat(score)) && (
                            <div className="score-details">
                              <div className="score-hint">
                                {parseFloat(score).toFixed(1)}
                              </div>
                              <div className="score-description">
                                {getScoreDescription(score)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="matrix-stats">
        <div className="stat-card">
          <div className="stat-value">{completionPercent}%</div>
          <div className="stat-label">Completare</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {criteria.map(c => calculateCriterionAverage(c.id)).filter(avg => avg !== null).length}
          </div>
          <div className="stat-label">Criterii notate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {locations.filter(loc => calculateLocationTotal(loc.id) !== null).length}
          </div>
          <div className="stat-label">Locații notate</div>
        </div>
      </div>
    </div>
  );
}