import { useEffect, useState } from 'react';
import api from '../api';

const TYPE_LABELS = {
  STOCK_IN: { label: 'Stock In', cls: 'bg-green-100 text-green-700' },
  CONSUMPTION: { label: 'Used', cls: 'bg-orange-100 text-orange-700' },
  BORROW: { label: 'Lent', cls: 'bg-blue-100 text-blue-700' },
  RETURN: { label: 'Returned', cls: 'bg-gray-100 text-gray-600' },
};

export default function ActivityLog() {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const [filterType, setFilterType] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, filterDate, search]);

  async function fetchTransactions() {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (e) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...transactions];
    if (filterType !== 'ALL') result = result.filter(tx => tx.type === filterType);
    if (filterDate) result = result.filter(tx => tx.date === filterDate);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(tx =>
        tx.item.name.toLowerCase().includes(q) ||
        (tx.borrower && tx.borrower.toLowerCase().includes(q)) ||
        (tx.supplier && tx.supplier.toLowerCase().includes(q)) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.loggedBy && tx.loggedBy.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }

  function clearFilters() {
    setFilterType('ALL');
    setFilterDate('');
    setSearch('');
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError('Failed to delete transaction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity Log</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Item, borrower, supplier..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="CONSUMPTION">Used</option>
              <option value="BORROW">Lent</option>
              <option value="RETURN">Returned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(filterType !== 'ALL' || filterDate || search) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 border border-gray-300 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {transactions.length} transactions
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No transactions match your filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Logged By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(tx => {
                const { label, cls } = TYPE_LABELS[tx.type] || { label: tx.type, cls: 'bg-gray-100 text-gray-600' };
                const isConfirming = confirmId === tx.id;
                const isDeleting = deletingId === tx.id;

                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{tx.item.name}</p>
                      <p className="text-xs text-gray-400">{tx.item.category.name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{tx.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tx.supplier && <p>Supplier: {tx.supplier}</p>}
                      {tx.borrower && <p>Borrower: {tx.borrower}</p>}
                      {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{tx.loggedBy || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.date}</td>
                    <td className="px-4 py-3">
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Sure?</span>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={isDeleting}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded disabled:opacity-50"
                          >
                            {isDeleting ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(tx.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}