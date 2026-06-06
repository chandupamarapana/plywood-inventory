import { useEffect, useState } from 'react';
import api from '../api';

const emptyItemForm = { name: '', costPerUnit: '', minStock: '', newCategoryName: '', newCategoryUnit: '', newCategoryLowAlert: '' };
const emptyStockInForm = { quantity: '', supplier: '', note: '', loggedBy: '' };
const emptyBorrowForm = { quantity: '', borrower: '', note: '', loggedBy: '' };

export default function Engineering() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const [stockInItem, setStockInItem] = useState(null);
  const [stockInForm, setStockInForm] = useState(emptyStockInForm);

  const [borrowItem, setBorrowItem] = useState(null);
  const [borrowForm, setBorrowForm] = useState(emptyBorrowForm);

  const [activeTab, setActiveTab] = useState('items');

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchActiveBorrows();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) fetchItems(selectedCategoryId);
  }, [selectedCategoryId]);

  async function fetchCategories() {
    try {
      const res = await api.get('/categories/type/ENGINEERING');
      setCategories(res.data);
      if (res.data.length > 0) setSelectedCategoryId(res.data[0].id);
    } catch (e) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems(categoryId) {
    try {
      const res = await api.get(`/items/category/${categoryId}`);
      setItems(res.data);
    } catch (e) {
      setError('Failed to load items');
    }
  }

  async function fetchActiveBorrows() {
    try {
      const res = await api.get('/transactions/borrows/active');
      setActiveBorrows(res.data);
    } catch (e) {
      setError('Failed to load active borrows');
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    try {
      let categoryId = selectedCategoryId;

      if (isNewCategory) {
        const catRes = await api.post('/categories', {
          name: itemForm.newCategoryName,
          type: 'ENGINEERING',
          unit: itemForm.newCategoryUnit,
          lowAlert: Number(itemForm.newCategoryLowAlert) || 0,
        });
        categoryId = catRes.data.id;
        await fetchCategories();
        setSelectedCategoryId(categoryId);
      }

      await api.post(`/items/category/${categoryId}`, {
        name: itemForm.name,
        stock: 0,
        costPerUnit: Number(itemForm.costPerUnit),
        minStock: Number(itemForm.minStock),
      });

      setItemForm(emptyItemForm);
      setIsNewCategory(false);
      setShowAddItem(false);
      fetchItems(categoryId);
    } catch (e) {
      setError('Failed to add item');
    }
  }

  async function handleDeleteItem(id) {
    setDeletingId(id);
    try {
      await api.delete(`/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      setError('Failed to delete item. It may have transactions linked to it.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStockIn(e) {
    e.preventDefault();
    try {
      await api.post(`/transactions/stock-in/${stockInItem.id}`, {
        ...stockInForm,
        quantity: Number(stockInForm.quantity),
      });
      setStockInItem(null);
      setStockInForm(emptyStockInForm);
      fetchItems(selectedCategoryId);
    } catch (e) {
      setError('Failed to record stock-in');
    }
  }

  async function handleBorrow(e) {
    e.preventDefault();
    try {
      await api.post(`/transactions/borrow/${borrowItem.id}`, {
        ...borrowForm,
        quantity: Number(borrowForm.quantity),
      });
      setBorrowItem(null);
      setBorrowForm(emptyBorrowForm);
      fetchItems(selectedCategoryId);
      fetchActiveBorrows();
    } catch (e) {
      setError('Failed to record borrow. Check available stock.');
    }
  }

  async function handleReturn(borrowId) {
    if (!window.confirm('Confirm return of this item?')) return;
    try {
      await api.post(`/transactions/return/${borrowId}`, { loggedBy: '' });
      fetchActiveBorrows();
      if (selectedCategoryId) fetchItems(selectedCategoryId);
    } catch (e) {
      setError('Failed to record return');
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Engineering</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Items
        </button>
        <button
          onClick={() => setActiveTab('borrows')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'borrows' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Active Borrows
          {activeBorrows.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'borrows' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
            }`}>
              {activeBorrows.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400">No categories yet. Add an item to create one.</p>
            )}
          </div>

          {/* Add Item Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowAddItem(!showAddItem); setIsNewCategory(false); }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {showAddItem ? 'Cancel' : '+ Add Item'}
            </button>
          </div>

          {/* Add Item Form */}
          {showAddItem && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">New Item</h3>

              {/* Category toggle */}
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setIsNewCategory(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${!isNewCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  Existing Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCategory(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${isNewCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  + New Category
                </button>
              </div>

              <form onSubmit={handleAddItem} className="grid grid-cols-2 gap-4">

                {/* Existing category selector */}
                {!isNewCategory && categories.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={selectedCategoryId}
                      onChange={e => setSelectedCategoryId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* New category fields */}
                {isNewCategory && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">New Category Name</label>
                      <input
                        value={itemForm.newCategoryName}
                        onChange={e => setItemForm({ ...itemForm, newCategoryName: e.target.value })}
                        required={isNewCategory}
                        placeholder="e.g. Hand Tools"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Unit</label>
                      <input
                        value={itemForm.newCategoryUnit}
                        onChange={e => setItemForm({ ...itemForm, newCategoryUnit: e.target.value })}
                        required={isNewCategory}
                        placeholder="e.g. pcs"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Low Stock Alert Threshold</label>
                      <input
                        type="number"
                        value={itemForm.newCategoryLowAlert}
                        onChange={e => setItemForm({ ...itemForm, newCategoryLowAlert: e.target.value })}
                        placeholder="e.g. 5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div />
                  </>
                )}

                {/* Item fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Item Name</label>
                  <input
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                    placeholder="e.g. Spanner 12mm"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Cost Per Unit (LKR)</label>
                  <input
                    type="number"
                    value={itemForm.costPerUnit}
                    onChange={e => setItemForm({ ...itemForm, costPerUnit: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={itemForm.minStock}
                    onChange={e => setItemForm({ ...itemForm, minStock: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            {items.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No items in this category yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">In Stock</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Min Stock</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cost/Unit</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => {
                    const isConfirming = confirmDeleteId === item.id;
                    const isDeleting = deletingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {item.name}
                          {item.stock <= item.minStock && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Low Stock</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${item.stock <= item.minStock ? 'text-red-600' : 'text-green-600'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.minStock}</td>
                        <td className="px-4 py-3 text-gray-600">LKR {item.costPerUnit.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => { setStockInItem(item); setBorrowItem(null); }}
                              className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-lg"
                            >
                              Stock In
                            </button>
                            <button
                              onClick={() => { setBorrowItem(item); setStockInItem(null); }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-lg"
                            >
                              Lend
                            </button>
                            {isConfirming ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Sure?</span>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  disabled={isDeleting}
                                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded disabled:opacity-50"
                                >
                                  {isDeleting ? '...' : 'Yes'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Stock In Form */}
          {stockInItem && (
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-1">Stock In — {stockInItem.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Current stock: {stockInItem.stock}</p>
              <form onSubmit={handleStockIn} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" value={stockInForm.quantity}
                    onChange={e => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                    required min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Supplier</label>
                  <input value={stockInForm.supplier}
                    onChange={e => setStockInForm({ ...stockInForm, supplier: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Note</label>
                  <input value={stockInForm.note}
                    onChange={e => setStockInForm({ ...stockInForm, note: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Logged By</label>
                  <input value={stockInForm.loggedBy}
                    onChange={e => setStockInForm({ ...stockInForm, loggedBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2 flex gap-3">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg">
                    Confirm Stock In
                  </button>
                  <button type="button" onClick={() => setStockInItem(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Borrow Form */}
          {borrowItem && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-1">Lend Item — {borrowItem.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Available stock: {borrowItem.stock}</p>
              <form onSubmit={handleBorrow} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Borrower Name</label>
                  <input value={borrowForm.borrower}
                    onChange={e => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
                    required placeholder="Worker name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" value={borrowForm.quantity}
                    onChange={e => setBorrowForm({ ...borrowForm, quantity: e.target.value })}
                    required min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Note</label>
                  <input value={borrowForm.note}
                    onChange={e => setBorrowForm({ ...borrowForm, note: e.target.value })}
                    placeholder="e.g. Machine repair"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Logged By</label>
                  <input value={borrowForm.loggedBy}
                    onChange={e => setBorrowForm({ ...borrowForm, loggedBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 flex gap-3">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg">
                    Confirm Lend
                  </button>
                  <button type="button" onClick={() => setBorrowItem(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {activeTab === 'borrows' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {activeBorrows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No active borrows.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Borrower</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date Out</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeBorrows.map(borrow => (
                  <tr key={borrow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{borrow.item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{borrow.borrower}</td>
                    <td className="px-4 py-3 text-gray-600">{borrow.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{borrow.dateOut}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleReturn(borrow.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-lg"
                      >
                        Mark Returned
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}