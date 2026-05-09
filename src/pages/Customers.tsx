import { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase, type Customer } from '../lib/supabase';
import Badge from '../components/Badge';

const PAGE_SIZE = 15;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'churn' | 'retain'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from('customers').select('*', { count: 'exact' });
      if (filter === 'churn') query = query.eq('churn', true);
      if (filter === 'retain') query = query.eq('churn', false);
      if (search) query = query.ilike('customer_id', `%${search}%`);
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('created_at', { ascending: false });
      const { data, count } = await query;
      setCustomers((data as Customer[]) ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    }
    load();
  }, [page, search, filter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Customer Data</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} customers in database</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by Customer ID..."
            className="input-field pl-8 w-full"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          <Filter size={12} className="text-gray-500 mx-2" />
          {(['all', 'churn', 'retain'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              {f === 'all' ? 'All' : f === 'churn' ? 'Churned' : 'Retained'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Profile</th>
                <th className="text-left px-4 py-3 font-medium">Contract</th>
                <th className="text-left px-4 py-3 font-medium">Monthly</th>
                <th className="text-left px-4 py-3 font-medium">Tenure</th>
                <th className="text-left px-4 py-3 font-medium">Satisfaction</th>
                <th className="text-left px-4 py-3 font-medium">Support Calls</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{c.customer_id}</p>
                          <p className="text-xs text-gray-500">{c.internet_service}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{c.age}y · {c.gender}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={c.contract_type}
                          variant={c.contract_type === 'Two year' ? 'success' : c.contract_type === 'One year' ? 'info' : 'warning'}
                        />
                      </td>
                      <td className="px-4 py-3 text-white font-medium">${c.monthly_charges.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-400">
                          {c.tenure_months >= 24 ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
                          {c.tenure_months}mo
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.satisfaction_score !== null ? (
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${i < (c.satisfaction_score ?? 0) ? 'bg-amber-400' : 'bg-gray-700'}`} />
                            ))}
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${c.support_calls > 5 ? 'text-red-400' : c.support_calls > 2 ? 'text-amber-400' : 'text-gray-400'}`}>
                          {c.support_calls}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={c.churn ? 'Churned' : 'Active'} variant={c.churn ? 'danger' : 'success'} />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-400">{page + 1} / {totalPages || 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
