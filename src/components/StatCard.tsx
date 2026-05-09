import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  iconBg?: string;
};

export default function StatCard({ title, value, subtitle, trend, icon: Icon, iconColor = 'text-cyan-400', iconBg = 'bg-cyan-500/10' }: Props) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        {TrendIcon && trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
}
