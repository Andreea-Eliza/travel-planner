import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearStorage = () => {
    if (window.confirm('Sterg toate datele salvate (locatii, criterii, scoruri, calatorii)? Asta poate rezolva erori cauzate de date corupte.')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1>Ceva nu a mers bine</h1>
            <p>Aplicatia a intampinat o eroare neasteptata.</p>
            {this.state.error && (
              <details className="error-details">
                <summary>Detalii tehnice</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="error-btn primary">
                Reincarca pagina
              </button>
              <button onClick={this.handleClearStorage} className="error-btn secondary">
                Sterge datele salvate
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
