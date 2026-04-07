import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { SearchHero } from '../components/SearchHero';
import { StatBar } from '../components/StatBar';
import { TenderCard } from '../components/TenderCard';
import type { Tender } from '../types';

export const HomePage = () => {
  const [recentTenders, setRecentTenders] = useState<Tender[]>([]);
  const [totalActive, setTotalActive] = useState<number>();

  useEffect(() => {
    api.getTenders({ limit: 6 }).then((response) => {
      const sorted = [...response.data].sort(
        (left, right) => new Date(right.publishedDate).getTime() - new Date(left.publishedDate).getTime(),
      );
      setRecentTenders(sorted.slice(0, 6));
    });
    api.getTenderStats().then((stats) => setTotalActive(stats.totalActive));
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <SearchHero />
      <StatBar totalActive={totalActive} />

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Recent tenders</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Fresh opportunities curated for fast-moving teams</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recentTenders.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      </section>
    </div>
  );
};
