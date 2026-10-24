import React from 'react';
import { createPageUrl } from '@/utils';
import { Link, useLocation } from 'react-router-dom';
import { 
  Recycle, LayoutDashboard, Package, Menu, X, 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';

const navigation = [
  { nameKey: 'dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { nameKey: 'materials', page: 'Materials', icon: Package },
];
interface LayoutContentProps {
  children: React.ReactNode;
}
  interface LayoutProps {
  children: React.ReactNode;
}
function LayoutContent({ children }: LayoutContentProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-slate-900 pt-6 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 mb-8">
            <div className="p-2 bg-amber-500 rounded-xl">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">{t('appName')}</h5>
              <p className="text-xs text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
                // derive current page from the URL path (e.g. /pages/Materials -> 'Materials')
                const currentPageName = location.pathname.replace(/^\/pages\//, '') || 'Dashboard';
                const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.nameKey}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {t(item.nameKey)}
                </Link>
              );
            })}
          </nav>

          {/* Language & Logout */}
          <div className="px-3 mt-auto space-y-1">
            <LanguageSwitcher variant="sidebar" />
            {/* <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button> */}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500 rounded-lg">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">ReclaimHub</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-slate-900/95 pt-16">
            <nav className="px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const currentPageName = location.pathname.replace(/^\/pages\//, '') || 'Dashboard';
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.nameKey}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              <LanguageSwitcher variant="sidebar" />
              {/* <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-base font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
                {t('logout')}
              </button> */}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <LanguageProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </LanguageProvider>
  );
}