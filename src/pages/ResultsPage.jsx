import { useMemo } from 'react';
import { Link } from 'react-router-dom';

function ResultsPage({ locations, criteria, scores, ahpMatrix, saveAnalysis }) {

  // Calculează scorurile folosind Weighted Sum Model
  const calculateWeightedSumScores = useMemo(() => {
    if (!locations.length || !criteria.length) return [];

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    
    return locations.map(location => {
      let totalScore = 0;
      let criteriaScores = [];

      criteria.forEach(criterion => {
        const score = scores[location.id]?.[criterion.id] || 0;
        const weightedScore = (score / 10) * (criterion.weight / 100) * 100;
        totalScore += weightedScore;
        criteriaScores.push({
          criterion: criterion.name,
          score: score,
          weightedScore: weightedScore.toFixed(1)
        });
      });

      return {
        id: location.id,
        name: location.name,
        description: location.description,
        totalScore: totalScore.toFixed(1),
        normalizedScore: (totalScore / totalWeight * 100).toFixed(1),
        criteriaScores,
        rank: 0
      };
    }).sort((a, b) => b.totalScore - a.totalScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [locations, criteria, scores]);

  // Calculează scorurile folosind TOPSIS
  const calculateTopsisScores = useMemo(() => {
    if (!locations.length || !criteria.length) return [];

    // Pas 1: Normalizarea matricei
    const normalizedMatrix = locations.map(location => 
      criteria.map(criterion => {
        const score = scores[location.id]?.[criterion.id] || 0;
        return score;
      })
    );

    // Pas 2: Calculăm rădăcina pătrată a sumei pătratelor pentru fiecare criteriu
    const sqrtSumSquares = criteria.map((_, j) => {
      const sum = locations.reduce((acc, _, i) => acc + Math.pow(normalizedMatrix[i][j], 2), 0);
      return Math.sqrt(sum);
    });

    // Pas 3: Normalizăm matricea
    const weightedNormalized = normalizedMatrix.map(row => 
      row.map((value, j) => (value / sqrtSumSquares[j]) * (criteria[j].weight / 100))
    );

    // Pas 4: Găsim soluția ideală și anti-ideală
    const idealSolution = criteria.map((_, j) => 
      Math.max(...weightedNormalized.map(row => row[j]))
    );
    const antiIdealSolution = criteria.map((_, j) => 
      Math.min(...weightedNormalized.map(row => row[j]))
    );

    // Pas 5: Calculăm distanțele
    const distancesToIdeal = weightedNormalized.map(row => 
      Math.sqrt(row.reduce((acc, value, j) => 
        acc + Math.pow(value - idealSolution[j], 2), 0))
    );
    const distancesToAntiIdeal = weightedNormalized.map(row => 
      Math.sqrt(row.reduce((acc, value, j) => 
        acc + Math.pow(value - antiIdealSolution[j], 2), 0))
    );

    // Pas 6: Calculăm scorurile TOPSIS
    const topsisScores = locations.map((location, index) => {
      const closeness = distancesToAntiIdeal[index] / 
                       (distancesToIdeal[index] + distancesToAntiIdeal[index]);
      return {
        id: location.id,
        name: location.name,
        score: (closeness * 100).toFixed(1),
        distanceToIdeal: distancesToIdeal[index].toFixed(3),
        distanceToAntiIdeal: distancesToAntiIdeal[index].toFixed(3)
      };
    }).sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return topsisScores;
  }, [locations, criteria, scores]);

  // Calculează scorurile folosind AHP
  const calculateAhpScores = useMemo(() => {
    if (!locations.length || !criteria.length || !ahpMatrix.length) return [];

    // Normalizează matricea AHP
    const normalizedAhpMatrix = ahpMatrix.map(row => {
      const sum = row.reduce((acc, val) => acc + val, 0);
      return row.map(val => val / sum);
    });

    // Calculează ponderile criteriilor
    const criteriaWeights = normalizedAhpMatrix[0].map((_, j) => 
      normalizedAhpMatrix.reduce((acc, row) => acc + row[j], 0) / criteria.length
    );

    // Calculează scorurile AHP
    const ahpScores = locations.map(location => {
      let totalScore = 0;
      criteria.forEach((criterion, index) => {
        const score = scores[location.id]?.[criterion.id] || 0;
        totalScore += (score / 10) * criteriaWeights[index] * 100;
      });

      return {
        id: location.id,
        name: location.name,
        score: totalScore.toFixed(1),
        criteriaWeights: criteriaWeights.map(w => w.toFixed(3))
      };
    }).sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return ahpScores;
  }, [locations, criteria, scores, ahpMatrix]);

  // Calculează scorul mediu pentru fiecare locație
  const calculateAverageScores = useMemo(() => {
    const weightedSumScores = calculateWeightedSumScores;
    const topsisScores = calculateTopsisScores;
    const ahpScores = calculateAhpScores;

    if (!weightedSumScores.length) return [];

    return weightedSumScores.map(wsItem => {
      const topsisItem = topsisScores.find(t => t.id === wsItem.id);
      const ahpItem = ahpScores.find(a => a.id === wsItem.id);

      const scores = [
        parseFloat(wsItem.totalScore),
        topsisItem ? parseFloat(topsisItem.score) : 0,
        ahpItem ? parseFloat(ahpItem.score) : 0
      ].filter(score => !isNaN(score));

      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      return {
        id: wsItem.id,
        name: wsItem.name,
        description: wsItem.description,
        weightedSumScore: parseFloat(wsItem.totalScore) || 0,
        topsisScore: topsisItem ? parseFloat(topsisItem.score) : 0,
        ahpScore: ahpItem ? parseFloat(ahpItem.score) : 0,
        averageScore: averageScore.toFixed(1),
        finalRank: 0
      };
    }).sort((a, b) => b.averageScore - a.averageScore)
      .map((item, index) => ({ ...item, finalRank: index + 1 }));
  }, [calculateWeightedSumScores, calculateTopsisScores, calculateAhpScores]);

  const averageScores = calculateAverageScores;
  const finalRecommendation = averageScores[0];

  // Compatibility = average score normalized to 0-100
  const getCompatibility = (loc) => Math.round(parseFloat(loc.averageScore) || 0);

  // Per-criterion scores for the winner (from raw scores)
  const winnerCriteriaScores = finalRecommendation
    ? criteria.map((crit) => ({
        name: crit.name,
        weight: crit.weight,
        score: scores[finalRecommendation.id]?.[crit.id] || 0,
      }))
    : [];

  return (
    <div className="results-page">

      {/* === HERO RECOMMENDATION === */}
      {finalRecommendation && (
        <div className="recommendation-hero">
          <div className="hero-trophy">🏆</div>
          <div className="hero-text">
            <span className="hero-badge">Cea mai potrivita destinatie</span>
            <h1 className="hero-name">{finalRecommendation.name}</h1>
            <p className="hero-description">Pe baza criteriilor tale, aceasta este cea mai buna potrivire.</p>
          </div>
          <div className="hero-compatibility">
            <div className="compat-circle">
              <span className="compat-value">{getCompatibility(finalRecommendation)}%</span>
              <span className="compat-label">match</span>
            </div>
          </div>
        </div>
      )}

      <div className="results-grid">
      {/* === DE CE ACEASTA DESTINATIE === */}
      {finalRecommendation && winnerCriteriaScores.length > 0 && (
        <div className="why-section">
          <h2>De ce {finalRecommendation.name}?</h2>
          <p className="section-subtitle">Cum se descurca aceasta destinatie pe criteriile tale</p>
          <div className="criteria-bars">
            {winnerCriteriaScores.map((crit, idx) => {
              const percent = (crit.score / 10) * 100;
              const rating = crit.score >= 8 ? "Excelent" : crit.score >= 6 ? "Foarte bine" : crit.score >= 4 ? "Acceptabil" : "Slab";
              return (
                <div key={idx} className="criterion-bar">
                  <div className="criterion-bar-header">
                    <span className="criterion-bar-name">{crit.name}</span>
                    <span className="criterion-bar-rating">{rating}</span>
                  </div>
                  <div className="criterion-bar-track">
                    <div className="criterion-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="criterion-bar-meta">
                    <span>{crit.score}/10</span>
                    <span>Importanta: {crit.weight}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === TOATE DESTINATIILE === */}
      <div className="all-destinations">
        <h2>Toate destinatiile</h2>
        <p className="section-subtitle">Clasamentul complet pe baza criteriilor tale</p>
        <div className="destinations-list">
          {averageScores.map((item, index) => {
            const compat = getCompatibility(item);
            return (
              <div key={item.id} className={`destination-card ${index === 0 ? "winner" : ""}`}>
                <div className="dest-rank">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${item.finalRank}`}
                </div>
                <div className="dest-info">
                  <h3>{item.name}</h3>
                  <p>{locations.find(l => l.id === item.id)?.city || ""}</p>
                </div>
                <div className="dest-score">
                  <div className="dest-score-bar">
                    <div className="dest-score-fill" style={{ width: `${compat}%` }} />
                  </div>
                  <span className="dest-score-value">{compat}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* === ACTIUNI === */}
      <div className="results-actions">
        <Link to="/" className="action-button secondary">
          Modifica datele
        </Link>
        <Link to="/maps" className="action-button">
          Vezi pe harta
        </Link>
        <button
          onClick={() => {
            const name = window.prompt("Cum vrei sa numesti aceasta analiza?", finalRecommendation?.name || "Analiza vacanta");
            if (name && name.trim()) {
              saveAnalysis(name.trim(), finalRecommendation?.name || null);
              alert("Analiza salvata!");
            }
          }}
          className="action-button"
        >
          Salveaza analiza
        </button>
        <button onClick={() => window.print()} className="action-button secondary">
          Exporta raport
        </button>
      </div>

    </div>
  );
}

export default ResultsPage;