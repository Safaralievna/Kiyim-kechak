import React from 'react';
import { ArchiveX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Ma\'lumot topilmadi',
  description = 'Ushbu sahifada hozircha hech qanday ma\'lumot mavjud emas.',
  action,
}) => {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[--primary]/10 text-[--primary] shadow-sm">
        <ArchiveX size={36} />
      </div>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[--muted] max-w-md">{description}</p>
      </div>
      {action}
    </div>
  );
};
