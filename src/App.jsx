// src/App.jsx
import { useState, lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

// Pagina principala — incarcata imediat (e ce vede userul prima oara)
import InputPage from "./pages/InputPage";
import PageLoader from "./components/PageLoader";

// Restul paginilor sunt lazy — bundle initial mai mic
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const MapsPage = lazy(() => import("./pages/MapsPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));

import "./App.css";

// Schema version - bump cand schimbi structura datelor
const STORAGE_VERSION = 1;

// La incarcare, verifica versiunea si reseteaza datele incompatibile
(function checkStorageVersion() {
  try {
    const saved = parseInt(localStorage.getItem("storageVersion") || "0", 10);
    if (saved !== STORAGE_VERSION) {
      // Migrare: deocamdata pur si simplu marcam versiunea curenta.
      // Cand vor exista breaking changes, aici vor merge transformari pe date vechi.
      localStorage.setItem("storageVersion", String(STORAGE_VERSION));
    }
  } catch {
    // localStorage indisponibil
  }
})();

function safeLoadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

// SVG icons for sidebar
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  results: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  map: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  bookmark: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  compass: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  pin: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

function App() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [locations, setLocations] = useState(() => safeLoadJSON("locations", []));
  const [criteria, setCriteria] = useState(() => safeLoadJSON("criteria", []));
  const [scores, setScores] = useState(() => safeLoadJSON("scores", {}));
  const [ahpMatrix, setAhpMatrix] = useState(() => safeLoadJSON("ahpMatrix", []));
  const [savedAnalyses, setSavedAnalyses] = useState(() => safeLoadJSON("savedAnalyses", []));
  const [trips, setTrips] = useState(() => safeLoadJSON("trips", []));

  const persistTrips = (data) => {
    setTrips(data);
    localStorage.setItem("trips", JSON.stringify(data));
  };

  const addTrip = (trip) => {
    persistTrips([...trips, { id: crypto.randomUUID(), ...trip }]);
  };

  const deleteTrip = (id) => {
    persistTrips(trips.filter((t) => t.id !== id));
  };

  const persistSavedAnalyses = (data) => {
    setSavedAnalyses(data);
    localStorage.setItem("savedAnalyses", JSON.stringify(data));
  };

  const saveAnalysis = (name, winner) => {
    const newEntry = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      winner,
      locations,
      criteria,
      scores,
      ahpMatrix,
    };
    persistSavedAnalyses([newEntry, ...savedAnalyses]);
  };

  const loadAnalysis = (analysis) => {
    persistLocations(analysis.locations || []);
    persistCriteria(analysis.criteria || []);
    persistScores(analysis.scores || {});
    persistAhpMatrix(analysis.ahpMatrix || []);
  };

  const deleteAnalysis = (id) => {
    persistSavedAnalyses(savedAnalyses.filter((a) => a.id !== id));
  };

  const applyTemplate = (templateCriteria) => {
    const newCriteria = templateCriteria.map((c) => ({ id: crypto.randomUUID(), ...c }));
    const n = newCriteria.length;
    const newMatrix = Array(n).fill(0).map(() => Array(n).fill(1));
    persistCriteria(newCriteria);
    persistAhpMatrix(newMatrix);
  };

  const persistLocations = (data) => {
    setLocations(data);
    localStorage.setItem("locations", JSON.stringify(data));
  };

  const persistCriteria = (data) => {
    setCriteria(data);
    localStorage.setItem("criteria", JSON.stringify(data));
  };

  const persistScores = (data) => {
    setScores(data);
    localStorage.setItem("scores", JSON.stringify(data));
  };

  const persistAhpMatrix = (data) => {
    setAhpMatrix(data);
    localStorage.setItem("ahpMatrix", JSON.stringify(data));
  };

  const addLocation = (loc) => {
    const newLoc = { id: crypto.randomUUID(), ...loc };
    persistLocations([...locations, newLoc]);
  };

  const addCriteria = (crit) => {
    const newCrit = { id: crypto.randomUUID(), ...crit };
    const updatedCriteria = [...criteria, newCrit];
    const newLength = updatedCriteria.length;

    let newMatrix = Array(newLength).fill(0).map(() => Array(newLength).fill(1));
    for (let i = 0; i < newLength; i++) newMatrix[i][i] = 1;

    if (ahpMatrix.length > 0 && ahpMatrix[0].length === newLength - 1) {
      for (let i = 0; i < newLength - 1; i++) {
        for (let j = 0; j < newLength - 1; j++) {
          if (ahpMatrix[i] && ahpMatrix[i][j] !== undefined) {
            newMatrix[i][j] = ahpMatrix[i][j];
          }
        }
      }
    }

    persistCriteria(updatedCriteria);
    persistAhpMatrix(newMatrix);
  };

  const handleScoreChange = (locId, critId, value) => {
    const numValue = parseFloat(value);
    const updatedScores = {
      ...scores,
      [locId]: {
        ...scores[locId],
        [critId]: isNaN(numValue) ? 0 : Math.max(0, Math.min(10, numValue)),
      },
    };
    persistScores(updatedScores);
  };

  const removeCriterion = (criterionId) => {
    const updatedCriteria = criteria.filter((c) => c.id !== criterionId);
    const newLength = updatedCriteria.length;

    let newMatrix = [];
    if (newLength > 0) {
      newMatrix = Array(newLength).fill(0).map(() => Array(newLength).fill(1));
      for (let i = 0; i < newLength; i++) newMatrix[i][i] = 1;
    }

    persistCriteria(updatedCriteria);
    persistAhpMatrix(newMatrix);
  };

  const isDataComplete = () => {
    if (locations.length === 0 || criteria.length === 0) return false;
    return locations.every((loc) =>
      criteria.every((crit) => {
        const score = scores[loc.id]?.[crit.id];
        return score !== undefined && score !== "" && !isNaN(score);
      })
    );
  };

  const resetData = () => {
    if (window.confirm("Sigur vrei sa resetezi toate datele?")) {
      persistLocations([]);
      persistCriteria([]);
      persistScores({});
      persistAhpMatrix([]);
      localStorage.removeItem("locations");
      localStorage.removeItem("criteria");
      localStorage.removeItem("scores");
      localStorage.removeItem("ahpMatrix");
      localStorage.removeItem("destinations");
    }
  };

  const initializeDefaultScores = () => {
    if (locations.length === 0 || criteria.length === 0) return;
    const newScores = {};
    locations.forEach((loc) => {
      newScores[loc.id] = {};
      criteria.forEach((crit) => {
        newScores[loc.id][crit.id] = 5;
      });
    });
    persistScores(newScores);
  };

  const updateScoresForNewItems = () => {
    const newScores = { ...scores };
    let hasUpdates = false;
    locations.forEach((loc) => {
      if (!newScores[loc.id]) newScores[loc.id] = {};
      criteria.forEach((crit) => {
        if (newScores[loc.id][crit.id] === undefined) {
          newScores[loc.id][crit.id] = 5;
          hasUpdates = true;
        }
      });
    });
    if (hasUpdates) persistScores(newScores);
  };

  const handleLocationsOrCriteriaChange = () => {
    if (locations.length > 0 && criteria.length > 0) {
      setTimeout(updateScoresForNewItems, 0);
    }
  };

  const canNavigateToResults = isDataComplete();
  const canNavigateToMaps = locations.length > 0;

  return (
    <div className={`dashboard-layout ${sidebarOpen ? "sidebar-expanded" : ""}`}>
      {/* ===== TOP BAR (full width) ===== */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Inchide meniul" : "Deschide meniul"}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-logo">
            <span className="logo-icon">T</span>
            <span className="logo-text">travel planner</span>
          </div>
        </div>

        <div className="search-bar">
          {icons.search}
          <input
            type="text"
            placeholder="Search destination...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="topbar-right">
          <button className="topbar-icon-btn" title="Notificari">
            {icons.bell}
          </button>
        </div>
      </header>

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${sidebarOpen ? "expanded" : ""}`}>
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${location.pathname === "/" ? "active" : ""}`} title="Date">
            {icons.dashboard}
            <span className="sidebar-label">Date</span>
          </Link>
          <Link
            to="/results"
            className={`sidebar-link ${location.pathname === "/results" ? "active" : ""}`}
            title="Rezultate"
            style={{ opacity: canNavigateToResults ? 1 : 0.4, pointerEvents: canNavigateToResults ? "auto" : "none" }}
          >
            {icons.results}
            <span className="sidebar-label">Rezultate</span>
          </Link>
          <Link
            to="/maps"
            className={`sidebar-link ${location.pathname === "/maps" ? "active" : ""}`}
            title="Harti"
            style={{ opacity: canNavigateToMaps ? 1 : 0.4, pointerEvents: canNavigateToMaps ? "auto" : "none" }}
          >
            {icons.map}
            <span className="sidebar-label">Harti</span>
          </Link>
          <Link to="/saved" className={`sidebar-link ${location.pathname === "/saved" ? "active" : ""}`} title="Salvate">
            {icons.bookmark}
            <span className="sidebar-label">Salvate</span>
          </Link>
          <Link to="/calendar" className={`sidebar-link ${location.pathname === "/calendar" ? "active" : ""}`} title="Calendar">
            {icons.calendar}
            <span className="sidebar-label">Calendar</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-link" title="Setari">
            {icons.settings}
            <span className="sidebar-label">Setari</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main className="main-area">
        {/* Greeting */}
        <div className="greeting-section">
          <p className="greeting-date">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="greeting-title">Bun venit!</h1>
        </div>

        {/* Navigation tabs */}
        <div className="tabs">
          <Link to="/" className={`tab-button ${location.pathname === "/" ? "active" : ""}`}>
            Introducere Date
          </Link>
          <Link
            to="/results"
            className={`tab-button ${location.pathname === "/results" ? "active" : ""}`}
            style={{ opacity: canNavigateToResults ? 1 : 0.5, pointerEvents: canNavigateToResults ? "auto" : "none" }}
          >
            Rezultate
          </Link>
          <Link
            to="/maps"
            className={`tab-button ${location.pathname === "/maps" ? "active" : ""}`}
            style={{ opacity: canNavigateToMaps ? 1 : 0.5, pointerEvents: canNavigateToMaps ? "auto" : "none" }}
          >
            Harti
          </Link>
        </div>

        {/* Content */}
        <div className="content-area">
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={
              <InputPage
                locations={locations}
                criteria={criteria}
                scores={scores}
                ahpMatrix={ahpMatrix}
                addLocation={addLocation}
                addCriteria={addCriteria}
                handleScoreChange={handleScoreChange}
                removeCriterion={removeCriterion}
                isDataComplete={isDataComplete}
                initializeDefaultScores={initializeDefaultScores}
                handleLocationsOrCriteriaChange={handleLocationsOrCriteriaChange}
                persistAhpMatrix={persistAhpMatrix}
              />
            } />

            <Route path="/results" element={
              canNavigateToResults ? (
                <ResultsPage
                  locations={locations}
                  criteria={criteria}
                  scores={scores}
                  ahpMatrix={ahpMatrix}
                  saveAnalysis={saveAnalysis}
                />
              ) : (
                <div className="redirect-message">
                  <div className="redirect-icon">⚠️</div>
                  <h3>Date incomplete</h3>
                  <p>Completeaza toate campurile pentru a vedea rezultatele.</p>
                  <ul className="requirements-list">
                    <li>Cel putin o locatie definita</li>
                    <li>Cel putin un criteriu definit</li>
                    <li>Toate scorurile completate (0-10)</li>
                  </ul>
                  <Link to="/" className="back-button primary">
                    Mergi la Introducere Date
                  </Link>
                </div>
              )
            } />

            <Route path="/maps" element={
              canNavigateToMaps ? (
                <MapsPage locations={locations} criteria={criteria} scores={scores} />
              ) : (
                <div className="redirect-message">
                  <div className="redirect-icon">🗺️</div>
                  <h3>Nicio locatie definita</h3>
                  <p>Adauga cel putin o locatie pentru a accesa hartile.</p>
                  <Link to="/" className="back-button primary">Adauga prima locatie</Link>
                </div>
              )
            } />

            <Route path="/saved" element={
              <SavedPage
                savedAnalyses={savedAnalyses}
                loadAnalysis={loadAnalysis}
                deleteAnalysis={deleteAnalysis}
                applyTemplate={applyTemplate}
              />
            } />

            <Route path="/calendar" element={
              <CalendarPage trips={trips} addTrip={addTrip} deleteTrip={deleteTrip} />
            } />

            <Route path="*" element={
              <div className="redirect-message">
                <h1 style={{ fontSize: "3rem", marginBottom: 8 }}>404</h1>
                <h3>Pagina nu a fost gasita</h3>
                <Link to="/" className="back-button primary">Inapoi la pagina principala</Link>
              </div>
            } />
          </Routes>
          </Suspense>
        </div>

        {/* Bottom controls */}
        <div className="app-controls">
          <button onClick={resetData} className="reset-button">
            Resetare date
          </button>
          <div className="data-info">
            <span className="data-badge">{locations.length} locatii</span>
            <span className="data-badge">{criteria.length} criterii</span>
            <span className="data-badge">
              {Object.values(scores).reduce((total, locScores) =>
                total + Object.values(locScores).filter(s => s !== undefined && s !== "").length, 0
              )} scoruri
            </span>
          </div>
        </div>
      </main>
      <Analytics />
    </div>
  );
}

export default App;
