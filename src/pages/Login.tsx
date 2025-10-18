
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Ship } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      // App.tsx will handle fetching profile and redirecting
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-navy-900 px-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
            <Ship className="w-12 h-12 text-navy-500" />
        </div>
        <Card>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
            Sign in to your account
          </h2>
          <form onSubmit={handleLogin} className="space-y-6">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Not a member?{' '}
            <Link to="/register" className="font-medium text-navy-600 hover:text-navy-500 dark:text-navy-400 dark:hover:text-navy-300">
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
