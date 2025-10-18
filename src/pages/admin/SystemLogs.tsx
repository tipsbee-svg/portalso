
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

type SystemLog = {
    id: string;
    action: string;
    details: any;
    created_at: string;
    profiles: {
        full_name: string;
    } | null;
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Failed to fetch system logs: ' + error.message);
    } else {
      setLogs(data as SystemLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [isSuperAdmin, fetchLogs]);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">System Logs</h1>
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No system logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-slate-200 dark:border-navy-700 text-sm text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Details</th>
                        <th className="p-3">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-200 dark:border-navy-700">
                            <td className="p-3">{log.profiles?.full_name || 'System'}</td>
                            <td className="p-3 font-mono text-xs bg-slate-100 dark:bg-navy-900 rounded-md">{log.action}</td>
                            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                                {log.action === 'user_approved' && `Approved user ID: ${log.details?.approved_user_id.substring(0,8)}...`}
                            </td>
                            <td className="p-3 text-sm text-slate-500 dark:text-slate-400">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SystemLogs;
