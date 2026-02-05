import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Papa from 'papaparse';
import { Download, Filter, Loader, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [limit, setLimit] = useState<number>(100);

  const logs = useQuery(
    api.auditLogs.list,
    categoryFilter === 'all'
      ? { limit }
      : { limit, category: categoryFilter }
  );

  const exportLogs = () => {
    if (!logs) return;

    const csv = Papa.unparse(
      logs.map((log) => ({
        timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        category: log.category,
        action: log.action,
        performedBy: log.performedBy,
        details: log.details,
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!logs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'voter', label: 'Voter Actions' },
    { value: 'candidate', label: 'Candidate Actions' },
    { value: 'vote', label: 'Voting Actions' },
    { value: 'system', label: 'System Actions' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'voter':
        return 'bg-blue-100 text-blue-800';
      case 'candidate':
        return 'bg-purple-100 text-purple-800';
      case 'vote':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Audit Logs</h2>
          <p className="text-gray-600">Complete activity history and system logs</p>
        </div>
        <button onClick={exportLogs} className="btn-primary flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Category</span>
            </label>
            <select title="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Display Limit</label>
            <select
              aria-label="Select number of log entries to display"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input"
            >
              <option value={50}>Last 50 entries</option>
              <option value={100}>Last 100 entries</option>
              <option value={500}>Last 500 entries</option>
              <option value={1000}>Last 1000 entries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(1).map((cat) => {
          const count = logs.filter((log) => log.category === cat.value).length;
          return (
            <div key={cat.value} className="stat-card border-primary">
              <p className="text-xs font-medium text-gray-600">{cat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Performed By
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        log.category
                      )}`}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.performedBy}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Showing {logs.length} log entries
        </p>
      )}
    </div>
  );
}