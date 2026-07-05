'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { Button, Card } from '@swiggyzone/ui';
import { io } from 'socket.io-client';
import {
  Sparkles,
  MapPin,
  Clock,
  History,
  CreditCard,
  Settings as SettingsIcon,
  Check,
  X,
  Compass,
  ArrowRight,
  Receipt,
  Navigation,
  DollarSign,
  TrendingUp,
  Star,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function DeliveryDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, accessToken } = useSelector((state: RootState) => state.auth);

  // States
  const [profile, setProfile] = React.useState<any>(null);
  const [availableOrders, setAvailableOrders] = React.useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = React.useState<any | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // AI Optimization Simulation States
  const [aiOptimizedMode, setAiOptimizedMode] = React.useState(false);
  const [simTraffic, setSimTraffic] = React.useState<'LOW' | 'MEDIUM' | 'HEAVY'>('LOW');
  const [simWeather, setSimWeather] = React.useState<'SUNNY' | 'RAINY' | 'COLD'>('SUNNY');
  const [enableBatching, setEnableBatching] = React.useState(true);
  const [optimizationResult, setOptimizationResult] = React.useState<any | null>(null);
  const [optimizeLoading, setOptimizeLoading] = React.useState(false);
  const [animatedPointIndex, setAnimatedPointIndex] = React.useState(0);

  // OTP Modal
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otpInput, setOtpInput] = React.useState('');
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = React.useState<string | null>(null);

  const runAiOptimization = async () => {
    if (!accessToken) return;
    setOptimizeLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/delivery/optimize?traffic=${simTraffic}&weather=${simWeather}&enableBatching=${enableBatching}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Optimization failed');
      }

      setOptimizationResult(data);

      if (data.success && data.orders && data.orders.length > 0) {
        setActiveDelivery({
          id: data.orders[0].id,
          otpCode: data.orders[0].otpCode,
          status: 'PICKED_UP',
          isBatched: data.isBatched,
          allOrders: data.orders,
        });
        setAnimatedPointIndex(0);
      }
    } catch (err: any) {
      setError(err.message || 'Error running AI Delivery Optimization');
    } finally {
      setOptimizeLoading(false);
    }
  };

  React.useEffect(() => {
    if (aiOptimizedMode) {
      runAiOptimization();
    } else {
      setOptimizationResult(null);
      setActiveDelivery(null);
    }
  }, [aiOptimizedMode, simTraffic, simWeather, enableBatching]);

  React.useEffect(() => {
    if (!aiOptimizedMode || !optimizationResult || !activeDelivery) return;
    const coords = optimizationResult.route?.coordinates || [];
    if (coords.length === 0) return;

    const interval = setInterval(() => {
      setAnimatedPointIndex((prev) => {
        if (prev >= coords.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [aiOptimizedMode, optimizationResult, activeDelivery]);

  // Socket
  const socketRef = React.useRef<any>(null);

  // Load Dashboard Data
  const loadDashboard = async () => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      // Profile & Stats
      const profileRes = await fetch(`${API_BASE_URL}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
      }

      // Available Claims queue
      const availRes = await fetch(`${API_BASE_URL}/api/delivery/orders/available`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (availRes.ok) {
        const aData = await availRes.json();
        setAvailableOrders(aData);
      }

      // Job Logs
      const histRes = await fetch(`${API_BASE_URL}/api/delivery/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (histRes.ok) {
        const hData = await histRes.json();
        setHistory(hData);
      }
    } catch (err) {
      setError('Could not establish backend analytics connection');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDashboard();
  }, [isAuthenticated, accessToken]);

  // Connect WebSockets for coordinate sharing
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(API_BASE_URL, {
      query: { userId: user.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Delivery courier socket node registered');
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Toggle active status
  const handleToggleActive = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/toggle-active`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        loadDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Claim Delivery Job
  const handleAcceptOrder = async (orderId: string) => {
    if (!accessToken) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to accept order');
      }

      // Track active order
      setActiveDelivery({
        id: orderId,
        otpCode: data.otp,
        status: 'PICKED_UP',
      });

      // Join order socket room
      if (socketRef.current) {
        socketRef.current.emit('joinOrderRoom', { orderId });
      }

      loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Error claiming delivery job');
    }
  };

  // Trigger Delivery Verification OTP complete
  const handleVerifyOtp = async () => {
    if (!activeDelivery || !accessToken) return;
    setOtpError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/orders/${activeDelivery.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ otp: otpInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'OTP validation failed');
      }

      setOtpSuccessMsg('Delivery completed successfully! Payout credited.');
      setTimeout(() => {
        setShowOtpModal(false);
        setActiveDelivery(null);
        setOtpInput('');
        setOtpSuccessMsg(null);
        loadDashboard();
      }, 2000);
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification mismatch');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <div className="text-xs text-dark-muted animate-pulse">Loading Delivery dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-24 max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-surface/50 border border-dark-border p-6 rounded-3xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold">Courier Portal</h1>
            <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Rider ID: {profile?.licensePlate || 'N/A'}
            </span>
          </div>
          <p className="text-xs text-dark-muted">Welcome back, Amit. Manage your shifts, routes, and earnings.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${profile?.isActive ? 'text-green-500' : 'text-dark-muted'}`}>
            {profile?.isActive ? 'ONLINE & ACTIVE' : 'OFFLINE'}
          </span>
          <button
            onClick={handleToggleActive}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
              profile?.isActive ? 'bg-green-500' : 'bg-dark-border'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                profile?.isActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Shift Earnings', value: `₹${profile?.totalEarnings || 0}`, desc: 'Earned today', icon: DollarSign, color: 'text-green-500 bg-green-500/10 border-green-500/10' },
          { label: 'Completions', value: `${profile?.totalDeliveries || 0} jobs`, desc: 'Orders completed', icon: ShieldCheck, color: 'text-brand-saffron bg-brand-saffron/10 border-brand-saffron/10' },
          { label: 'Rating', value: `★ ${profile?.avgRating || '5.0'}`, desc: 'Average rating', icon: Star, color: 'text-amber-500 bg-amber-500/10 border-amber-500/10' },
          { label: 'Active Status', value: profile?.isActive ? 'ON' : 'OFF', desc: 'Rider availability', icon: Activity, color: 'text-blue-500 bg-blue-500/10 border-blue-500/10' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-4 border border-dark-border/40 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">{stat.label}</span>
              <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black">{stat.value}</h3>
              <p className="text-[10px] text-dark-muted">{stat.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* AI DELIVERY OPTIMIZATION CONTROL BANNER */}
      <Card className="p-5 border border-brand-saffron/20 bg-brand-saffron/5 flex flex-col md:flex-row justify-between items-center gap-4 rounded-3xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-brand-saffron" />
            <h2 className="text-base font-extrabold text-white">AI Dispatch & Routing Optimizer</h2>
          </div>
          <p className="text-xs text-dark-muted">
            Auto-assign active riders, batch nearby Indiranagar deliveries, and compute shortest multi-stop routes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-black uppercase tracking-wider ${aiOptimizedMode ? 'text-brand-saffron' : 'text-dark-muted'}`}>
            {aiOptimizedMode ? 'Optimizer Mode: ON' : 'Optimizer Mode: OFF'}
          </span>
          <button
            onClick={() => setAiOptimizedMode(!aiOptimizedMode)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
              aiOptimizedMode ? 'bg-brand-saffron' : 'bg-dark-border'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                aiOptimizedMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Main Interactive Tracking Map or Available Claims pool */}
      {aiOptimizedMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Simulation & ETA Engine */}
          <div className="lg:col-span-1 space-y-6">
            {/* Simulation controls */}
            <Card glass className="p-5 border border-dark-border/40 space-y-5 bg-dark-surface/30">
              <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                <SettingsIcon className="w-4 h-4 text-brand-saffron" />
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Simulation Parameters</h3>
              </div>

              {/* Traffic Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Traffic Congestion</label>
                <div className="grid grid-cols-3 gap-1 bg-dark-bg p-1 rounded-xl border border-dark-border">
                  {(['LOW', 'MEDIUM', 'HEAVY'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSimTraffic(t)}
                      className={`py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                        simTraffic === t
                          ? 'bg-brand-saffron text-white shadow-sm'
                          : 'text-dark-muted hover:text-dark-text'
                      }`}
                    >
                      {t === 'LOW' && '🟢 Low'}
                      {t === 'MEDIUM' && '🟡 Mid'}
                      {t === 'HEAVY' && '🔴 Heavy'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Weather Condition</label>
                <select
                  value={simWeather}
                  onChange={(e: any) => setSimWeather(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                >
                  <option value="SUNNY">☀️ Sunny / Clear</option>
                  <option value="RAINY">🌧️ Heavy Monsoon Rain</option>
                  <option value="COLD">❄️ Cold Mist</option>
                </select>
              </div>

              {/* Toggle Batching */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Enable Batch Deliveries</span>
                <button
                  type="button"
                  onClick={() => setEnableBatching(!enableBatching)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    enableBatching ? 'bg-brand-saffron' : 'bg-dark-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      enableBatching ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>

            {/* High-Precision ETA Engine Breakdown */}
            {optimizationResult?.etaBreakdown && (
              <Card glass className="p-5 border border-dark-border/40 space-y-4">
                <div className="flex justify-between items-center border-b border-dark-border pb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-saffron" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">ETA Predictor Engine</h3>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      optimizationResult.etaBreakdown.confidenceScore >= 80
                        ? 'bg-green-500/10 text-green-500'
                        : optimizationResult.etaBreakdown.confidenceScore >= 65
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    Confidence: {optimizationResult.etaBreakdown.confidenceScore}%
                  </span>
                </div>

                <div className="space-y-2 text-xs text-dark-muted">
                  <div className="flex justify-between">
                    <span>Base Kitchen Prep Time</span>
                    <span className="text-dark-text font-bold">{optimizationResult.etaBreakdown.basePrepTime}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transit Travel Duration</span>
                    <span className="text-dark-text font-bold">{optimizationResult.etaBreakdown.travelTime}m</span>
                  </div>
                  {optimizationResult.etaBreakdown.trafficDelay > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Traffic Delay Penalty</span>
                      <span>+{optimizationResult.etaBreakdown.trafficDelay}m</span>
                    </div>
                  )}
                  {optimizationResult.etaBreakdown.weatherDelay > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Weather Conditions slowdown</span>
                      <span>+{optimizationResult.etaBreakdown.weatherDelay}m</span>
                    </div>
                  )}
                  {optimizationResult.etaBreakdown.multiStopDelay > 0 && (
                    <div className="flex justify-between text-blue-500">
                      <span>Multi-stop Batch Overhead</span>
                      <span>+{optimizationResult.etaBreakdown.multiStopDelay}m</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-dark-border/40 space-y-1.5">
                  <div className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">AI Dispatches Logs</div>
                  {optimizationResult.etaBreakdown.factors.map((f: string, idx: number) => (
                    <div key={idx} className="text-[10px] text-dark-muted flex gap-1.5 items-start">
                      <span className="text-brand-saffron shrink-0">✔</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Routing Map & Batch Details */}
          <div className="lg:col-span-2 space-y-6">
            {optimizeLoading ? (
              <div className="h-64 bg-dark-bg border border-dark-border rounded-2xl animate-pulse" />
            ) : optimizationResult?.success ? (
              <div className="space-y-6">
                {/* Simulated Map */}
                <Card className="p-4 border border-dark-border/40 bg-dark-surface/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-dark-text flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-brand-saffron" />
                      Optimized Multi-Stop Route Path
                    </span>
                    {optimizationResult.isBatched && (
                      <span className="text-[9px] font-black uppercase bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">
                        Batch Delivery route
                      </span>
                    )}
                  </div>

                  {/* SVG Route Visualization */}
                  <div className="h-64 bg-dark-bg border border-dark-border rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-[0.03]">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="border border-white" />
                      ))}
                    </div>

                    {optimizationResult.route?.coordinates && (
                      <svg className="absolute w-full h-full" viewBox="0 0 500 200">
                        <path
                          d={
                            optimizationResult.isBatched
                              ? 'M 50 150 L 150 50 L 300 80 L 450 140'
                              : 'M 50 150 L 150 50 L 300 80'
                          }
                          fill="none"
                          stroke="#334155"
                          strokeWidth="3"
                          strokeDasharray="6"
                        />
                        <path
                          d={
                            optimizationResult.isBatched
                              ? 'M 50 150 L 150 50 L 300 80 L 450 140'
                              : 'M 50 150 L 150 50 L 300 80'
                          }
                          fill="none"
                          stroke="#FF6B09"
                          strokeWidth="3"
                          strokeDasharray="500"
                          strokeDashoffset={500 - (animatedPointIndex * (500 / (optimizationResult.route.coordinates.length || 1)))}
                          className="transition-all duration-300 ease-out"
                        />
                      </svg>
                    )}

                    <div className="absolute left-[30px] bottom-[30px] flex flex-col items-center">
                      <div className="w-7 h-7 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center shadow">🛵</div>
                      <span className="text-[9px] font-bold text-dark-muted mt-1">Rider Amit</span>
                    </div>

                    <div className="absolute left-[130px] top-[20px] flex flex-col items-center">
                      <div className="w-7 h-7 bg-brand-saffron/10 border-2 border-brand-saffron rounded-full flex items-center justify-center shadow">🏪</div>
                      <span className="text-[9px] font-bold text-brand-saffron mt-1">Saffron Hub Kitchen</span>
                    </div>

                    <div className="absolute left-[280px] top-[50px] flex flex-col items-center">
                      <div className="w-7 h-7 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center shadow">🏠</div>
                      <span className="text-[9px] font-bold text-dark-muted mt-1">Customer A (Rahul)</span>
                    </div>

                    {optimizationResult.isBatched && (
                      <div className="absolute right-[30px] bottom-[40px] flex flex-col items-center">
                        <div className="w-7 h-7 bg-dark-surface border border-dark-border rounded-full flex items-center justify-center shadow">🏠</div>
                        <span className="text-[9px] font-bold text-dark-muted mt-1">Customer B (Sanjana)</span>
                      </div>
                    )}

                    {optimizationResult.route?.coordinates?.[animatedPointIndex] && (
                      <div
                        className="absolute w-5 h-5 bg-brand-saffron rounded-full border border-white flex items-center justify-center shadow-lg shadow-brand-saffron/40 text-[10px] transition-all duration-300 ease-out"
                        style={{
                          left: `${50 + (animatedPointIndex * (400 / (optimizationResult.route.coordinates.length || 1)))}px`,
                          top: `${
                            optimizationResult.isBatched
                              ? 150 - (animatedPointIndex * 1.5)
                              : 150 - (animatedPointIndex * 2)
                          }px`,
                        }}
                      >
                        🏍️
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-center text-xs">
                    <div className="bg-dark-bg p-2 rounded-xl border border-dark-border/40">
                      <div className="text-dark-muted text-[9px] font-bold uppercase tracking-wider">Total distance</div>
                      <div className="text-dark-text font-black">{optimizationResult.route.totalDistance} km</div>
                    </div>
                    <div className="bg-dark-bg p-2 rounded-xl border border-dark-border/40">
                      <div className="text-dark-muted text-[9px] font-bold uppercase tracking-wider">Distance saved</div>
                      <div className="text-green-500 font-black">+{optimizationResult.route.distanceSaved} km</div>
                    </div>
                    <div className="bg-dark-bg p-2 rounded-xl border border-dark-border/40">
                      <div className="text-dark-muted text-[9px] font-bold uppercase tracking-wider">Time Optimized</div>
                      <div className="text-green-500 font-black">-{optimizationResult.route.timeSavedMins} mins</div>
                    </div>
                    <div className="bg-dark-bg p-2 rounded-xl border border-dark-border/40">
                      <div className="text-dark-muted text-[9px] font-bold uppercase tracking-wider">CO2 Reduced</div>
                      <div className="text-green-500 font-black">-{optimizationResult.route.co2ReducedKg} kg</div>
                    </div>
                  </div>
                </Card>

                {/* Batched orders list */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-brand-saffron" />
                    Assigned Job Batch Details ({optimizationResult.orders.length} orders)
                  </h3>
                  <div className="space-y-3">
                    {optimizationResult.orders.map((ord: any, idx: number) => (
                      <Card key={ord.id} className="p-4 border border-dark-border/40 flex justify-between items-center gap-4 bg-dark-surface/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-brand-saffron text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Stop {idx + 1}
                            </span>
                            <span className="font-extrabold text-sm">{ord.customerName}</span>
                          </div>
                          <div className="text-xs text-dark-muted flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-saffron shrink-0" />
                            <span>{ord.address}</span>
                          </div>
                          <div className="text-[10px] text-dark-muted flex gap-3 pt-1">
                            <span>ETA: <strong className="text-brand-saffron">{ord.eta}</strong></span>
                            <span>•</span>
                            <span>Distance: {ord.distance} km</span>
                            <span>•</span>
                            <span>OTP: <strong className="text-green-500 font-mono">{ord.otpCode}</strong></span>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-xs font-bold text-dark-muted">Order Payout: ₹60.00</div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setActiveDelivery({
                                id: ord.id,
                                otpCode: ord.otpCode,
                                status: 'PICKED_UP',
                                isBatched: optimizationResult.isBatched,
                                allOrders: optimizationResult.orders,
                              });
                              setShowOtpModal(true);
                            }}
                          >
                            Complete Stop {idx + 1}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-dark-border rounded-3xl bg-dark-surface/5 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-dark-muted opacity-50 animate-pulse" />
                <span className="text-sm font-bold text-dark-text">Ready for Auto-Dispatch</span>
                <span className="text-xs text-dark-muted max-w-sm">
                  Run the simulation by tweaking parameters to see AI routing in action.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : activeDelivery ? (
        <Card glass className="p-6 border border-brand-saffron/20 space-y-6">
          <div className="flex justify-between items-center border-b border-dark-border pb-4 flex-wrap gap-4">
            <div>
              <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Active Job: Order #{activeDelivery.id.substring(0, 8)}...
              </span>
              <h3 className="font-extrabold text-base mt-1">Route to Customer Address</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowOtpModal(true)}>
                Verify OTP & Complete Delivery
              </Button>
            </div>
          </div>

          {/* Interactive Routing map */}
          <div className="h-64 bg-dark-bg border border-dark-border rounded-2xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-10">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="border border-dark-text" />
              ))}
            </div>
            <svg className="absolute w-full h-full" viewBox="0 0 500 200">
              <path d="M 50 100 Q 250 20 450 100" fill="none" stroke="#334155" strokeWidth="4" strokeDasharray="8" />
              <path d="M 50 100 Q 250 20 450 100" fill="none" stroke="#FF6B09" strokeWidth="4" strokeDasharray="450" strokeDashoffset="250" />
            </svg>

            <div className="absolute left-[30px] top-[90px] flex flex-col items-center">
              <div className="w-6 h-6 bg-dark-surface border-2 border-dark-border rounded-full flex items-center justify-center">🏪</div>
              <span className="text-[9px] font-bold text-dark-muted mt-1">Saffron Hub Kitchen</span>
            </div>

            <div className="absolute w-8 h-8 bg-brand-saffron text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-saffron/30 left-[210px] top-[40px]">
              🏍️
            </div>

            <div className="absolute right-[30px] top-[90px] flex flex-col items-center">
              <div className="w-6 h-6 bg-brand-saffron/10 border-2 border-brand-saffron rounded-full flex items-center justify-center">🏠</div>
              <span className="text-[9px] font-bold text-brand-saffron mt-1">Customer Home</span>
            </div>
          </div>

          <div className="bg-dark-surface p-4 border border-dark-border rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Demo Code Alert</span>
              <p>Demo simulation OTP is: <strong className="text-brand-saffron text-sm">{activeDelivery.otpCode}</strong></p>
            </div>
            <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" /> Navigate
            </span>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Claims Queue */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-saffron" />
              Available Deliveries Queue
            </h2>

            {availableOrders.length > 0 ? (
              <div className="space-y-4">
                {availableOrders.map((ord) => (
                  <Card key={ord.id} className="p-4 border border-dark-border/40 flex justify-between items-center gap-4 bg-dark-surface/40">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ★ 4.8
                        </span>
                        <h4 className="font-extrabold text-sm">{ord.restaurant?.name || 'Gourmet Kitchen'}</h4>
                      </div>
                      <p className="text-xs text-dark-muted flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-saffron shrink-0" />
                        <span>Deliver to: Indiranagar, Bangalore</span>
                      </p>
                      <div className="text-[10px] text-dark-muted flex gap-3">
                        <span>Items: {ord.items?.length || 1} items</span>
                        <span>•</span>
                        <span>Prep Time: 15 mins</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm font-black text-green-500">+ ₹60.00 Payout</div>
                      <Button size="sm" onClick={() => handleAcceptOrder(ord.id)}>
                        Claim Job
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-dark-muted border border-dashed border-dark-border rounded-2xl bg-dark-surface/10">
                No ready delivery requests at this moment. You will receive updates dynamically.
              </div>
            )}
          </div>

          {/* Side stats / ratings */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Courier Feedback</h2>
            <Card className="p-4 border border-dark-border/40 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-dark-muted">Latest Reviews</span>
                <span className="text-xs text-brand-saffron hover:underline cursor-pointer">View All</span>
              </div>
              <div className="space-y-3.5">
                {[
                  { user: 'Mahesh K.', comment: 'Super fast delivery, food was burning hot!', score: 5 },
                  { user: 'Sanjana R.', comment: 'Friendly rider and clean packaging.', score: 5 },
                ].map((rev, idx) => (
                  <div key={idx} className="space-y-1 text-xs border-b border-dark-border/40 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-dark-text">{rev.user}</span>
                      <span className="text-amber-500 font-bold text-[10px]">★ {rev.score}</span>
                    </div>
                    <p className="text-[11px] text-dark-muted italic">&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payout & Earnings Ledger History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-brand-saffron" />
          Delivery History & Earnings Ledger
        </h2>
        <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
          {history.length > 0 ? (
            history.map((job) => (
              <div key={job.id} className="p-5 flex justify-between items-center text-xs flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-dark-text">Job ID: #{job.id.substring(0, 8)}...</div>
                  <div className="text-[10px] text-dark-muted">
                    Store: <strong className="text-brand-saffron">{job.restaurant?.name}</strong> • Completed: {new Date(job.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-600/10 text-green-500 uppercase">
                    COMPLETED
                  </span>
                  <div className="font-extrabold text-green-500">+ ₹60.00</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-dark-muted">
              No completed delivery logs on record for today.
            </div>
          )}
        </div>
      </div>

      {/* OTP Delivery Verification Modal */}
      {showOtpModal && activeDelivery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-sm bg-dark-surface border border-dark-border p-6 rounded-3xl relative space-y-6">
            <button className="absolute right-4 top-4 text-dark-muted hover:text-dark-text" onClick={() => setShowOtpModal(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <ShieldCheck className="w-12 h-12 text-brand-saffron mx-auto" />
              <h3 className="font-extrabold text-base pt-2">Enter Verification Code</h3>
              <p className="text-xs text-dark-muted">Ask the customer for their 4-digit SwiggyZone verification pin</p>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-2.5 rounded-xl text-center">
                {otpError}
              </div>
            )}

            {otpSuccessMsg && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs px-4 py-2.5 rounded-xl text-center">
                {otpSuccessMsg}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit OTP (e.g. 1234)"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 text-center text-lg font-black tracking-widest text-dark-text focus:outline-none focus:border-brand-saffron"
              />
              <Button className="w-full" onClick={handleVerifyOtp}>
                Verify & Disburse Payout
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
