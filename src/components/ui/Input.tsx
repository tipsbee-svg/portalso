
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, ...props }, ref) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm dark:bg-navy-700 dark:border-navy-600 dark:text-white dark:placeholder-slate-500"
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
