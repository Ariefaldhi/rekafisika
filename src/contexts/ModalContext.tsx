import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { SFX } from '../utils/sound-effects';

type ModalType = 'alert' | 'confirm' | 'success' | 'error';

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showAlert: (options: ModalOptions) => Promise<void>;
  showConfirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalOptions & { resolve?: (value: any) => void }>({
    title: '', message: '', type: 'alert'
  });

  const showAlert = (options: ModalOptions): Promise<void> => {
    if (options.type === 'success') SFX.play('success');
    else if (options.type === 'error') SFX.play('error');
    else SFX.play('click');
    
    return new Promise((resolve) => {
      setConfig({ ...options, type: options.type || 'alert', resolve });
      setIsOpen(true);
    });
  };

  const showConfirm = (options: ModalOptions): Promise<boolean> => {
    SFX.play('click');
    return new Promise((resolve) => {
      setConfig({ ...options, type: 'confirm', resolve });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (config.type === 'success') SFX.play('success');
    else SFX.play('click');
    if (config.resolve) config.resolve(config.type === 'confirm' ? true : undefined);
  };

  const handleCancel = () => {
    setIsOpen(false);
    SFX.play('click');
    if (config.resolve && config.type === 'confirm') config.resolve(false);
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center ${
                  config.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                  config.type === 'error' ? 'bg-rose-50 text-rose-500' :
                  config.type === 'confirm' ? 'bg-blue-50 text-blue-500' :
                  'bg-orange-50 text-orange-500'
                }`}>
                  {config.type === 'success' ? <CheckCircle2 size={40} /> :
                   config.type === 'error' ? <X size={40} /> :
                   config.type === 'confirm' ? <AlertCircle size={40} /> :
                   <Info size={40} />}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{config.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{config.message}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  {config.type === 'confirm' && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      {config.cancelText || 'Batal'}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-xl transition-transform active:scale-95 ${
                      config.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' :
                      config.type === 'error' ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' :
                      'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
                    }`}
                  >
                    {config.confirmText || 'Oke, Mengerti'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
