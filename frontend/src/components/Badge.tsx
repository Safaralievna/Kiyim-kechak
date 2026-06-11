import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'muted' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    primary: 'badge badge-primary',
    secondary: 'badge badge-secondary',
    success: 'badge badge-success',
    danger: 'badge badge-danger',
    warning: 'badge badge-warning',
    muted: 'badge badge-muted',
    outline: 'badge badge-outline',
  };

  return <span className={`${variants[variant]} ${className}`}>{children}</span>;
};
