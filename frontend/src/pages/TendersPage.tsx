import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/api';
import { Pagination } from '../components/Pagination';
import { TenderRow } from '../components/TenderRow';
import { categoryOptions, states } from '../data/mockData';
import type { BookmarkItem, Tender, TenderCategoryCode } from '../types';

const pageSize = 6;

export const TendersPage = () => {
  const [params] = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<TenderCategoryCode[]>([]);
  const [selectedState, setSelectedState] = useState(params.get('state') ?? 'All States');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState<'7' | '15' | '30' | 'all'>('all');
  const [status, setStatus] = useState<'All' | 'OPEN' | 'CLOSING_SOON'>('All');
  const [sortBy, setSortBy] = useState<'publishedDate' | 'submissionDeadline' | 'estimatedValue'>('publishedDate');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const loadTenders = async () => {
    const response = await api.getTenders({
      page,
      limit: pageSize,
      search: params.get('q') ?? undefined,
      category:
        selectedCategories.length === 1
          ? selectedCategories[0]
          : ((params.get('category') as TenderCategoryCode | null) ?? undefined),
      state: selectedState !== 'All States' ? selectedState : undefined,
      minValue: budgetMin ? Number(budgetMin) : undefined,
      maxValue: budgetMax ? Number(budgetMax) : undefined,
      deadline: deadlineFilter === 'all' ? undefined : Number(deadlineFilter) as 7 | 15 | 30,
      status: status === 'All' ? undefined : status,
      sort: sortBy,
    });
    setTenders(response.data);
    setTotalPages(Math.max(1, response.pagination.pages));
    setTotalResults(response.pagination.total);
  };

  useEffect(() => {
    void loadTenders();
  }, [page, params, selectedCategories, selectedState, budgetMin, budgetMax, deadlineFilter, status, sortBy]);

  useEffect(() => {
    api.getBookmarks().then(setBookmarks);
  }, []);

  const toggleCategory = (category: TenderCategoryCode) => {
    setPage(1);
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [category],
    );
  };

  const handleBookmark = async (tenderId: string) => {
    const nextBookmarks = await api.saveBookmark(tenderId, 'DISCOVERED');
    setBookmarks(nextBookmarks);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
        <h1 className="text-xl font-semibold text-ink">Filters</h1>
        <div className="mt-6 space-y-6 text-sm">
          <div>
            <h2 className="font-semibold text-ink">Category</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <label key={category.value} className="flex items-center gap-3 text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => toggleCategory(category.value)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  {category.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-ink">State</h2>
            <select
              value={selectedState}
              onChange={(event) => {
                setSelectedState(event.target.value);
                setPage(1);
              }}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
            >
              {states.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="font-semibold text-ink">Budget Range</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                placeholder="Min"
                value={budgetMin}
                onChange={(event) => {
                  setBudgetMin(event.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              />
              <input
                placeholder="Max"
                value={budgetMax}
                onChange={(event) => {
                  setBudgetMax(event.target.value);
                  setPage(1);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-ink">Deadline</h2>
            <div className="mt-3 space-y-2 text-slate-600">
              {[
                ['7', 'Next 7 days'],
                ['15', 'Next 15 days'],
                ['30', 'Next 30 days'],
                ['all', 'All days'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deadline"
                    checked={deadlineFilter === value}
                    onChange={() => {
                      setDeadlineFilter(value as '7' | '15' | '30' | 'all');
                      setPage(1);
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-ink">Status</h2>
            <div className="mt-3 space-y-2 text-slate-600">
              {[
                ['All', 'All'],
                ['OPEN', 'Open'],
                ['CLOSING_SOON', 'Closing Soon'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="status"
                    checked={status === value}
                    onChange={() => {
                      setStatus(value as 'All' | 'OPEN' | 'CLOSING_SOON');
                      setPage(1);
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Explore Tenders</h1>
            <p className="mt-1 text-sm text-slate-500">{totalResults} opportunities match your filters</p>
          </div>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as 'publishedDate' | 'submissionDeadline' | 'estimatedValue');
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="publishedDate">Newest</option>
            <option value="submissionDeadline">Deadline (soonest)</option>
            <option value="estimatedValue">Value (highest)</option>
          </select>
        </div>

        <div className="space-y-4">
          {tenders.map((tender) => (
            <TenderRow
              key={tender.id}
              tender={tender}
              bookmarked={bookmarks.find((item) => item.tenderId === tender.id)}
              onBookmark={handleBookmark}
            />
          ))}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </section>
    </div>
  );
};
