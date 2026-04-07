import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryOptions, states } from '../data/mockData';
import type { TenderCategoryCode } from '../types';

export const SearchHero = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(categoryOptions[0].value);
  const [state, setState] = useState(states[1]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (category) params.set('category', category);
    if (state && state !== 'All States') params.set('state', state);
    navigate(`/tenders?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.32),_transparent_35%),linear-gradient(135deg,_#1B5E7B,_#123D54)] px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent)] lg:block" />
      <div className="relative max-w-4xl">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
          Procurement intelligence for MSMEs
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          Find the right government tenders before the market does.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
          Search across portals, shortlist strategically, and keep your bid pipeline organized from discovery to award.
        </p>

        <div className="mt-8 grid gap-3 rounded-3xl bg-white p-4 text-slate-900 shadow-card sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by keyword, department, or tender ID"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-primary"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as TenderCategoryCode)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary"
          >
            {categoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={state}
            onChange={(event) => setState(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary"
          >
            {states.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
};
