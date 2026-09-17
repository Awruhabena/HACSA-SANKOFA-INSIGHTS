import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, CalendarDays, LogOut, Menu, X, Sparkles } from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all min-h-[42px] flex items-center gap-2 ${
      isActive
        ? 'bg-teal text-white shadow-xs'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`;

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      <header className="bg-navy border-b border-navy/30 shadow-xs sticky top-0 z-50">
        <div className="mx-auto max-w-admin px-4 sm:px-6">
          <div className="flex items-center justify-between h-18">
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/hacsa-logo.png"
                  alt="HACSA Foundation Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-lg font-bold text-white tracking-tight leading-tight">
                    HACSA Sankofa
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal/20 border border-teal/40 text-[10px] font-bold text-teal tracking-wide uppercase font-heading">
                    <Sparkles className="w-2.5 h-2.5 text-teal" />
                    Insights
                  </span>
                </div>
                <p className="text-[11px] text-white/60 font-body">
                  Heritage & Cultural Society of Africa
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/admin/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/admin/events" className={navLinkClass}>
                <CalendarDays className="w-4 h-4" />
                <span>Events</span>
              </NavLink>
            </nav>

            {/* Desktop Sign Out */}
            <div className="hidden md:block">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all px-3 py-2 min-h-[42px] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white rounded-xl hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {menuOpen && (
            <nav className="md:hidden py-4 border-t border-white/10 space-y-2">
              <NavLink
                to="/admin/dashboard"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/events"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Events</span>
              </NavLink>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors min-h-[42px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-admin px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
