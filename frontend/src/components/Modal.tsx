import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-2xl overflow-hidden rounded-[--radius] border border-[--border] bg-[--surface] shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-[--border]">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full">
                  <X size={18} />
                </Button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-[--border] bg-[--muted]/10 p-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
