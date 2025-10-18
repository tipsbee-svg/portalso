
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Frown } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-navy-900 px-4">
      <Card className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Frown className="w-12 h-12 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          404
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
          Page Not Found
        </p>
        <p className="text-slate-500 dark:text-slate-500 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary">
            Go to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
