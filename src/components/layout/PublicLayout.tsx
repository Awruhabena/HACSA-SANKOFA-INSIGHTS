import { Outlet } from 'react-router-dom';
import { Heart, Globe2 } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-cream font-body text-ink flex flex-col justify-between">
      <header className="py-4 px-4 border-b border-border/60 bg-white/70 backdrop-blur-xs sticky top-0 z-40">
        <div className="mx-auto max-w-form flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/hacsa-logo.png"
              alt="HACSA Foundation Logo"
              className="h-11 w-11 object-contain shrink-0"
            />
            <div>
              <span className="font-heading font-bold text-navy tracking-tight text-base sm:text-lg block leading-tight">
                HACSA Foundation
              </span>
              <span className="text-[11px] font-medium text-gray block">
                Heritage & Cultural Society of Africa
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream border border-border/80 text-[11px] font-semibold text-navy font-heading">
            <Globe2 className="w-3.5 h-3.5 text-teal" />
            <span>Sankofa Insights</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-form px-4 py-8 sm:py-12 flex-1">
        <Outlet />
      </main>

      <footer className="py-6 px-4 text-center text-xs text-gray border-t border-border/40">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span>Preserving African heritage & connecting diaspora</span>
          <Heart className="w-3 h-3 text-clay fill-clay inline" />
        </div>
        <p>© {new Date().getFullYear()} The HACSA Foundation · Sankofa Insights Portal</p>
      </footer>
    </div>
  );
}
