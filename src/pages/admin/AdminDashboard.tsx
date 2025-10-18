import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/app.types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';

const AdminDashboard: React.FC = () => {
  const [unapprovedProfiles, setUnapprovedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isSuperAdmin, profile: adminProfile } = useAuth();

  const fetchUnapprovedProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to fetch profiles: ' + error.message);
    } else {
      setUnapprovedProfiles(data);
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUnapprovedProfiles();
    }
  }, [isSuperAdmin, fetchUnapprovedProfiles]);

  const handleApprove = async (profileId: string) => {
    if (!adminProfile) return;
    setApprovingId(profileId);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', profileId);

    if (updateError) {
      toast.error('Failed to approve user: ' + updateError.message);
      setApprovingId(null);
      return;
    }

    const { error: logError } = await supabase
        .from('system_logs')
        .insert({
            actor_id: adminProfile.id,
            action: 'user_approved',
            details: { approved_user_id: profileId }
        });

    if (logError) {
        toast.error('User approved, but failed to create log: ' + logError.message);
    }

    toast.success('User approved successfully!');
    setApprovingId(null);
    fetchUnapprovedProfiles(); // Refresh the list
  };

  const handleDelete = async (profileId: string) => {
    if (!adminProfile) return;
    if (!window.confirm('Are you sure you want to delete this user registration? This only removes the profile data. Deleting the authentication user requires a server-side operation.')) {
        return;
    }
    setDeletingId(profileId);

    // This only deletes the user's profile data due to client-side RLS constraints.
    // A complete deletion requires a call to `supabase.auth.admin.deleteUser(userId)`
    // from a secure environment like a Supabase Edge Function, which is beyond the scope of this client-side implementation.
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (deleteProfileError) {
      toast.error('Failed to delete user profile: ' + deleteProfileError.message + '. You may need to add a DELETE policy in Supabase for super admins.');
      setDeletingId(null);
      return;
    }
    
    // Log the action
    const { error: logError } = await supabase
        .from('system_logs')
        .insert({
            actor_id: adminProfile.id,
            action: 'user_registration_deleted',
            details: { deleted_user_id: profileId }
        });

    if (logError) {
        toast.error('Profile deleted, but failed to create log: ' + logError.message);
    }

    toast.success('User registration deleted successfully!');
    setDeletingId(null);
    fetchUnapprovedProfiles(); // Refresh the list
  };


  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Admin Dashboard: User Approval</h1>
      <Card>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        {loading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : unapprovedProfiles.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No users are currently awaiting approval.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-navy-700">
            {unapprovedProfiles.map((profile) => (
              <li key={profile.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0 flex-1">
                  <Avatar src={profile.avatar_url} name={profile.full_name} />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{profile.full_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                     <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Role: <span className="font-medium">{profile.role}</span> | Signed up: <span className="font-medium">{format(new Date(profile.created_at!), 'PP')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 self-end sm:self-center">
                    <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleDelete(profile.id)}
                        isLoading={deletingId === profile.id}
                    >
                        Delete
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={() => handleApprove(profile.id)}
                        isLoading={approvingId === profile.id}
                    >
                        Approve
                    </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;