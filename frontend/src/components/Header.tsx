import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `transition ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`;

export const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
            TS
          </div>
          <div>
            <div className="text-lg font-semibold text-ink">TenderSetu</div>
            <div className="text-xs text-slate-500">Discover government tenders with confidence</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/tenders" className={navLinkClass}>
            Explore
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-ink">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-sky-800"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
