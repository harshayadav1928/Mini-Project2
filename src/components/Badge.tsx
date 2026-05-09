type Props = { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'running' };

const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  neutral: 'bg-gray-700/50 text-gray-400 border-gray-700',
  running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function Badge({ label, variant }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {variant === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
      {label}
    </span>
  );
}
