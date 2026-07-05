'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button, Card } from '@swiggyzone/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Store } from 'lucide-react';

export default function RestaurantOnboardPage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [coverImage, setCoverImage] = React.useState('');
  const [costForTwo, setCostForTwo] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurants/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          description,
          coverImage:
            coverImage ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800',
          costForTwo: parseFloat(costForTwo),
          latitude: 12.9715,
          longitude: 77.6408,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Onboarding failed');
      }

      router.push('/restaurant/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}>
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-brand-saffron text-white p-3 rounded-2xl shadow-xl shadow-brand-saffron/20">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Onboard Your Kitchen</h1>
            <p className="text-xs text-dark-muted">Establish your brand on SwiggyZone</p>
          </div>

          <Card glass className="p-8 border border-white/5 shadow-2xl space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleOnboard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The Pizza Place"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">Description & Cuisines</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Gourmet Pizzas, Italian Pastas, Desserts..."
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron h-20 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">Cost for Two (₹)</label>
                <input
                  type="number"
                  required
                  value={costForTwo}
                  onChange={(e) => setCostForTwo(e.target.value)}
                  placeholder="300"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
              </div>

              <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
                {loading ? 'Submitting Details...' : 'Complete Onboarding'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
