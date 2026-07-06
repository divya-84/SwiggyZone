'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Button, Card } from '@swiggyzone/ui';
import { setCredentials } from '@/store/authSlice';
import { Sparkles, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [loginMode, setLoginMode] = React.useState<'email' | 'otp'>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      // Redirect based on role
      if (data.user.roleName === 'RESTAURANT_OWNER') {
        router.push('/restaurant/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request OTP');
      }

      // Redirect to OTP verification page, passing the phone number as query param
      router.push(`/otp?phone=${encodeURIComponent(formattedPhone)}&code=${data.debugCode || ''}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-brand-saffron text-white p-3 rounded-2xl shadow-xl shadow-brand-saffron/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Swiggy<span className="text-brand-saffron">Zone</span>
          </h1>
          <p className="text-xs text-dark-muted">AI-Powered Premium Food Delivery</p>
        </div>

        {/* Card containing Form */}
        <Card glass className="p-8 border border-white/5 shadow-2xl space-y-6">
          {/* Mode Switcher */}
          <div className="flex bg-dark-bg p-1 rounded-xl border border-dark-border">
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                loginMode === 'email'
                  ? 'bg-brand-saffron text-white shadow-md'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
              onClick={() => {
                setLoginMode('email');
                setError(null);
              }}
            >
              Email Login
            </button>
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                loginMode === 'otp'
                  ? 'bg-brand-saffron text-white shadow-md'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
              onClick={() => {
                setLoginMode('otp');
                setError(null);
              }}
            >
              Phone OTP
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {loginMode === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-dark-muted">Password</label>
                  <a href="#" className="text-[10px] text-brand-saffron hover:underline">
                    Forgot?
                  </a>
                </div>
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

              <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                <span className="text-[10px] text-dark-muted block">Format: 10-digit number</span>
              </div>

              <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
                {loading ? 'Sending code...' : 'Send OTP Code'}
              </Button>
            </form>
          )}

          {/* Registration navigation */}
          <div className="text-center pt-2 text-xs">
            <span className="text-dark-muted">New to SwiggyZone? </span>
            <Link href="/register" className="text-brand-saffron hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
