import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [itemsRes, txRes, borrowsRes] = await Promise.all([
        api.get('/items'),
        api.get('/transactions'),
        api.get('/transactions/borrows/active'),
      ]);
      setItems(itemsRes.data);
      setTransactions(txRes.data.slice().reverse());
      setActiveBorrows(borrowsRes.data);
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  const lowStockItems = items.filter(i => i.stock <= i.minStock);
  const consumables = items.filter(i => i.category.type === 'CONSUMABLE');
  const engineeringItems = items.filter(i => i.category.type === 'ENGINEERING');

  const typeIcon = (type) => {
    switch (type) {
      case 'STOCK_IN': return { label: 'Stock In', cls: 'bg-green-100 text-green-700' };
      case 'CONSUMPTION': return { label: 'Used', cls: 'bg-orange-100 text-orange-700' };
      case 'BORROW': return { label: 'Lent', cls: 'bg-blue-100 text-blue-700' };
      case 'RETURN': return { label: 'Returned', cls: 'bg-gray-100 text-gray-600' };
      default: return { label: type, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consumables</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{consumables.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engineering</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">{engineeringItems.length}</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-5 ${lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock</p>
          <p className={`text-3xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {lowStockItems.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Low Stock Alerts
              {lowStockItems.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </h3>
          </div>
          <div className="p-5">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-400">All items are sufficiently stocked ✓</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{item.stock} left</p>
                      <p className="text-xs text-gray-400">min: {item.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Borrows */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Active Borrows
              {activeBorrows.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {activeBorrows.length}
                </span>
              )}
            </h3>
          </div>
          <div className="p-5">
            {activeBorrows.length === 0 ? (
              <p className="text-sm text-gray-400">No items currently borrowed ✓</p>
            ) : (
              <div className="space-y-3">
                {activeBorrows.map(borrow => (
                  <div key={borrow.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{borrow.item.name}</p>
                      <p className="text-xs text-gray-400">{borrow.borrower}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">x{borrow.quantity}</p>
                      <p className="text-xs text-gray-400">{borrow.dateOut}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Level Bars */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Stock Levels</h3>
        </div>
        <div className="p-5 space-y-4">
          {items.map(item => {
            const pct = item.minStock > 0
              ? Math.min(100, Math.round((item.stock / (item.minStock * 3)) * 100))
              : 100;
            const isLow = item.stock <= item.minStock;
            return (
              <div key={item.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className={isLow ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                    {item.stock} / min {item.minStock}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.slice(0, 10).map(tx => {
            const { label, cls } = typeIcon(tx.type);
            return (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                    {label}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.item.name}</p>
                    {tx.borrower && (
                      <p className="text-xs text-gray-400">by {tx.borrower}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">x{tx.quantity}</p>
                  <p className="text-xs text-gray-400">{tx.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}