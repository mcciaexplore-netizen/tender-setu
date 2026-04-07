export const StatBar = ({ totalActive }: { totalActive?: number }) => {
  const stats = [`${totalActive ? totalActive.toLocaleString('en-IN') : '12,450+'} Tenders`, '100+ Sources', '5,000+ MSMEs'];

  return (
  <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-3 sm:p-5">
    {stats.map((stat) => (
      <div key={stat} className="rounded-2xl bg-accent px-4 py-4 text-center text-sm font-semibold text-primary">
        {stat}
      </div>
    ))}
  </div>
  );
};
