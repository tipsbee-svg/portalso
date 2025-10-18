
import React from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Hourglass, LogOut } from 'lucide-react';

const PendingApproval: React.FC = () => {

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-navy-900 px-4">
      <Card className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Hourglass className="w-12 h-12 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Approval Pending
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your account has been created successfully. A super administrator needs to approve your account before you can proceed. Please check back later.
        </p>
        <Button onClick={handleLogout} variant="secondary" icon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default PendingApproval;
