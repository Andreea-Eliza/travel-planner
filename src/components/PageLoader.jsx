export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="skeleton-card skeleton-hero" />
      <div className="skeleton-grid">
        <div className="skeleton-card skeleton-block" />
        <div className="skeleton-card skeleton-block" />
      </div>
      <div className="skeleton-card skeleton-block-tall" />
    </div>
  );
}
