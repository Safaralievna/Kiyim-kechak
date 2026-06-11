import React from 'react';

interface SkeletonProps {
  className?: string;
  type?: 'card' | 'table' | 'line' | 'avatar' | 'rectangle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', type = 'line' }) => {
  const baseStyles = 'bg-[--muted]/30 animate-pulse rounded-[--radius]';

  if (type === 'card') {
    return (
      <div className={`glass-card p-6 flex flex-col gap-4 ${className}`}>
        <div className={`${baseStyles} h-6 w-1/3`} />
        <div className={`${baseStyles} h-10 w-2/3`} />
        <div className={`${baseStyles} h-4 w-1/2`} />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div className={`${baseStyles} h-10 w-full`} />
        <div className={`${baseStyles} h-8 w-full`} />
        <div className={`${baseStyles} h-8 w-full`} />
        <div className={`${baseStyles} h-8 w-full`} />
      </div>
    );
  }

  if (type === 'avatar') {
    return <div className={`${baseStyles} h-10 w-10 rounded-full ${className}`} />;
  }

  if (type === 'rectangle') {
    return <div className={`${baseStyles} ${className}`} />;
  }

  return <div className={`${baseStyles} h-6 w-full ${className}`} />;
};
