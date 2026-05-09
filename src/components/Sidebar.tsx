import { LayoutDashboard, Brain, Users, FlaskConical, GitBranch, AlertTriangle, ChevronRight } from 'lucide-react';

type Page = 'dashboard' | 'predict' | 'customers' | 'experiments' | 'pipeline' | 'monitoring';

const navItems: { id: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predict', label: 'Predict Churn', icon: Brain },
  { id: 'customers', label: 'Customer Data', icon: Users },
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'monitoring', label: 'Monitoring', icon: AlertTriangle },
];

type Props = { currentPage: Page; onNavigate: (page: Page) => void };

export default function Sidebar({ currentPage, onNavigate }: Props) {
  return (
    <aside className="w-64 shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">MLOpsFlow</h1>
            <p className="text-xs text-gray-500">From Data to Deployment</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Icon size={16} className={active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} className="text-cyan-500" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">Model v3.0.0 <span className="text-emerald-400">Production</span></span>
        </div>
      </div>
    </aside>
  );
}
