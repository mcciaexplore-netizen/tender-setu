import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { categoryOptions, states } from '../data/mockData';
import type { RegisterInput, TenderCategoryCode } from '../types';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [form, setForm] = useState<RegisterInput>({
    name: '',
    email: '',
    phone: '+91',
    password: '',
    companyName: '',
    state: states[1],
    district: '',
    preferredCategories: [],
    preferredStates: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = (location.state as { from?: string } | null)?.from ?? '/tenders';

  const toggleCategory = (value: TenderCategoryCode) => {
    setForm((current) => ({
      ...current,
      preferredCategories: current.preferredCategories?.includes(value)
        ? current.preferredCategories.filter((item) => item !== value)
        : [...(current.preferredCategories ?? []), value],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          ...form,
          preferredStates: form.state ? [form.state] : [],
        });
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,_#1B5E7B,_#143E54)] p-8 text-white shadow-card sm:p-10">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
          TenderSetu account
        </span>
        <h1 className="mt-5 text-4xl font-semibold">
          {mode === 'login' ? 'Welcome back to your tender pipeline.' : 'Create your workspace for public procurement.'}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-sky-50">
          Register once to save bookmarks, activate alerts, and move tenders across your team’s bid stages.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-2xl font-semibold text-ink">{mode === 'login' ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />
              <input
                value={form.companyName}
                onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                placeholder="Company name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+919876543210"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />
            </>
          )}
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email address"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            required
          />

          {mode === 'register' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={form.state}
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {states.slice(1).map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
                <input
                  value={form.district}
                  onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
                  placeholder="District"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  required
                />
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-ink">Preferred categories</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      type="button"
                      key={category.value}
                      onClick={() => toggleCategory(category.value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        form.preferredCategories?.includes(category.value)
                          ? 'bg-primary text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-70"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'} className="font-semibold text-primary">
            {mode === 'login' ? 'Register' : 'Login'}
          </Link>
        </p>
      </section>
    </div>
  );
};
