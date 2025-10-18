import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types/app.types';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { Search, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const Directory: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const uniqueBranches = useMemo(() => {
    const branches = profiles.map(p => p.branch).filter((b): b is string => !!b);
    return [...new Set(branches)].sort();
  }, [profiles]);

  const uniqueRanks = useMemo(() => {
    const ranks = profiles.map(p => p.rank).filter((r): r is string => !!r);
    return [...new Set(ranks)].sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
        const nameMatch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const branchMatch = branchFilter ? p.branch === branchFilter : true;
        const rankMatch = rankFilter ? p.rank === rankFilter : true;
        return nameMatch && branchMatch && rankMatch;
    });
  }, [profiles, searchTerm, branchFilter, rankFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setBranchFilter('');
    setRankFilter('');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Personnel Directory</h1>
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input 
              placeholder="Search by name..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm dark:bg-navy-700 dark:border-navy-600 dark:text-white"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm dark:bg-navy-700 dark:border-navy-600 dark:text-white"
          >
            <option value="">All Ranks</option>
            {uniqueRanks.map(rank => <option key={rank} value={rank}>{rank}</option>)}
          </select>
        </div>
        {(searchTerm || branchFilter || rankFilter) && (
            <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={handleResetFilters} icon={<XCircle className="w-4 h-4" />}>
                    Clear Filters
                </Button>
            </div>
        )}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{profile.full_name}</h2>
            <p className="text-sm text-navy-500 dark:text-navy-400">{profile.rank || 'N/A'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.branch || 'N/A'}</p>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-700">
              <p className="text-sm text-slate-600 dark:text-slate-300">{profile.email}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{profile.phone || 'No phone'}</p>
            </div>
          </Card>
        ))}
      </div>
       {filteredProfiles.length === 0 && !loading && (
         <Card className="text-center py-12">
            <h3 className="text-lg font-semibold">No Profiles Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">No personnel match the current filter criteria.</p>
         </Card>
       )}
    </div>
  );
};

export default Directory;