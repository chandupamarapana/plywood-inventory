import { useEffect, useState } from 'react';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/register', form);
      setSuccess(`User "${form.username}" created successfully`);
      setForm({ username: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (e) {
      setError(e.response?.data || 'Failed to create user. Username may already exist.');
    }
  }

  async function handleDelete(username) {
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      await api.delete(`/auth/users/${username}`);
      fetchUsers();
    } catch (e) {
      setError('Failed to delete user');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Users</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">
          {success}
          <button onClick={() => setSuccess('')} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Add User Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">New User</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. factory2admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created At</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(user.username)}
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