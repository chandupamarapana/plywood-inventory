import { useEffect, useState } from 'react';
import api from '../api';

const TYPES = ['CONSUMABLE', 'ENGINEERING'];

const emptyForm = { name: '', type: 'CONSUMABLE', unit: '', lowAlert: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (e) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, lowAlert: Number(form.lowAlert) };
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchCategories();
    } catch (e) {
      setError('Failed to save category');
    }
  }

  function handleEdit(cat) {
    setForm({ name: cat.name, type: cat.type, unit: cat.unit, lowAlert: cat.lowAlert });
    setEditingId(cat.id);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (e) {
      setError('Failed to delete. Category may have items linked to it.');
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Categories</h2>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-700 mb-4">
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Gum Bags"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Unit</label>
            <input
              name="unit"
              value={form.unit}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. bags, pieces"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Low Stock Alert</label>
            <input
              name="lowAlert"
              type="number"
              value={form.lowAlert}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 50"
            />
          </div>

          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Update Category' : 'Add Category'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No categories yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Low Alert</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.type === 'CONSUMABLE'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cat.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{cat.unit}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.lowAlert}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}