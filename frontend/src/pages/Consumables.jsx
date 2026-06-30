import { useEffect, useState } from "react";
import api from "../api";
import { exportMonthlyReport } from "../utils/exportExcel";

const emptyItemForm = {
  name: "",
  stock: 0,
  costPerUnit: "",
  minStock: "",
  newCategoryName: "",
  newCategoryUnit: "",
  newCategoryLowAlert: "",
};
const emptyStockInForm = { quantity: "", supplier: "", note: "", loggedBy: "" };
const emptyConsumeForm = { quantity: "", note: "", loggedBy: "" };

export default function Consumables() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const [stockInItem, setStockInItem] = useState(null);
  const [stockInForm, setStockInForm] = useState(emptyStockInForm);

  const [consumeItem, setConsumeItem] = useState(null);
  const [consumeForm, setConsumeForm] = useState(emptyConsumeForm);

  const [showExport, setShowExport] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    costPerUnit: "",
    minStock: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    if (selectedCategoryId) fetchItems(selectedCategoryId);
  }, [selectedCategoryId]);

  useEffect(() => {
    if (categories.length === 0) {
      setIsNewCategory(true);
    }
  }, [categories]);

  async function fetchCategories() {
    try {
      const res = await api.get("/categories/type/CONSUMABLE");
      setCategories(res.data);
      if (res.data.length > 0) setSelectedCategoryId(res.data[0].id);
    } catch (e) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems(categoryId) {
    try {
      const res = await api.get(`/items/category/${categoryId}`);
      setItems(res.data);
    } catch (e) {
      setError("Failed to load items");
    }
  }

  async function handleExport(e) {
    e.preventDefault();
    try {
      const [txRes, itemsRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/items"),
      ]);
      const consumableItems = itemsRes.data.filter(
        (i) => i.category.type === "CONSUMABLE"
      );
      exportMonthlyReport(consumableItems, txRes.data, exportFrom, exportTo);
      setShowExport(false);
    } catch (e) {
      setError("Failed to export report");
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    try {
      let categoryId = selectedCategoryId;

      // If user wants a new category, create it first
      if (isNewCategory) {
        const catRes = await api.post("/categories", {
          name: itemForm.newCategoryName,
          type: "CONSUMABLE",
          unit: itemForm.newCategoryUnit,
          lowAlert: Number(itemForm.newCategoryLowAlert) || 0,
        });
        categoryId = catRes.data.id;
        await fetchCategories();
        setSelectedCategoryId(categoryId);
      }

      await api.post(`/items/category/${categoryId}`, {
        name: itemForm.name,
        stock: Number(itemForm.stock),
        costPerUnit: Number(itemForm.costPerUnit),
        minStock: Number(itemForm.minStock),
      });

      setItemForm(emptyItemForm);
      setIsNewCategory(false);
      setShowAddItem(false);
      fetchItems(categoryId);
    } catch (e) {
      setError("Failed to add item");
    }
  }

  async function handleDeleteItem(id) {
    setDeletingId(id);
    try {
      await api.delete(`/items/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setConfirmDeleteId(null);
      // Refresh categories in case the backend auto-deleted an empty one
      const catRes = await api.get("/categories/type/CONSUMABLE");
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setSelectedCategoryId((prev) =>
          catRes.data.find((c) => c.id === prev) ? prev : catRes.data[0].id
        );
      }
    } catch (e) {
      setError("Failed to delete item. It may have transactions linked to it.");
    } finally {
      setDeletingId(null);
    }
  }
  async function handleEditItem(e) {
    e.preventDefault();
    try {
      await api.put(`/items/${editItem.id}`, {
        name: editForm.name,
        costPerUnit: Number(editForm.costPerUnit),
        minStock: Number(editForm.minStock),
      });
      setEditItem(null);
      fetchItems(selectedCategoryId);
    } catch (e) {
      setError("Failed to update item");
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
      setError("Failed to record stock-in");
    }
  }

  async function handleConsume(e) {
    e.preventDefault();
    try {
      await api.post(`/transactions/consume/${consumeItem.id}`, {
        ...consumeForm,
        quantity: Number(consumeForm.quantity),
      });
      setConsumeItem(null);
      setConsumeForm(emptyConsumeForm);
      fetchItems(selectedCategoryId);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Failed to record consumption");
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Consumables</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === cat.id
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400">
            No categories yet. Add an item to create one.
          </p>
        )}
      </div>

      {/* Export + Add Item Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={() => setShowExport(!showExport)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {showExport ? "Cancel" : "📊 Export Report"}
        </button>
        <button
          onClick={() => {
            setShowAddItem(!showAddItem);
            setIsNewCategory(false);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {showAddItem ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Export Form */}
      {showExport && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Export Monthly Report
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a date range to export consumption and stock data to Excel.
          </p>
          <form onSubmit={handleExport} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Download Excel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">
            New Item
          </h3>

          {/* Category toggle */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIsNewCategory(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                !isNewCategory
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Existing Category
            </button>
            <button
              type="button"
              onClick={() => setIsNewCategory(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                isNewCategory
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              + New Category
            </button>
          </div>

          <form onSubmit={handleAddItem} className="grid grid-cols-2 gap-4">
            {/* Existing category selector */}
            {!isNewCategory && categories.length > 0 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* New category fields */}
            {isNewCategory && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    New Category Name
                  </label>
                  <input
                    value={itemForm.newCategoryName}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        newCategoryName: e.target.value,
                      })
                    }
                    required={isNewCategory}
                    placeholder="e.g. Gum Bags"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Unit
                  </label>
                  <input
                    value={itemForm.newCategoryUnit}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        newCategoryUnit: e.target.value,
                      })
                    }
                    required={isNewCategory}
                    placeholder="e.g. bags, litres, kg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={itemForm.newCategoryLowAlert}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        newCategoryLowAlert: e.target.value,
                      })
                    }
                    placeholder="e.g. 10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div />
              </>
            )}

            {/* Item fields — always shown */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Item Name
              </label>
              <input
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                required
                placeholder="e.g. Gum Bag 50kg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Cost Per Unit (LKR)
              </label>
              <input
                type="number"
                value={itemForm.costPerUnit}
                onChange={(e) =>
                  setItemForm({ ...itemForm, costPerUnit: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={itemForm.minStock}
                onChange={(e) =>
                  setItemForm({ ...itemForm, minStock: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No items in this category yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Item
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Stock
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Min Stock
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Cost/Unit
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isConfirming = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.name}
                      {item.stock <= item.minStock && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          Low Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          item.stock <= item.minStock
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.minStock}</td>
                    <td className="px-4 py-3 text-gray-600">
                      LKR {item.costPerUnit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => {
                            setStockInItem(item);
                            setConsumeItem(null);
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-lg"
                        >
                          Stock In
                        </button>
                        <button
                          onClick={() => {
                            setConsumeItem(item);
                            setStockInItem(null);
                          }}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-medium px-3 py-1 rounded-lg"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditForm({
                              name: item.name,
                              costPerUnit: item.costPerUnit,
                              minStock: item.minStock,
                            });
                            setStockInItem(null);
                            setConsumeItem(null);
                          }}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium px-3 py-1 rounded-lg"
                        >
                          Edit
                        </button>
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Sure?</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isDeleting}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded disabled:opacity-50"
                            >
                              {isDeleting ? "..." : "Yes"}
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
      {/* Edit Item Form */}
      {editItem && (
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Edit Item — {editItem.name}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Stock quantity can only be changed via Stock In or Use actions.
          </p>
          <form onSubmit={handleEditItem} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Item Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Cost Per Unit (LKR)
              </label>
              <input
                type="number"
                value={editForm.costPerUnit}
                onChange={(e) =>
                  setEditForm({ ...editForm, costPerUnit: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={editForm.minStock}
                onChange={(e) =>
                  setEditForm({ ...editForm, minStock: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Stock In Form */}
      {stockInItem && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Stock In — {stockInItem.name}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Current stock: {stockInItem.stock}
          </p>
          <form onSubmit={handleStockIn} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={stockInForm.quantity}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, quantity: e.target.value })
                }
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Supplier
              </label>
              <input
                value={stockInForm.supplier}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, supplier: e.target.value })
                }
                placeholder="Supplier name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Note
              </label>
              <input
                value={stockInForm.note}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, note: e.target.value })
                }
                placeholder="Optional note"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Logged By
              </label>
              <input
                value={stockInForm.loggedBy}
                onChange={(e) =>
                  setStockInForm({ ...stockInForm, loggedBy: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
              >
                Confirm Stock In
              </button>
              <button
                type="button"
                onClick={() => setStockInItem(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Consume Form */}
      {consumeItem && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Record Usage — {consumeItem.name}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Current stock: {consumeItem.stock}
          </p>
          <form onSubmit={handleConsume} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Quantity Used
              </label>
              <input
                type="number"
                value={consumeForm.quantity}
                onChange={(e) =>
                  setConsumeForm({ ...consumeForm, quantity: e.target.value })
                }
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Note
              </label>
              <input
                value={consumeForm.note}
                onChange={(e) =>
                  setConsumeForm({ ...consumeForm, note: e.target.value })
                }
                placeholder="e.g. Morning shift"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Logged By
              </label>
              <input
                value={consumeForm.loggedBy}
                onChange={(e) =>
                  setConsumeForm({ ...consumeForm, loggedBy: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2 rounded-lg"
              >
                Confirm Usage
              </button>
              <button
                type="button"
                onClick={() => setConsumeItem(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
