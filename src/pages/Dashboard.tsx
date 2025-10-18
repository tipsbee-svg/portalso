
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Dashboard</h1>
      <Card>
        <h2 className="text-xl font-semibold">Welcome, {profile?.full_name}!</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Welcome to the Staff Officer Portal. Use the navigation to access the directory, chat, and other tools.
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
