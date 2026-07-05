'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Button, Card } from '@swiggyzone/ui';
import { setCredentials } from '@/store/authSlice';
import { Sparkles, Mail, Lock, Phone } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<'CUSTOMER' | 'RESTAURANT_OWNER'>('CUSTOMER');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone}`) : undefined;
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber: formattedPhone,
          role,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      if (data.user.roleName === 'RESTAURANT_OWNER') {
        router.push('/restaurant/onboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-brand-saffron text-white p-3 rounded-2xl shadow-xl shadow-brand-saffron/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Join SwiggyZone</h1>
          <p className="text-xs text-dark-muted">Register to get started</p>
        </div>

        <Card glass className="p-8 border border-white/5 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-muted">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dark-muted">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-dark-muted" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dark-muted">Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-dark-muted" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dark-muted">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-dark-muted" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-dark-muted">Register As</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    role === 'CUSTOMER'
                      ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                      : 'border-dark-border text-dark-muted hover:border-dark-text'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('RESTAURANT_OWNER')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    role === 'RESTAURANT_OWNER'
                      ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                      : 'border-dark-border text-dark-muted hover:border-dark-text'
                  }`}
                >
                  Restaurant Partner
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <div className="text-center pt-2 text-xs">
            <span className="text-dark-muted">Already have an account? </span>
            <Link href="/login" className="text-brand-saffron hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
