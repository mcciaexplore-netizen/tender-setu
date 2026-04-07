import type { TenderCategoryCode, TenderStageCode, TenderStatusCode } from '../types';

export const formatCurrencyINR = (value: number | null) => {
  if (value === null) return 'Not disclosed';

  if (value >= 10000000) {
    return `Rs ${(value / 10000000).toFixed(value >= 100000000 ? 1 : 2)} Cr`;
  }

  if (value >= 100000) {
    return `Rs ${(value / 100000).toFixed(value >= 1000000 ? 1 : 2)} Lakh`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getDaysLeft = (deadline: string) => {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const getDeadlineTone = (daysLeft: number) => {
  if (daysLeft < 3) return 'bg-rose-100 text-rose-700';
  if (daysLeft < 7) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

export const categoryLabelMap: Record<TenderCategoryCode, string> = {
  CONSTRUCTION: 'Construction',
  IT_SERVICES: 'IT Services',
  MEDICAL: 'Healthcare',
  ELECTRICAL: 'Electrical',
  STATIONERY: 'Stationery',
  TRANSPORTATION: 'Transportation',
  PLUMBING: 'Plumbing',
  CONSULTING: 'Consulting',
  OTHER: 'Other',
};

export const statusLabelMap: Record<TenderStatusCode, string> = {
  OPEN: 'Open',
  CLOSING_SOON: 'Closing Soon',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const stageLabelMap: Record<TenderStageCode, string> = {
  DISCOVERED: 'Discovered',
  EVALUATING: 'Evaluating',
  PREPARING: 'Preparing',
  SUBMITTED: 'Submitted',
  AWARDED: 'Awarded',
};
