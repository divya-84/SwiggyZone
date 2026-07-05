'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Button, Card } from '@swiggyzone/ui';
import { setCredentials } from '@/store/authSlice';
import { Sparkles, KeyRound } from 'lucide-react';
import Link from 'next/link';

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const phone = searchParams.get('phone') || '';
  const debugCode = searchParams.get('code') || '';

  const [otpCode, setOtpCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (debugCode) {
      setOtpCode(debugCode);
    }
  }, [debugCode]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, otpCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-fadeIn">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="bg-brand-saffron text-white p-3 rounded-2xl shadow-xl shadow-brand-saffron/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Mobile</h1>
        <p className="text-xs text-dark-muted">Enter the 6-digit OTP code sent to {phone}</p>
      </div>

      <Card glass className="p-8 border border-white/5 shadow-2xl space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {debugCode && (
          <div className="bg-brand-saffron/10 border border-brand-saffron/20 text-brand-saffron text-xs px-4 py-3 rounded-xl text-center">
            Auto-detected Dev OTP: <strong className="text-base font-bold">{debugCode}</strong>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-dark-muted">Verification Code</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-center text-base tracking-widest font-bold text-dark-text focus:outline-none focus:border-brand-saffron"
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-dark-muted" />
            </div>
          </div>

          <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
            {loading ? 'Verifying OTP...' : 'Verify & Continue'}
          </Button>
        </form>

        <div className="text-center pt-2 text-xs">
          <span className="text-dark-muted">Didn&apos;t get the code? </span>
          <Link href="/login" className="text-brand-saffron hover:underline font-semibold">
            Go back
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function OtpPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <React.Suspense
        fallback={
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-saffron border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-dark-muted font-medium">Loading security modules...</p>
          </div>
        }
      >
        <OtpForm />
      </React.Suspense>
    </div>
  );
}
