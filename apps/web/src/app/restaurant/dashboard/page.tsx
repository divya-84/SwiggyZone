'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { Button, Card } from '@swiggyzone/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Sparkles,
  Store,
  TrendingUp,
  ShoppingBag,
  Clock,
  Plus,
  Power,
  BarChart,
  Grid,
  Menu as MenuIcon,
  LogOut,
  MapPin,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function RestaurantDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const [restaurant, setRestaurant] = React.useState<any | null>(null);
  const [activeOrders, setActiveOrders] = React.useState<any[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch dashboard data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const restRes = await fetch(`${API_BASE_URL}/api/restaurants/my-restaurant`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (restRes.status === 404) {
          // Redirect to onboard if no restaurant found
          router.push('/restaurant/onboard');
          return;
        }

        const restData = await restRes.json();
        setRestaurant(restData);

        // Set mock active orders queue
        setActiveOrders([
          {
            id: 'ord-1245',
            customer: 'Rahul Sharma',
            items: '1x Special Saffron Chicken Biryani, 1x Paneer Tikka Roll',
            total: 530,
            status: 'PLACED',
            time: '5 mins ago',
          },
          {
            id: 'ord-1240',
            customer: 'Priya Patel',
            items: '2x Chocolate Lava Cake',
            total: 280,
            status: 'PREPARING',
            time: '12 mins ago',
          },
        ]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, router]);

  // Toggle restaurant active status
  const handleToggleStatus = async () => {
    if (!restaurant) return;
    const nextState = !restaurant.isActive;
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (response.ok) {
        setRestaurant({ ...restaurant, isActive: nextState });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move order step in queue
  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    setActiveOrders(
      activeOrders
        .map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        .filter((o) => nextStatus !== 'DELIVERED'),
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-saffron border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-muted">Loading merchant portal...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-dark-bg text-dark-text pb-20">
        {/* Navigation Header */}
        <header className="bg-dark-surface border-b border-dark-border py-4 px-6 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="bg-brand-saffron text-white p-2 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none">{restaurant?.name}</h2>
              <span className="text-[10px] text-dark-muted">Merchant Control Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-300 ${
                restaurant?.isActive
                  ? 'border-green-600/30 bg-green-600/10 text-green-500'
                  : 'border-red-600/30 bg-red-600/10 text-red-500'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{restaurant?.isActive ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
            <button
              onClick={() => {
                dispatch(logout());
                router.push('/login');
              }}
              className="p-2 rounded-xl text-dark-muted hover:text-red-500 border border-dark-border hover:border-red-500/20 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard grid panel */}
        <main className="max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
          {/* Dashboard Navigation Tabs */}
          <div className="flex gap-4 border-b border-dark-border pb-3 text-xs font-bold text-dark-muted">
            <Link
              href="/restaurant/dashboard"
              className="text-brand-saffron border-b-2 border-brand-saffron pb-3 px-1"
            >
              Dashboard
            </Link>
            <Link href="/restaurant/menu" className="hover:text-dark-text pb-3 px-1">
              Menu & Inventory
            </Link>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card glass className="p-5 flex items-center justify-between border-dark-border/40">
              <div className="space-y-1">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">
                  Active Orders
                </span>
                <h3 className="text-2xl font-extrabold">{activeOrders.length}</h3>
              </div>
              <div className="bg-brand-saffron/10 text-brand-saffron p-2.5 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </Card>

            <Card glass className="p-5 flex items-center justify-between border-dark-border/40">
              <div className="space-y-1">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">
                  Kitchen Rating
                </span>
                <h3 className="text-2xl font-extrabold">★ {restaurant?.rating || '4.8'}</h3>
              </div>
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* Active Orders Queue */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold">Incoming Order Queue</h3>
              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.map((ord) => (
                    <Card
                      key={ord.id}
                      className="p-5 border-dark-border/60 bg-dark-surface/40 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-dark-text">{ord.customer}</span>
                          <div className="text-[10px] text-dark-muted">
                            {ord.time} • Order ID: {ord.id}
                          </div>
                        </div>
                        <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-dark-muted bg-dark-bg/60 p-3 rounded-lg border border-dark-border/40 italic">
                        {ord.items}
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-brand-saffron">
                          Total Paid: ₹{ord.total}
                        </span>
                        <div className="flex gap-2">
                          {ord.status === 'PLACED' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                            >
                              Accept & Prepare
                            </Button>
                          )}
                          {ord.status === 'PREPARING' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                            >
                              Food Ready
                            </Button>
                          )}
                          {ord.status === 'READY' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                            >
                              Rider Handover
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-dark-muted border border-dashed border-dark-border rounded-xl">
                  Queue is clear. No active orders.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
