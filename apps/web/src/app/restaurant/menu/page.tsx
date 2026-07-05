'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button, Card } from '@swiggyzone/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Store, Plus, Trash2, Edit, Sliders, X, Check, Minus } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantMenuPage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const [restaurant, setRestaurant] = React.useState<any | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form states
  const [newCatName, setNewCatName] = React.useState('');
  const [showAddCat, setShowAddCat] = React.useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [dishName, setDishName] = React.useState('');
  const [dishDesc, setDishDesc] = React.useState('');
  const [dishPrice, setDishPrice] = React.useState('');
  const [dishCalories, setDishCalories] = React.useState('');
  const [dishStock, setDishStock] = React.useState('50');
  const [dishIsVeg, setDishIsVeg] = React.useState(true);

  // Fetch menu details
  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurants/my-restaurant`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setRestaurant(data);
      if (data.menu && data.menu.categories) {
        setCategories(data.menu.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMenu();
  }, [accessToken]);

  // Create Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !restaurant) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant.id}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        setNewCatName('');
        setShowAddCat(false);
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Menu Item
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/category/${selectedCategoryId}/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: dishName,
          description: dishDesc,
          price: parseFloat(dishPrice),
          isVeg: dishIsVeg,
          calories: parseInt(dishCalories) || 0,
          initialStock: parseInt(dishStock) || 50,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400',
        }),
      });
      if (res.ok) {
        setDishName('');
        setDishDesc('');
        setDishPrice('');
        setDishCalories('');
        setDishStock('50');
        setShowAddItem(false);
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Menu Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/item/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Inventory Stock
  const handleUpdateStock = async (itemId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/item/${itemId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ quantity: nextStock }),
      });
      if (res.ok) {
        fetchMenu();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-saffron border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-muted font-medium">Loading menu directory...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-dark-bg text-dark-text pb-20">
        
        {/* Header */}
        <header className="bg-dark-surface border-b border-dark-border py-4 px-6 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="bg-brand-saffron text-white p-2 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none">{restaurant?.name}</h2>
              <span className="text-[10px] text-dark-muted">Menu & Inventory Manager</span>
            </div>
          </div>
          <Link href="/restaurant/dashboard">
            <Button size="sm" variant="secondary">
              Go to Dashboard
            </Button>
          </Link>
        </header>

        <main className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6 animate-fadeIn">
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Categories & Dishes</h3>
            <Button size="sm" className="flex items-center gap-1.5" onClick={() => setShowAddCat(true)}>
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </Button>
          </div>

          {/* Categories listing */}
          <div className="space-y-6">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-5 border-dark-border/40 bg-dark-surface/30 space-y-4">
                <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
                  <h4 className="font-extrabold text-sm text-dark-text">{cat.name}</h4>
                  <Button
                    size="sm"
                    variant="glass"
                    className="text-xs py-1"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setShowAddItem(true);
                    }}
                  >
                    + Add Dish
                  </Button>
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-dark-border/40">
                  {cat.items && cat.items.length > 0 ? (
                    cat.items.map((item: any) => (
                      <div key={item.id} className="py-4 flex justify-between items-center flex-wrap gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3 h-3 border rounded flex items-center justify-center shrink-0 ${
                              item.isVeg ? 'border-green-600' : 'border-red-600'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                            </span>
                            <span className="font-bold text-xs text-dark-text">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-dark-muted line-clamp-1">{item.description}</p>
                          <div className="flex gap-4 text-[10px] text-dark-muted">
                            <span>₹{item.price}</span>
                            <span>•</span>
                            <span>{item.calories} kcal</span>
                          </div>
                        </div>

                        {/* Inventory Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-dark-bg px-2.5 py-1.5 rounded-xl border border-dark-border">
                            <button
                              onClick={() => handleUpdateStock(item.id, item.inventory?.quantity || 0, -1)}
                              className="text-dark-muted hover:text-dark-text"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-8 text-center">
                              {item.inventory?.quantity ?? 0}
                            </span>
                            <button
                              onClick={() => handleUpdateStock(item.id, item.inventory?.quantity || 0, 1)}
                              className="text-dark-muted hover:text-dark-text"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.inventory?.status === 'IN_STOCK' && 'bg-green-600/10 text-green-500'
                          } ${
                            item.inventory?.status === 'LOW_STOCK' && 'bg-amber-600/10 text-amber-500'
                          } ${
                            item.inventory?.status === 'OUT_OF_STOCK' && 'bg-red-600/10 text-red-500'
                          }`}>
                            {item.inventory?.status || 'IN_STOCK'}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-dark-muted hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-dark-muted">
                      No items under this category. Add a dish to populate menu.
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

        </main>

        {/* Modal: Add Category */}
        {showAddCat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <Card className="w-full max-w-sm bg-dark-surface border border-dark-border p-6 rounded-3xl relative space-y-4">
              <button className="absolute right-4 top-4 text-dark-muted" onClick={() => setShowAddCat(false)}>
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-base">Create Menu Category</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="e.g. Biryanis, Starters"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
                <Button type="submit" className="w-full">
                  Create Category
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Modal: Add Menu Item */}
        {showAddItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <Card className="w-full max-w-md bg-dark-surface border border-dark-border p-6 rounded-3xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <button className="absolute right-4 top-4 text-dark-muted" onClick={() => setShowAddItem(false)}>
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-base">Add New Dish</h3>
              <form onSubmit={handleAddMenuItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-dark-muted">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Paneer Tikka Roll"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-dark-muted">Description</label>
                  <textarea
                    required
                    placeholder="Fresh cottage cheese cubes..."
                    value={dishDesc}
                    onChange={(e) => setDishDesc(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-dark-muted">Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="180"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-dark-muted">Calories (kcal)</label>
                    <input
                      type="number"
                      placeholder="350"
                      value={dishCalories}
                      onChange={(e) => setDishCalories(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="space-y-1">
                    <label className="text-xs text-dark-muted">Initial Stock Quantity</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={dishStock}
                      onChange={(e) => setDishStock(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-dark-muted block">Classification</label>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDishIsVeg(true)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                          dishIsVeg ? 'border-green-600 bg-green-600/10 text-green-500' : 'border-dark-border'
                        }`}
                      >
                        Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setDishIsVeg(false)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                          !dishIsVeg ? 'border-red-600 bg-red-600/10 text-red-500' : 'border-dark-border'
                        }`}
                      >
                        Non-Veg
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full py-3">
                  Add Item to Menu
                </Button>
              </form>
            </Card>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
