import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import { Tables } from '../../types/database.types';

type Abbreviation = Tables<'abbreviations'>;

const Abbreviations: React.FC = () => {
  const { isSuperAdmin, profile } = useAuth();
  const [abbreviations, setAbbreviations] = useState<Abbreviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentAbbr, setCurrentAbbr] = useState<Abbreviation | null>(null);
  const [deletingAbbr, setDeletingAbbr] = useState<Abbreviation | null>(null);
  const [formState, setFormState] = useState({ abbr: '', expansion: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAbbreviations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('abbreviations')
      .select('*')
      .order('abbr', { ascending: true });

    if (error) {
      toast.error('Failed to fetch abbreviations: ' + error.message);
    } else {
      setAbbreviations(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAbbreviations();
    }
  }, [isSuperAdmin, fetchAbbreviations]);

  const filteredAbbreviations = useMemo(() => {
    if (!searchTerm) return abbreviations;
    return abbreviations.filter(a =>
      a.abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.expansion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [abbreviations, searchTerm]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const openModalForNew = () => {
    setCurrentAbbr(null);
    setFormState({ abbr: '', expansion: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (abbr: Abbreviation) => {
    setCurrentAbbr(abbr);
    setFormState({ abbr: abbr.abbr, expansion: abbr.expansion });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAbbr(null);
  };
  
  const openDeleteModal = (abbr: Abbreviation) => {
    setDeletingAbbr(abbr);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAbbr(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);

    if (currentAbbr) { // Update
      const { error } = await supabase
        .from('abbreviations')
        .update({ abbr: formState.abbr, expansion: formState.expansion })
        .eq('id', currentAbbr.id);
        
      if (error) {
        toast.error('Failed to update: ' + error.message);
      } else {
        toast.success('Abbreviation updated successfully!');
        closeModal();
        fetchAbbreviations();
      }
    } else { // Create
      const { error } = await supabase
        .from('abbreviations')
        .insert({
          abbr: formState.abbr,
          expansion: formState.expansion,
          created_by: profile.id,
        });

      if (error) {
        toast.error('Failed to create: ' + error.message);
      } else {
        toast.success('Abbreviation added successfully!');
        closeModal();
        fetchAbbreviations();
      }
    }
    setIsSaving(false);
  };

  const confirmDelete = async () => {
    if (!deletingAbbr) return;
    setIsDeleting(true);

    const { error } = await supabase.from('abbreviations').delete().eq('id', deletingAbbr.id);
    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      toast.success('Abbreviation deleted.');
      fetchAbbreviations();
    }
    
    setIsDeleting(false);
    closeDeleteModal();
  };

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderEditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">{currentAbbr ? 'Edit' : 'Add'} Abbreviation</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Abbreviation"
            name="abbr"
            value={formState.abbr}
            onChange={handleInputChange}
            required
            placeholder="e.g., SOP"
          />
          <Input
            label="Expansion"
            name="expansion"
            value={formState.expansion}
            onChange={handleInputChange}
            required
            placeholder="e.g., Standard Operating Procedure"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
  
  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <Card className="w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete the abbreviation <strong className="text-red-500">{deletingAbbr?.abbr}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
                <Button type="button" variant="danger" isLoading={isDeleting} onClick={confirmDelete}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </Card>
    </div>
  );

  return (
    <>
      {isModalOpen && renderEditModal()}
      {isDeleteModalOpen && renderDeleteModal()}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Abbreviations Management</h1>
          <Button onClick={openModalForNew} icon={<PlusCircle className="w-4 h-4" />}>
            Add New
          </Button>
        </div>

        <Card className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                    placeholder="Search abbreviations or expansions..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : abbreviations.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No abbreviations have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
               {filteredAbbreviations.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 dark:border-navy-700 text-sm text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="p-3">Abbreviation</th>
                        <th className="p-3">Expansion</th>
                        <th className="p-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAbbreviations.map((abbr) => (
                        <tr key={abbr.id} className="border-b border-slate-200 dark:border-navy-700">
                        <td className="p-3 font-semibold text-navy-600 dark:text-navy-400">{abbr.abbr}</td>
                        <td className="p-3">{abbr.expansion}</td>
                        <td className="p-3">
                            <div className="flex justify-end space-x-2">
                                <Button size="sm" variant="secondary" onClick={() => openModalForEdit(abbr)} icon={<Edit className="w-4 h-4" />} aria-label="Edit" />
                                <Button size="sm" variant="danger" onClick={() => openDeleteModal(abbr)} icon={<Trash2 className="w-4 h-4" />} aria-label="Delete" />
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                 ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">No abbreviations found matching your search.</p>
                )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default Abbreviations;