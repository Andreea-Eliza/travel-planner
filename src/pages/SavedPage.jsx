import { Link } from 'react-router-dom';

// Sabloane predefinite de criterii
const CRITERIA_TEMPLATES = [
  {
    id: 'budget',
    name: 'Buget mic',
    icon: '💰',
    description: 'Pentru calatorii economice',
    criteria: [
      { name: 'Buget', weight: 50 },
      { name: 'Transport', weight: 25 },
      { name: 'Cazare', weight: 15 },
      { name: 'Mancare', weight: 10 },
    ],
  },
  {
    id: 'family',
    name: 'Familie cu copii',
    icon: '👨‍👩‍👧',
    description: 'Pentru vacante in familie',
    criteria: [
      { name: 'Siguranta', weight: 30 },
      { name: 'Activitati copii', weight: 25 },
      { name: 'Buget', weight: 20 },
      { name: 'Cazare', weight: 15 },
      { name: 'Vreme', weight: 10 },
    ],
  },
  {
    id: 'adventure',
    name: 'Aventura',
    icon: '🧗',
    description: 'Pentru cei activi si curajosi',
    criteria: [
      { name: 'Activitati', weight: 35 },
      { name: 'Natura', weight: 25 },
      { name: 'Vreme', weight: 20 },
      { name: 'Transport', weight: 10 },
      { name: 'Buget', weight: 10 },
    ],
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: '💑',
    description: 'Pentru cupluri',
    criteria: [
      { name: 'Atmosfera', weight: 30 },
      { name: 'Cazare', weight: 25 },
      { name: 'Gastronomie', weight: 20 },
      { name: 'Vreme', weight: 15 },
      { name: 'Buget', weight: 10 },
    ],
  },
  {
    id: 'cultural',
    name: 'Cultural',
    icon: '🏛️',
    description: 'Pentru pasionatii de istorie',
    criteria: [
      { name: 'Atractii culturale', weight: 40 },
      { name: 'Istorie', weight: 25 },
      { name: 'Transport', weight: 15 },
      { name: 'Cazare', weight: 10 },
      { name: 'Buget', weight: 10 },
    ],
  },
];

export default function SavedPage({ savedAnalyses, loadAnalysis, deleteAnalysis, applyTemplate }) {
  const handleLoad = (analysis) => {
    if (window.confirm(`Vrei sa incarci analiza "${analysis.name}"? Datele curente vor fi inlocuite.`)) {
      loadAnalysis(analysis);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Sterg analiza "${name}"?`)) {
      deleteAnalysis(id);
    }
  };

  const handleApplyTemplate = (template) => {
    if (window.confirm(`Aplici sablonul "${template.name}"? Criteriile curente vor fi inlocuite.`)) {
      applyTemplate(template.criteria);
    }
  };

  return (
    <div className="saved-page">
      {/* Analize salvate */}
      <section className="saved-section">
        <div className="saved-header">
          <div>
            <h2>Analize salvate</h2>
            <p className="section-subtitle">Reincarca o analiza facuta anterior</p>
          </div>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Nicio analiza salvata</h3>
            <p>Cand finalizezi o analiza pe pagina de rezultate, o poti salva cu butonul "Salveaza".</p>
            <Link to="/" className="back-button primary" style={{ marginTop: 16 }}>
              Incepe o analiza
            </Link>
          </div>
        ) : (
          <div className="saved-list">
            {savedAnalyses.map((a) => (
              <div key={a.id} className="saved-card">
                <div className="saved-card-info">
                  <div className="saved-card-header">
                    <h3>{a.name}</h3>
                    <span className="saved-date">{new Date(a.date).toLocaleDateString('ro-RO')}</span>
                  </div>
                  <div className="saved-card-meta">
                    {a.winner && (
                      <span className="saved-meta-item">
                        🏆 <strong>{a.winner}</strong>
                      </span>
                    )}
                    <span className="saved-meta-item">{a.locations.length} locatii</span>
                    <span className="saved-meta-item">{a.criteria.length} criterii</span>
                  </div>
                </div>
                <div className="saved-card-actions">
                  <button onClick={() => handleLoad(a)} className="btn-load">Incarca</button>
                  <button onClick={() => handleDelete(a.id, a.name)} className="btn-delete" title="Sterge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sabloane criterii */}
      <section className="saved-section">
        <div className="saved-header">
          <div>
            <h2>Sabloane de criterii</h2>
            <p className="section-subtitle">Configurari predefinite pentru tipuri populare de calatorii</p>
          </div>
        </div>

        <div className="templates-grid">
          {CRITERIA_TEMPLATES.map((t) => (
            <div key={t.id} className="template-card">
              <div className="template-header">
                <span className="template-icon">{t.icon}</span>
                <div>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                </div>
              </div>
              <ul className="template-criteria">
                {t.criteria.map((c, i) => (
                  <li key={i}>
                    <span>{c.name}</span>
                    <span className="template-weight">{c.weight}%</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleApplyTemplate(t)} className="btn-apply-template">
                Foloseste sablonul
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
