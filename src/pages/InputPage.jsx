import React, { useState } from 'react';
import LocationForm from "../components/LocationForm";
import CriteriaForm from "../components/CriteriaForm";
import ScoreMatrix from "../components/ScoreMatrix";
import AHPPairwiseMatrix from "../components/AHPPairwiseMatrix";

function InputPage({ 
  locations, 
  criteria, 
  scores, 
  ahpMatrix,
  addLocation,
  addCriteria,
  handleScoreChange,
  removeCriterion,
  isDataComplete,
  initializeDefaultScores,
  handleLocationsOrCriteriaChange,
  persistAhpMatrix
}) {
  const [showCriteriaInfo, setShowCriteriaInfo] = useState(false);

  return (
    <div className="input-page">
      <div className="input-grid">
        <div className="input-section">
          <div className="section-card">
            <h2>📍 Adaugă locații</h2>
            <LocationForm addLocation={addLocation} />
          </div>
          
          <div className="section-divider"></div>
          
          <div className="section-card">
            <h2>
              Criterii de decizie
              <button className="info-btn" onClick={() => setShowCriteriaInfo(true)} title="Ce sunt criteriile?">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </button>
            </h2>
            <CriteriaForm addCriteria={addCriteria} criteria={criteria} />
          </div>

          {showCriteriaInfo && (
            <div className="modal-overlay" onClick={() => setShowCriteriaInfo(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Ce sunt criteriile de decizie?</h3>
                  <button className="modal-close" onClick={() => setShowCriteriaInfo(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Criteriile sunt factorii care conteaza pentru tine cand alegi o destinatie de vacanta. Fiecarui criteriu ii atribui o <strong>greutate procentuala</strong> care reflecta cat de important e pentru tine.</p>
                  <div className="modal-examples">
                    <h4>Exemple de criterii:</h4>
                    <ul>
                      <li><strong>Buget</strong> (30%) — cat de accesibila e destinatia</li>
                      <li><strong>Vreme</strong> (25%) — conditiile meteo in perioada aleasa</li>
                      <li><strong>Activitati</strong> (20%) — ce poti face acolo</li>
                      <li><strong>Siguranta</strong> (15%) — cat de sigura e zona</li>
                      <li><strong>Transport</strong> (10%) — cat de usor ajungi</li>
                    </ul>
                  </div>
                  <div className="modal-tip">
                    Suma greutatilor trebuie sa fie <strong>100%</strong>. Criteriile cu greutate mai mare vor influenta mai mult rezultatul final.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {criteria.length > 0 && (
            <div className="section-card criteria-list">
              <h3>📋 Criterii definite:</h3>
              <ul className="criteria-items">
                {criteria.map((criterion, index) => (
                  <li key={criterion.id} className="criterion-item">
                    <div className="criterion-info">
                      <span className="criterion-index">{index + 1}.</span>
                      <span className="criterion-name">{criterion.name}</span>
                      <span className="criterion-weight">{criterion.weight}%</span>
                    </div>
                    <button 
                      onClick={() => removeCriterion(criterion.id)}
                      className="remove-button small"
                      title="Șterge criteriu"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
           
          {locations.length > 0 && (
            <div className="section-card summary-card">
              <h3>📊 Sumar date:</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <span className="summary-label">Locații:</span>
                  <span className="summary-value">{locations.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Criterii:</span>
                  <span className="summary-value">{criteria.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Greutate totală:</span>
                  <span className="summary-value">
                    {criteria.reduce((sum, c) => sum + c.weight, 0)}%
                  </span>
                </div>
              </div>
              {isDataComplete() && (
                <div className="complete-status">
                  ✅ Datele sunt complete pentru calcul!
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="input-section">
          <div className="section-card">
            <h2>⚖️ Comparație criterii (AHP)</h2>
            {criteria.length >= 2 ? (
              <div className="ahp-container">
                <div className="ahp-instruction">
                  <p><strong>Instrucțiuni:</strong></p>
                  <p>Compară importanța relativă a criteriilor folosind o scală de la 0.1 la 9:</p>
                  <ul className="scale-examples">
                    <li>1 = Egal importanță</li>
                    <li>3 = Primul criteriu este de 3 ori mai important</li>
                    <li>1/3 = Al doilea criteriu este de 3 ori mai important</li>
                    <li>9 = Importanță extremă a primului criteriu</li>
                  </ul>
                </div>
                <AHPPairwiseMatrix
                  criteria={criteria}
                  ahpMatrix={ahpMatrix}
                  setAhpMatrix={persistAhpMatrix}
                />
                <div className="ahp-info">
                  <small>💡 Valorile din triunghiul inferior sunt reciprocele celor introduse</small>
                </div>
              </div>
            ) : (
              <div className="placeholder-message">
                <div className="placeholder-icon">⚖️</div>
                <p>Adaugă cel puțin <strong>2 criterii</strong> pentru a folosi comparația AHP.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {locations.length > 0 && criteria.length > 0 && (
        <div className="score-section">
          <div className="score-section-header">
            <h2>📝 Notează locațiile (scala 0-10)</h2>
            <div className="score-controls">
              <button 
                onClick={initializeDefaultScores}
                className="score-control-button"
                disabled={locations.length === 0 || criteria.length === 0}
              >
                🔄 Scoruri implicite (5)
              </button>
              <button 
                onClick={handleLocationsOrCriteriaChange}
                className="score-control-button secondary"
              >
                🔄 Actualizează scoruri
              </button>
            </div>
          </div>

          <ScoreMatrix
            locations={locations}
            criteria={criteria}
            scores={scores}
            onScoreChange={handleScoreChange}
          />

          {isDataComplete() ? (
            <div className="alert-success">
              <div className="alert-icon">✅</div>
              <div className="alert-content">
                <strong>Perfect!</strong> Toate datele sunt complete. 
                Poți accesa fila <strong>"Rezultate"</strong> pentru a vedea clasamentul.
              </div>
            </div>
          ) : (
            <div className="alert-warning">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Atenție!</strong> Completează toate scorurile pentru fiecare 
                locație și criteriu (scala 0-10).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InputPage;