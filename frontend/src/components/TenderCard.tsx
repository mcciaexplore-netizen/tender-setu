import { Link } from 'react-router-dom';
import type { Tender } from '../types';
import { categoryLabelMap, formatCurrencyINR, formatDate, getDaysLeft, getDeadlineTone } from '../utils/format';

export const TenderCard = ({ tender }: { tender: Tender }) => {
  const daysLeft = getDaysLeft(tender.submissionDeadline);

  return (
    <Link
      to={`/tenders/${tender.id}`}
      className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
          {categoryLabelMap[tender.category]}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDeadlineTone(daysLeft)}`}>
          {daysLeft} days left
        </span>
      </div>
      <h3 className="line-clamp-2 text-lg font-semibold leading-7 text-ink transition group-hover:text-primary">
        {tender.title}
      </h3>
      <p className="mt-3 text-sm text-slate-500">{tender.department}</p>
      <div className="mt-6 grid gap-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>State</span>
          <span className="font-medium text-ink">{tender.state}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Estimated value</span>
          <span className="font-medium text-ink">{formatCurrencyINR(tender.estimatedValue)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Deadline</span>
          <span className="font-medium text-ink">{formatDate(tender.submissionDeadline)}</span>
        </div>
      </div>
    </Link>
  );
};
