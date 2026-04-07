import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export const AppLayout = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);
