import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, setTheme } = useUIStore();
  const { profile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if(error) {
        toast.error("Logout failed: " + error.message);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Header: Left side */}
          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-full"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2"
                >
                    <Avatar src={profile?.avatar_url} name={profile?.full_name} size="md" />
                    <span className="hidden sm:block font-medium text-slate-700 dark:text-slate-200">{profile?.full_name}</span>
                </button>
                {dropdownOpen && (
                    <div className="origin-top-right absolute top-full right-0 min-w-44 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 py-1.5 rounded shadow-lg overflow-hidden mt-1">
                        <ul>
                            <li>
                                <span className="font-medium text-sm text-slate-600 dark:text-slate-300 block py-1.5 px-3">
                                    {profile?.email}
                                </span>
                            </li>
                             <li>
                                <button
                                    onClick={handleLogout}
                                    className="font-medium text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center py-1 px-3 w-full"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span>Sign Out</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;