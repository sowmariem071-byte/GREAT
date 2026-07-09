export function StatCard({
  label,
  value,
  hint,
  icon = "•",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
}) {
  return (
    <article className="module-stat-card">
      <span className="summary-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {hint ? <p>{hint}</p> : null}
      </div>
    </article>
  );
}
