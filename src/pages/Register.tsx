
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Ship } from 'lucide-react';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Supabase handles profile creation via a trigger on auth.users table.
    // We pass metadata which the trigger can use.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      toast.success('Registration successful! Your account is pending admin approval.');
      navigate('/pending-approval');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-navy-900 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
            <Ship className="w-12 h-12 text-navy-500" />
        </div>
        <Card>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
            Create a new account
          </h2>
          <form onSubmit={handleRegister} className="space-y-6">
            <Input
              id="full-name"
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-navy-600 hover:text-navy-500 dark:text-navy-400 dark:hover:text-navy-300">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Register;
