import { FC } from "react";
import {
  Activity,
  User,
  Stethoscope,
  Zap,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// -------------------------
// UI Components
// -------------------------

export const AIAvatar: FC = () => (
  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-linear-to-br from-cyan-600 to-blue-700 text-white shadow-lg border border-slate-800 z-10">
    <Stethoscope size={20} />
  </div>
);

export const UserAvatar: FC = () => (
  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-200 z-10">
    <User size={18} />
  </div>
);

export const WaveLoader: FC = () => (
  <div className="animate-in fade-in flex items-end gap-1.5 duration-300 py-2">
    {[0, 150, 300].map((delay) => (
      <div
        key={delay}
        className="h-1.5 w-1.5 rounded-full bg-cyan-500"
        style={{
          animation: "wave-dot 1.2s ease-in-out infinite",
          animationDelay: `${delay}ms`,
        }}
      />
    ))}
  </div>
);

export const Logo: FC = () => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center justify-center w-9 h-9 bg-linear-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
      <Activity className="text-white" size={20} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <span className="text-lg font-bold text-white leading-tight">
        Med<span className="text-cyan-400">Synth</span>
      </span>
      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
        Clinical RAG
      </span>
    </div>
  </div>
);

interface HeaderProps {
  onClearClick: () => void;
}

export const Header: FC<HeaderProps> = ({ onClearClick }) => (
  <header className="shrink-0 h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-20">
    <Logo />
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-medium">
        <Zap size={12} fill="currentColor" />
        <span>System Active</span>
      </div>
      <button
        onClick={onClearClick}
        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        title="Clear History"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </header>
);

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Clear Conversation?</h3>
          <p className="text-slate-400 text-sm">
            This will permanently delete your current session history. This
            action cannot be undone.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
