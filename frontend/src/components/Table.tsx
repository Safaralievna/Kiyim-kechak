import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto rounded-[--radius] border border-[--border] bg-[--surface] shadow-sm ${className}`}>
    {children}
  </div>
);

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <table className={`min-w-full divide-y divide-[--border] ${className}`}>{children}</table>
);

export const TableHead: React.FC<TableProps> = ({ children, className = '' }) => (
  <thead className={`bg-[--background] ${className}`}>{children}</thead>
);

export const TableBody: React.FC<TableProps> = ({ children, className = '' }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<TableProps> = ({ children, className = '' }) => (
  <tr className={`transition-colors hover:bg-[--muted]/40 ${className}`}>{children}</tr>
);

export const TableHeaderCell: React.FC<TableProps> = ({ children, className = '' }) => (
  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[--muted] ${className}`}>
    {children}
  </th>
);

export const TableCell: React.FC<TableProps> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 text-sm text-[--text] ${className}`}>{children}</td>
);
