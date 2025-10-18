import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { PlusCircle, Edit, Trash2, Search, UserCheck, Clock, Check, Shield, Link2, X } from 'lucide-react';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { Profile } from '../types/app.types';
import { Tables } from '../types/database.types';

type AuthorityContact = Tables<'authority_contacts'> & {
    updated_by_profile: { full_name: string } | null;
};

// FIX: Define a more specific type for the profiles used in the dropdown,
// as only 'id' and 'full_name' are fetched from the database.
type SimpleProfile = Pick<Profile, 'id' | 'full_name'>;

const AdminAuthority: React.FC = () => {
    const { profile, isSuperAdmin } = useAuth();
    const [contacts, setContacts] = useState<AuthorityContact[]>([]);
    // FIX: Use the SimpleProfile type for the state to match the fetched data.
    const [profiles, setProfiles] = useState<SimpleProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ withSecretary: boolean, withoutSecretary: boolean, linkedAccount: boolean }>({
        withSecretary: false,
        withoutSecretary: false,
        linkedAccount: false,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<AuthorityContact | null>(null);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('authority_contacts')
            .select(`*, updated_by_profile:updated_by(full_name)`)
            .order('full_name', { ascending: true });

        if (error) {
            toast.error('Failed to fetch contacts: ' + error.message);
        } else {
            // FIX: The Supabase client has difficulty inferring the type for aliased joins.
            // Casting to `any` bypasses the type mismatch error.
            setContacts(data as any);
        }
        setLoading(false);
    }, []);
    
    const fetchProfiles = useCallback(async () => {
        const { data, error } = await supabase.from('profiles').select('id, full_name').eq('approved', true);
        if (error) {
            toast.error("Could not fetch user profiles for linking.");
        } else {
            setProfiles(data);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchProfiles();
    }, [fetchContacts, fetchProfiles]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            const searchMatch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.branch || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!searchMatch) return false;

            if (filters.withSecretary && !c.secretary_name) return false;
            if (filters.withoutSecretary && c.secretary_name) return false;
            if (filters.linkedAccount && !c.linked_profile_id) return false;
            
            return true;
        });
    }, [contacts, searchTerm, filters]);
    
    const handleApprove = async (contactId: string) => {
        if (!profile) return;
        const { error } = await supabase
            .from('authority_contacts')
            .update({ status: 'approved', updated_by: profile.id, updated_at: new Date().toISOString() })
            .eq('id', contactId);
        
        if (error) {
            toast.error("Approval failed: " + error.message);
        } else {
            toast.success("Contact approved!");
            fetchContacts();
        }
    };

    const handleDelete = async (contactId: string) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;
        const { error } = await supabase.from('authority_contacts').delete().eq('id', contactId);
        if (error) {
            toast.error("Delete failed: " + error.message);
        } else {
            toast.success("Contact deleted.");
            fetchContacts();
        }
    };

    const openModal = (contact: AuthorityContact | null) => {
        setCurrentContact(contact);
        setIsModalOpen(true);
    };

    const FilterChip: React.FC<{ label: string; filterKey: keyof typeof filters }> = ({ label, filterKey }) => {
        const isActive = filters[filterKey];
        return (
            <button
                onClick={() => setFilters(f => ({...f, [filterKey]: !f[filterKey]}))}
                className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${
                    isActive
                        ? 'bg-navy-600 text-white border-navy-600'
                        : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-navy-600 hover:bg-slate-100 dark:hover:bg-navy-700'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div>
            {isModalOpen && <EntryModal contact={currentContact} profiles={profiles}
                onClose={() => setIsModalOpen(false)} onSave={fetchContacts} />}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Authority Directory</h1>
                <Button onClick={() => openModal(null)} icon={<PlusCircle className="w-4 h-4" />}>
                    Submit Entry
                </Button>
            </div>
            
            <Card className="mb-6">
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                            placeholder="Search by name, branch, or designation..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold mr-2">Filter by:</span>
                        <FilterChip label="With Secretary" filterKey="withSecretary" />
                        <FilterChip label="Without Secretary" filterKey="withoutSecretary" />
                        <FilterChip label="Linked Account" filterKey="linkedAccount" />
                    </div>
                </div>
            </Card>

            {loading ? <div className="flex justify-center p-8"><Spinner size="lg" /></div>
            : filteredContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredContacts.map(contact => (
                        <ContactCard key={contact.id} contact={contact} isSuperAdmin={isSuperAdmin}
                            onApprove={handleApprove} onEdit={openModal} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <h3 className="text-lg font-semibold">No Contacts Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">No entries match the current filter criteria.</p>
                </Card>
            )}
        </div>
    );
};

const ContactCard: React.FC<{
    contact: AuthorityContact, isSuperAdmin: boolean,
    onApprove: (id: string) => void, onEdit: (contact: AuthorityContact) => void, onDelete: (id: string) => void
}> = ({ contact, isSuperAdmin, onApprove, onEdit, onDelete }) => (
    <Card className={`flex flex-col transition-all duration-300 ${contact.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400' : ''}`}>
        {contact.status === 'pending' && <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center mb-3"><Clock className="w-4 h-4 mr-2" /> PENDING APPROVAL</div>}
        
        <div className="flex items-start space-x-4 mb-4">
            <Avatar src={contact.avatar_url} name={contact.full_name} size="lg" />
            <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{contact.full_name}</h2>
                <p className="font-semibold text-navy-500 dark:text-navy-400">{contact.designation}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{contact.rank} - {contact.branch}</p>
            </div>
        </div>
        
        <div className="space-y-2 text-sm flex-1">
            <p><strong className="w-24 inline-block">Email:</strong> <a href={`mailto:${contact.email}`} className="text-blue-500 hover:underline">{contact.email}</a></p>
            <p><strong className="w-24 inline-block">Phone:</strong> {contact.primary_phone}</p>
            {contact.alternate_phone && <p><strong className="w-24 inline-block">Alt. Phone:</strong> {contact.alternate_phone}</p>}
            {contact.linked_profile_id && <p className="flex items-center text-green-600 dark:text-green-400"><Link2 className="w-4 h-4 mr-2" /> Linked to active user profile.</p>}
        </div>

        {contact.secretary_name && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-700">
                <h4 className="font-semibold mb-2">Secretary Details</h4>
                <div className="flex items-center space-x-3 text-sm">
                    <Avatar src={contact.secretary_avatar_url} name={contact.secretary_name} size="md" />
                    <div>
                        <p className="font-bold">{contact.secretary_name}</p>
                        <p>{contact.secretary_phone}</p>
                        {contact.secretary_linked_profile_id && <p className="flex items-center text-green-600 dark:text-green-400 text-xs mt-1"><Link2 className="w-3 h-3 mr-1" /> Linked Profile</p>}
                    </div>
                </div>
            </div>
        )}

        <div className="text-xs text-slate-400 dark:text-slate-500 mt-4 pt-2 border-t border-slate-200 dark:border-navy-700">
            Last updated {formatDistanceToNow(new Date(contact.updated_at), { addSuffix: true })}
            {contact.updated_by_profile && ` by ${contact.updated_by_profile.full_name}`}
        </div>
        
        {isSuperAdmin && (
            <div className="flex justify-end space-x-2 mt-4">
                {contact.status === 'pending' && <Button size="sm" variant="secondary" onClick={() => onApprove(contact.id)} icon={<UserCheck className="w-4 h-4"/>}>Approve</Button>}
                <Button size="sm" variant="secondary" onClick={() => onEdit(contact)} icon={<Edit className="w-4 h-4" />} aria-label="Edit" />
                <Button size="sm" variant="danger" onClick={() => onDelete(contact.id)} icon={<Trash2 className="w-4 h-4" />} aria-label="Delete" />
            </div>
        )}
    </Card>
);

// FIX: Use the SimpleProfile type for the profiles prop.
const EntryModal: React.FC<{ contact: AuthorityContact | null; profiles: SimpleProfile[]; onClose: () => void; onSave: () => void; }> = ({ contact, profiles, onClose, onSave }) => {
    const { profile, isSuperAdmin } = useAuth();
    const [formData, setFormData] = useState({
        full_name: contact?.full_name || '',
        designation: contact?.designation || '',
        rank: contact?.rank || '',
        branch: contact?.branch || '',
        primary_phone: contact?.primary_phone || '',
        alternate_phone: contact?.alternate_phone || '',
        email: contact?.email || '',
        avatar_url: contact?.avatar_url || '',
        linked_profile_id: contact?.linked_profile_id || '',
        secretary_name: contact?.secretary_name || '',
        secretary_phone: contact?.secretary_phone || '',
        secretary_avatar_url: contact?.secretary_avatar_url || '',
        secretary_linked_profile_id: contact?.secretary_linked_profile_id || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === 'null' ? null : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSaving(true);
        
        const payload = {
            ...formData,
            linked_profile_id: formData.linked_profile_id || null,
            secretary_linked_profile_id: formData.secretary_linked_profile_id || null,
            updated_by: profile.id,
            updated_at: new Date().toISOString()
        };

        let error;
        if (contact) { // Update
            const { error: updateError } = await supabase.from('authority_contacts').update(payload).eq('id', contact.id);
            error = updateError;
        } else { // Insert
            const { error: insertError } = await supabase.from('authority_contacts').insert({
                ...payload,
                created_by: profile.id,
                status: isSuperAdmin ? 'approved' : 'pending'
            });
            error = insertError;
        }

        if (error) {
            toast.error("Save failed: " + error.message);
        } else {
            toast.success(`Contact ${contact ? 'updated' : 'submitted'} successfully!`);
            onSave();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                    <X />
                </button>
                <h2 className="text-2xl font-bold mb-6">{contact ? 'Edit' : 'Submit'} Authority Contact</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Officer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
                        <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} />
                        <Input label="Rank" name="rank" value={formData.rank} onChange={handleChange} />
                        <Input label="Branch" name="branch" value={formData.branch} onChange={handleChange} />
                        <Input label="Primary Phone" name="primary_phone" value={formData.primary_phone} onChange={handleChange} />
                        <Input label="Alternate Phone" name="alternate_phone" value={formData.alternate_phone} onChange={handleChange} />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required className="md:col-span-2"/>
                        <Input label="Avatar URL" name="avatar_url" value={formData.avatar_url} onChange={handleChange} className="md:col-span-2" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link to User Profile</label>
                            <select name="linked_profile_id" value={formData.linked_profile_id || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm dark:bg-navy-700 dark:border-navy-600 dark:text-white">
                                <option value="">None</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg border-b pb-2 pt-4">Secretary Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Secretary Name" name="secretary_name" value={formData.secretary_name} onChange={handleChange} />
                        <Input label="Secretary Phone" name="secretary_phone" value={formData.secretary_phone} onChange={handleChange} />
                        <Input label="Secretary Avatar URL" name="secretary_avatar_url" value={formData.secretary_avatar_url} onChange={handleChange} className="md:col-span-2"/>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link to Secretary Profile</label>
                            <select name="secretary_linked_profile_id" value={formData.secretary_linked_profile_id || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm dark:bg-navy-700 dark:border-navy-600 dark:text-white">
                                <option value="">None</option>
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AdminAuthority;