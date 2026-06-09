// src/components/WelcomeHero.jsx
// Hero de bun-venit pentru utilizatorii noi (afisat cand nu exista inca date).
import { Link } from "react-router-dom";

export default function WelcomeHero({ onLoadExample, onDismiss }) {
  return (
    <div className="welcome-hero">
      <button className="welcome-dismiss" onClick={onDismiss} title="Inchide mesajul de bun-venit">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <span className="welcome-badge">✈️ Travel Planner</span>
      <h2 className="welcome-title">Alege destinația perfectă pe bază de date, nu la noroc</h2>
      <p className="welcome-subtitle">
        Compari mai multe destinații după criteriile care contează pentru tine — buget, vreme,
        activități, siguranță — iar aplicația calculează clasamentul folosind 3 metode științifice:{" "}
        <strong>WSM</strong>, <strong>TOPSIS</strong> și <strong>AHP</strong>.
      </p>

      <div className="welcome-steps">
        <div className="welcome-step">
          <span className="welcome-step-num">1</span>
          <div className="welcome-step-text">
            <strong>Adaugă destinații</strong>
            <p>Orașele sau țările între care vrei să alegi.</p>
          </div>
        </div>
        <span className="welcome-step-arrow">→</span>
        <div className="welcome-step">
          <span className="welcome-step-num">2</span>
          <div className="welcome-step-text">
            <strong>Stabilește criterii</strong>
            <p>Ce contează și cât de mult (greutăți).</p>
          </div>
        </div>
        <span className="welcome-step-arrow">→</span>
        <div className="welcome-step">
          <span className="welcome-step-num">3</span>
          <div className="welcome-step-text">
            <strong>Vezi clasamentul</strong>
            <p>Recomandarea, calculată automat.</p>
          </div>
        </div>
      </div>

      <div className="welcome-actions">
        <button className="welcome-cta-primary" onClick={onLoadExample}>
          ✨ Încarcă un exemplu
        </button>
        <Link to="/saved" className="welcome-cta-secondary">
          Pornește de la un șablon
        </Link>
      </div>

      <p className="welcome-hint">
        💾 Totul se salvează local, pe dispozitivul tău — fără cont, fără server. Poți reseta oricând.
      </p>
    </div>
  );
}
