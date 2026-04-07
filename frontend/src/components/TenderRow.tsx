import { Link } from 'react-router-dom';
import type { BookmarkItem, Tender } from '../types';
import { formatCurrencyINR, formatDate } from '../utils/format';
import { Icon } from './Icon';

interface TenderRowProps {
  tender: Tender;
  bookmarked?: BookmarkItem;
  onBookmark: (tenderId: string) => void;
}

export const TenderRow = ({ tender, bookmarked, onBookmark }: TenderRowProps) => (
  <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-card lg:grid-cols-[1.8fr_0.9fr_0.8fr_0.7fr_auto] lg:items-center">
    <div>
      <Link to={`/tenders/${tender.id}`} className="text-lg font-semibold leading-7 text-ink hover:text-primary">
        {tender.title}
      </Link>
      <p className="mt-2 text-sm text-slate-500">{tender.department}</p>
      <p className="mt-1 text-sm text-slate-500">
        {tender.state} - {tender.district}
      </p>
    </div>
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Value</div>
      <div className="mt-1 text-sm font-semibold text-ink">{formatCurrencyINR(tender.estimatedValue)}</div>
    </div>
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Deadline</div>
      <div className="mt-1 text-sm font-semibold text-ink">{formatDate(tender.submissionDeadline)}</div>
    </div>
    <div>
      <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
        {tender.sourcePortal}
      </span>
    </div>
    <button
      onClick={() => onBookmark(tender.id)}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
        bookmarked ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'
      }`}
      aria-label="Bookmark tender"
    >
      <Icon path="M6.75 4.75h10.5a1 1 0 0 1 1 1v13.5l-6.25-3.75-6.25 3.75V5.75a1 1 0 0 1 1-1Z" />
    </button>
  </div>
);
