import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { stageOptions } from '../data/mockData';
import type { AlertItem, BookmarkItem, Tender } from '../types';
import { formatDate, getDaysLeft, stageLabelMap } from '../utils/format';

export const DashboardPage = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    api.getTenders({ limit: 24 }).then((response) => setTenders(response.data));
    api.getBookmarks().then(setBookmarks);
    api.getAlerts().then(setAlerts);
  }, []);

  const bookmarkedTenders = useMemo(
    () =>
      bookmarks
        .map((bookmark) => ({
          ...bookmark,
          tender: bookmark.tender ?? tenders.find((tender) => tender.id === bookmark.tenderId),
        }))
        .filter((entry): entry is BookmarkItem & { tender: Tender } => Boolean(entry.tender)),
    [bookmarks, tenders],
  );

  const closingThisWeek = tenders.filter((tender) => getDaysLeft(tender.submissionDeadline) <= 7).length;
  const activeAlerts = alerts.filter((alert) => alert.isActive).length;

  const handleToggleAlert = async (id: string) => {
    const nextAlerts = await api.toggleAlert(id);
    setAlerts(nextAlerts);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Bookmarked tenders', String(bookmarks.length)],
          ['Alerts active', String(activeAlerts)],
          ['Tenders closing this week', String(closingThisWeek)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-3 text-3xl font-semibold text-ink">{value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">My bookmarks</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Kanban board for your active opportunities</h1>
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {stageOptions.map((stage) => (
            <div key={stage.value} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-ink">{stage.label}</h2>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                  {bookmarkedTenders.filter((item) => item.stage === stage.value).length}
                </span>
              </div>
              <div className="space-y-3">
                {bookmarkedTenders
                  .filter((item) => item.stage === stage.value)
                  .map((item) => (
                    <Link
                      key={item.id}
                      to={`/tenders/${item.tenderId}`}
                      className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-accent"
                    >
                      <h3 className="text-sm font-semibold text-ink">{item.tender.title}</h3>
                      <p className="mt-2 text-xs text-slate-500">{item.tender.department}</p>
                      <p className="mt-2 text-xs text-slate-500">Stage: {stageLabelMap[item.stage]}</p>
                      <p className="mt-2 text-xs text-slate-500">Deadline: {formatDate(item.tender.submissionDeadline)}</p>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">My alerts</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Automations keeping your team in the loop</h2>
        </div>

        <div className="mt-6 space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-ink">{alert.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {alert.keywords.join(', ') || 'No keywords'} • {alert.states.join(', ') || 'All states'}
                </p>
              </div>
              <button
                onClick={() => handleToggleAlert(alert.id)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
                  alert.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {alert.isActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
