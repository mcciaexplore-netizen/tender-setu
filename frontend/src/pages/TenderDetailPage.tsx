import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/api';
import { TenderCard } from '../components/TenderCard';
import { stageOptions } from '../data/mockData';
import type { BookmarkItem, Tender, TenderStageCode } from '../types';
import { categoryLabelMap, formatCurrencyINR, formatDate, stageLabelMap } from '../utils/format';

export const TenderDetailPage = () => {
  const { id } = useParams();
  const [tender, setTender] = useState<Tender | undefined>();
  const [allTenders, setAllTenders] = useState<Tender[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [stage, setStage] = useState<TenderStageCode>('DISCOVERED');

  useEffect(() => {
    api.getTenderById(id ?? '').then(setTender);
    api.getTenders({ limit: 24 }).then((response) => setAllTenders(response.data));
    api.getBookmarks().then((items) => {
      setBookmarks(items);
      const existing = items.find((entry) => entry.tenderId === id);
      if (existing) setStage(existing.stage);
    });
  }, [id]);

  const similarTenders = useMemo(() => {
    if (!tender) return [];
    return allTenders
      .filter((item) => item.id !== tender.id && item.category === tender.category && item.state === tender.state)
      .slice(0, 3);
  }, [allTenders, tender]);

  if (!tender) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-ink">Tender not found</h1>
        <Link to="/tenders" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
          Back to explore
        </Link>
      </div>
    );
  }

  const handleBookmark = async () => {
    const nextBookmarks = await api.saveBookmark(tender.id, stage);
    setBookmarks(nextBookmarks);
  };

  const bookmark = bookmarks.find((item) => item.tenderId === tender.id);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
              {categoryLabelMap[tender.category]}
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {tender.sourcePortal}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-ink">{tender.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">{tender.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ['Reference number', tender.referenceNumber],
              ['Issuing authority', tender.issuingAuthority],
              ['Department', tender.department],
              ['Category', categoryLabelMap[tender.category]],
              ['Location', `${tender.state}, ${tender.district}`],
              ['Estimated value', formatCurrencyINR(tender.estimatedValue)],
              ['EMD amount', formatCurrencyINR(tender.emdAmount)],
              ['Published date', formatDate(tender.publishedDate)],
              ['Deadline', formatDate(tender.submissionDeadline)],
              ['Pre-bid meeting', formatDate(tender.prebidMeetingDate ?? undefined)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                <div className="mt-2 text-sm font-semibold text-ink">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <a
            href={tender.tenderDocUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Download document
          </a>

          <div className="rounded-3xl bg-slate-50 p-4">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Bookmark stage</label>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as TenderStageCode)}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              {stageOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleBookmark}
              className="mt-4 w-full rounded-2xl border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-accent"
            >
              {bookmark ? `Update bookmark: ${stageLabelMap[bookmark.stage]}` : 'Save bookmark'}
            </button>
          </div>

          <a
            href={tender.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            View source portal
          </a>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Similar tenders</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">More opportunities in the same category and state</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {similarTenders.map((item) => (
            <TenderCard key={item.id} tender={item} />
          ))}
        </div>
      </section>
    </div>
  );
};
