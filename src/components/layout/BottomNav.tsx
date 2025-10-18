import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Shield, Contact } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const BottomNav: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full text-xs pt-2 pb-1 ${
          isActive ? 'text-navy-500 dark:text-navy-400' : 'text-slate-500 dark:text-slate-400'
        }`
      }
    >
      <Icon className="w-6 h-6 mb-1" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-around items-center z-20">
      <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/directory" icon={Users} label="Directory" />
      <NavItem to="/authority" icon={Contact} label="Authority" />
      <NavItem to="/chat" icon={MessageSquare} label="Chat" />
      {isSuperAdmin && <NavItem to="/admin" icon={Shield} label="Admin" />}
    </nav>
  );
};

export default BottomNav;