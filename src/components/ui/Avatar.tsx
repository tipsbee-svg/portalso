
import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const finalSrc = src || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${encodeURIComponent(name || 'default')}`;

  return (
    <img
      className={`${sizeClasses[size]} rounded-full object-cover`}
      src={finalSrc}
      alt={name || 'User Avatar'}
    />
  );
};

export default Avatar;
