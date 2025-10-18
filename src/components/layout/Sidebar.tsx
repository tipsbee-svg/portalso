import React, { useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, BookA, Shield, History, Ship, Contact } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isSuperAdmin } = useAuth();
  
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <li>
        <NavLink
            to={to}
            className={({ isActive }) =>
            `block transition duration-150 truncate ${
                isActive
                ? 'text-navy-500 bg-navy-100 dark:bg-navy-950 dark:text-white'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
            }`
            }
            onClick={() => setSidebarOpen(false)}
        >
            <div className="flex items-center p-3 rounded-lg">
                <Icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{label}</span>
            </div>
        </NavLink>
    </li>
  );

  return (
    <div className="lg:w-64">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen overflow-y-auto w-64 lg:w-64 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-white dark:bg-navy-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2">
            <Ship className="w-8 h-8 text-navy-500" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">S.O.P.</h1>
          </NavLink>
        </div>

        {/* Links */}
        <div className="space-y-8">
            <div>
                <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">Portal</h3>
                <ul className="mt-3 space-y-1">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/directory" icon={Users} label="Directory" />
                    <NavItem to="/authority" icon={Contact} label="Admin Authority" />
                    <NavItem to="/chat" icon={MessageSquare} label="Chat" />
                </ul>
            </div>
            {isSuperAdmin && (
                <div>
                    <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">Administration</h3>
                    <ul className="mt-3 space-y-1">
                        <NavItem to="/admin" icon={Shield} label="User Approval" />
                        <NavItem to="/abbreviations" icon={BookA} label="Abbreviations" />
                        <NavItem to="/logs" icon={History} label="System Logs" />
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;