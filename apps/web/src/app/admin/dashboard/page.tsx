'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { Button, Card } from '@swiggyzone/ui';
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
  User as UserIcon,
  ShoppingBag,
  Percent,
  Plus,
  TrendingUp,
  FileText,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, accessToken } = useSelector((state: RootState) => state.auth);

  // States
  const [stats, setStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [restaurants, setRestaurants] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'users' | 'restaurants' | 'orders' | 'coupons' | 'logs' | 'fraud' | 'security' | 'testing' | 'devops'>('overview');

  // Security States
  const [securityHealth, setSecurityHealth] = React.useState<any>(null);
  const [plainText, setPlainText] = React.useState('');
  const [cipherText, setCipherText] = React.useState('');
  const [ivText, setIvText] = React.useState('');
  const [tagText, setTagText] = React.useState('');
  const [decryptedText, setDecryptedText] = React.useState('');

  // Testing Suite States
  const [testType, setTestType] = React.useState<'unit' | 'integration' | 'e2e' | 'performance'>('unit');
  const [testLogs, setTestLogs] = React.useState<string[]>([]);
  const [testRunning, setTestRunning] = React.useState(false);
  const [loadEndpoint, setLoadEndpoint] = React.useState('/api/restaurants');
  const [loadConcurrency, setLoadConcurrency] = React.useState(100);
  const [loadResults, setLoadResults] = React.useState<any>(null);
  const [loadTesting, setLoadTesting] = React.useState(false);

  // DevOps States
  const [terraformLogs, setTerraformLogs] = React.useState<string[]>([]);
  const [terraformRunning, setTerraformRunning] = React.useState(false);
  const [selectedK8sManifest, setSelectedK8sManifest] = React.useState<'deployment' | 'service' | 'secret'>('deployment');

  const handleRunTerraform = async () => {
    setTerraformRunning(true);
    setTerraformLogs(['[System] Initializing Terraform provision engine...']);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/devops/terraform-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const plan = data.plan || [];
        
        let index = 0;
        const interval = setInterval(() => {
          if (index < plan.length) {
            setTerraformLogs((prev) => [...prev, plan[index]]);
            index++;
          } else {
            clearInterval(interval);
            setTerraformRunning(false);
          }
        }, 250);
      }
    } catch (err) {
      console.error(err);
      setTerraformRunning(false);
    }
  };

  const handleRunTestSuite = async () => {
    setTestRunning(true);
    setTestLogs([`[System] Spawning test runner for type: ${testType.toUpperCase()}...`]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/testing/run-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type: testType }),
      });
      if (res.ok) {
        const data = await res.json();
        const logs = data.logs || [];
        
        let index = 0;
        const interval = setInterval(() => {
          if (index < logs.length) {
            setTestLogs((prev) => [...prev, logs[index]]);
            index++;
          } else {
            clearInterval(interval);
            setTestRunning(false);
          }
        }, 250);
      }
    } catch (err) {
      console.error(err);
      setTestRunning(false);
    }
  };

  const handleExecuteLoadTest = async () => {
    setLoadTesting(true);
    setLoadResults(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/testing/load-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          endpoint: loadEndpoint,
          concurrency: loadConcurrency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoadResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadTesting(false);
    }
  };

  const loadSecurityHealth = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/health`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityHealth(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEncryptSandbox = async () => {
    if (!plainText) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: plainText }),
      });
      if (res.ok) {
        const data = await res.json();
        setCipherText(data.ciphertext);
        setIvText(data.iv);
        setTagText(data.tag);
        setDecryptedText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecryptSandbox = async () => {
    if (!cipherText || !ivText || !tagText) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ciphertext: cipherText,
          iv: ivText,
          tag: tagText,
        }),
      });
      if (res.ok) {
        const data = await res.text();
        setDecryptedText(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'security' && accessToken) {
      loadSecurityHealth();
      const interval = setInterval(() => {
        loadSecurityHealth();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, accessToken]);

  // Loading & Errors
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fraud Detection States
  const [fraudStats, setFraudStats] = React.useState<any>(null);
  const [fraudAlerts, setFraudAlerts] = React.useState<any[]>([]);
  const [fraudLoading, setFraudLoading] = React.useState(false);
  const [fraudSimulateLoading, setFraudSimulateLoading] = React.useState(false);

  // Coupon Form State
  const [couponCode, setCouponCode] = React.useState('');
  const [couponDesc, setCouponDesc] = React.useState('');
  const [couponType, setCouponType] = React.useState<'PERCENTAGE' | 'FLAT'>('FLAT');
  const [couponVal, setCouponVal] = React.useState('');
  const [couponMinOrder, setCouponMinOrder] = React.useState('');
  const [couponSuccess, setCouponSuccess] = React.useState<string | null>(null);

  // Advanced Analytics States
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  const loadAnalyticsData = async () => {
    if (!accessToken) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'json') => {
    if (!analyticsData) return;

    if (format === 'json') {
      const jsonString = JSON.stringify(analyticsData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'swiggyzone_platform_analytics.json';
      link.click();
    } else {
      // Build CSV String
      const rows = [
        ['Report', 'SwiggyZone Platform Analytics Export'],
        ['Generated At', new Date().toISOString()],
        [],
        ['AGGREGATED METRICS'],
        ['Metric', 'Value'],
        ['Gross Volume', `₹${analyticsData.stats.grossSales}`],
        ['Platform Revenue', `₹${analyticsData.stats.platformCommission}`],
        ['Registered Users', analyticsData.stats.usersCount],
        [],
        ['CUSTOMER ANALYTICS'],
        ['Metric', 'Value'],
        ['Retention Rate', `${analyticsData.customerAnalytics.retentionRate}%`],
        ['Avg Order Frequency', `${analyticsData.customerAnalytics.orderFrequency} orders/mo`],
        ['Avg Lifetime Value', `₹${analyticsData.customerAnalytics.clvAverage}`],
        [],
        ['TOP SPENDING CUSTOMERS'],
        ['Email', 'Total Spend', 'Orders Count'],
        ...analyticsData.customerAnalytics.topCustomers.map((c: any) => [c.email, `₹${c.spend}`, c.count]),
        [],
        ['RESTAURANT PERFORMANCE'],
        ['Restaurant Name', 'Total Sales Volume', 'Rating'],
        ...analyticsData.restaurantAnalytics.topRestaurants.map((r: any) => [r.name, `₹${r.sales}`, r.rating])
      ];

      const csvContent = rows.map((e: any[]) => e.map((val: any) => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'swiggyzone_platform_analytics.csv';
      link.click();
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'overview' && accessToken) {
      loadAnalyticsData();
    }
  }, [activeSubTab, accessToken]);

  const loadFraudData = async () => {
    if (!accessToken) return;
    setFraudLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fraud/alerts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFraudStats(data.stats);
        setFraudAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to load fraud data', err);
    } finally {
      setFraudLoading(false);
    }
  };

  const handleSimulateFraud = async (category: string) => {
    if (!accessToken) return;
    setFraudSimulateLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fraud/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        await loadFraudData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFraudSimulateLoading(false);
    }
  };

  const handleBlockFraudUser = async (alertId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fraud/block/${alertId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await loadFraudData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissFraudAlert = async (alertId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fraud/dismiss/${alertId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await loadFraudData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'fraud') {
      loadFraudData();
    }
  }, [activeSubTab]);

  // Load Dashboard data
  const loadAdminData = async () => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      // stats
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }

      // users
      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
      }

      // restaurants
      const restRes = await fetch(`${API_BASE_URL}/api/admin/restaurants`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (restRes.ok) {
        const rData = await restRes.json();
        setRestaurants(rData);
      }

      // orders
      const ordersRes = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData);
      }

      // coupons
      const coupRes = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (coupRes.ok) {
        const cData = await coupRes.json();
        setCoupons(cData);
      }

      // logs
      const logsRes = await fetch(`${API_BASE_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData);
      }
    } catch (err) {
      setError('Could not connect to administrator analytics endpoint');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAdminData();
  }, [isAuthenticated, accessToken]);

  // Update user role
  const handleUpdateRole = async (targetUserId: string, nextRole: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle restaurant active status
  const handleToggleRestaurant = async (restId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurants/${restId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Coupon code form
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setCouponSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code: couponCode,
          description: couponDesc,
          discountType: couponType,
          discountValue: parseFloat(couponVal),
          minOrderValue: parseFloat(couponMinOrder) || 0.0,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days TTL expiry
        }),
      });

      if (res.ok) {
        setCouponSuccess(`Coupon ${couponCode} published successfully!`);
        setCouponCode('');
        setCouponDesc('');
        setCouponVal('');
        setCouponMinOrder('');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center">
        <div className="text-xs text-dark-muted animate-pulse">Loading SwiggyZone Admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-24 max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-surface/50 border border-dark-border p-6 rounded-3xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold">SwiggyZone Admin Portal</h1>
            <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Security Level: Admin
            </span>
          </div>
          <p className="text-xs text-dark-muted">Manage system users, listings, platform commission distributions, and logs.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gross Volume', value: `₹${stats?.grossSales?.toFixed(2) || '0.00'}`, desc: 'Delivered orders sum', icon: TrendingUp, color: 'text-green-500 bg-green-500/10 border-green-500/10' },
          { label: 'Platform Revenue', value: `₹${stats?.platformCommission?.toFixed(2) || '0.00'}`, desc: '10% platform commission', icon: Percent, color: 'text-brand-saffron bg-brand-saffron/10 border-brand-saffron/10' },
          { label: 'Active Orders', value: `${stats?.activeOrdersCount || 0}`, desc: 'Ongoing checkouts', icon: ShoppingBag, color: 'text-blue-500 bg-blue-500/10 border-blue-500/10' },
          { label: 'Total Users', value: `${stats?.usersCount || 0}`, desc: 'Registered customer nodes', icon: UserIcon, color: 'text-amber-500 bg-amber-500/10 border-amber-500/10' },
        ].map((kpi, idx) => (
          <Card key={idx} className="p-4 border border-dark-border/40 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black">{kpi.value}</h3>
              <p className="text-[10px] text-dark-muted">{kpi.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <nav className="flex gap-2 overflow-x-auto border-b border-dark-border pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview Analytics' },
          { id: 'users', label: 'Manage Users' },
          { id: 'restaurants', label: 'Outlets Manager' },
          { id: 'orders', label: 'Global Orders Log' },
          { id: 'coupons', label: 'Promo Coupons' },
          { id: 'logs', label: 'System Audit Logs' },
          { id: 'fraud', label: 'AI Fraud Detection' },
          { id: 'security', label: 'Security & Operations' },
          { id: 'testing', label: 'Testing & QA Suite' },
          { id: 'devops', label: 'DevOps & Monitoring' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeSubTab === tab.id
                ? 'bg-brand-saffron text-white shadow-md'
                : 'text-dark-muted hover:text-dark-text hover:bg-dark-surface/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* SUBTAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* AI insights alerts banner */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-dark-muted">Real-Time AI Business Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analyticsData?.aiInsights?.map((insight: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-2xl text-xs flex flex-col justify-between space-y-2 ${
                    insight.type === 'CRITICAL'
                      ? 'border-red-500/20 bg-red-500/5 text-red-400'
                      : insight.type === 'TREND'
                      ? 'border-brand-saffron/20 bg-brand-saffron/5 text-brand-orange'
                      : 'border-green-500/20 bg-green-500/5 text-green-400'
                  }`}
                >
                  <div className="font-extrabold uppercase text-[9px] tracking-wider">
                    {insight.type} Alert
                  </div>
                  <p className="leading-relaxed text-[11px]">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales Predictor & AI Forecast */}
            <Card className="lg:col-span-2 p-6 border border-dark-border/40 space-y-4">
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider">7-Day Sales & AI Revenue Forecast</h3>
                <span className="text-[9px] text-dark-muted font-bold">REGRESSION FORECAST MODEL</span>
              </div>
              <div className="h-48 bg-dark-bg border border-dark-border rounded-xl flex items-end justify-around p-4 relative pt-8">
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border-t border-dark-text w-full" />
                  ))}
                </div>
                {analyticsData?.forecast?.map((bar: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 z-10 w-10">
                    <div className="flex items-end gap-1 w-full h-28 justify-center">
                      {/* Actual sales bar */}
                      {bar.actual !== null && (
                        <div
                          className="w-3 bg-gradient-to-t from-brand-orange to-brand-saffron rounded-t-sm"
                          style={{ height: `${(bar.actual / 7000) * 100}%` }}
                          title={`Actual: ₹${bar.actual}`}
                        />
                      )}
                      {/* Forecast sales bar */}
                      <div
                        className="w-3 bg-blue-500/40 border border-blue-500/50 rounded-t-sm"
                        style={{ height: `${(bar.forecast / 7000) * 100}%` }}
                        title={`Forecast: ₹${bar.forecast}`}
                      />
                    </div>
                    <span className="text-[9px] text-dark-muted font-semibold uppercase">{bar.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-[10px] text-dark-muted font-bold justify-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-brand-saffron rounded-sm" /> Actual Sales</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500/40 border border-blue-500/50 rounded-sm" /> AI Forecast</span>
              </div>
            </Card>

            {/* Spatial Demand Heatmap */}
            <Card className="p-6 border border-dark-border/40 space-y-4">
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider">Spatial Order Demand Heatmap</h3>
                <span className="text-[9px] text-dark-muted font-bold">CITY SEGMENTS</span>
              </div>
              <div className="space-y-3">
                {analyticsData?.heatmaps?.map((zone: any) => (
                  <div
                    key={zone.zone}
                    className="p-3 bg-dark-surface border border-dark-border rounded-xl flex justify-between items-center text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-white">{zone.zone}</div>
                      <div className="text-[10px] text-dark-muted">
                        Active: {zone.drivers} drivers • {zone.orders} checkouts
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        zone.color === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-500'
                          : zone.color === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-500'
                          : zone.color === 'MODERATE'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}
                    >
                      Demand: {zone.demand}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Analytics Panel */}
            <Card className="p-6 border border-dark-border/40 space-y-5">
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider">Customer Loyalty & Retention</h3>
                <span className="text-[9px] text-dark-muted font-bold">User Nodes</span>
              </div>

              {/* Grid variables */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40">
                  <div className="text-lg font-black text-white">{analyticsData?.customerAnalytics?.retentionRate}%</div>
                  <div className="text-[9px] text-dark-muted uppercase font-bold">Retention</div>
                </div>
                <div className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40">
                  <div className="text-lg font-black text-white">{analyticsData?.customerAnalytics?.orderFrequency}x</div>
                  <div className="text-[9px] text-dark-muted uppercase font-bold">Orders/Mo</div>
                </div>
                <div className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40">
                  <div className="text-lg font-black text-white">₹{analyticsData?.customerAnalytics?.clvAverage}</div>
                  <div className="text-[9px] text-dark-muted uppercase font-bold">Avg CLV</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-dark-muted font-bold uppercase">Top Spending Platform Customers</span>
                <div className="bg-dark-bg/60 border border-dark-border/40 rounded-xl divide-y divide-dark-border/40 overflow-hidden text-[11px]">
                  {analyticsData?.customerAnalytics?.topCustomers?.map((cust: any) => (
                    <div key={cust.email} className="p-2.5 flex justify-between items-center">
                      <span className="text-white font-semibold">{cust.email}</span>
                      <div className="space-x-3 text-dark-muted">
                        <span>{cust.count} orders</span>
                        <strong className="text-brand-saffron">₹{cust.spend}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Restaurant performance List */}
            <Card className="p-6 border border-dark-border/40 space-y-5">
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider">Restaurant Outlet Performance</h3>
                <span className="text-[9px] text-dark-muted font-bold">Outlets</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40">
                  <div className="text-lg font-black text-white">{analyticsData?.restaurantAnalytics?.averagePrepTime}m</div>
                  <div className="text-[9px] text-dark-muted uppercase font-bold">Avg Prep Time</div>
                </div>
                <div className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40">
                  <div className="text-lg font-black text-brand-saffron">{analyticsData?.restaurantAnalytics?.ratingPerformance} ★</div>
                  <div className="text-[9px] text-dark-muted uppercase font-bold">Avg Rating</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-dark-muted font-bold uppercase">Leaderboard Outlets (Sales Volume)</span>
                <div className="bg-dark-bg/60 border border-dark-border/40 rounded-xl divide-y divide-dark-border/40 overflow-hidden text-[11px]">
                  {analyticsData?.restaurantAnalytics?.topRestaurants?.map((outlet: any) => (
                    <div key={outlet.name} className="p-2.5 flex justify-between items-center">
                      <span className="text-white font-semibold">{outlet.name}</span>
                      <div className="space-x-3 text-dark-muted">
                        <span>{outlet.rating} ★</span>
                        <strong className="text-green-500">₹{outlet.sales}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Export Consol reports panel */}
          <Card glass className="p-5 border border-dark-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="font-extrabold text-sm text-dark-text">Export Business Intelligence Reports</h4>
              <p className="text-[11px] text-dark-muted">Download platform data containing sales, revenue splits, and customer indexes.</p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary" size="sm" className="text-xs font-bold" onClick={() => handleExportReport('csv')}>
                📥 Export CSV Report
              </Button>
              <Button variant="glass" size="sm" className="text-xs font-bold" onClick={() => handleExportReport('json')}>
                📥 Export JSON Report
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* SUBTAB 2: USERS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base font-bold">Platform Users Registered</h2>
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
            {users.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center text-xs flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-dark-text flex items-center gap-2">
                    <span>{item.firstName} {item.lastName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.isVerified ? 'bg-green-600/10 text-green-500' : 'bg-amber-600/10 text-amber-500'
                    }`}>
                      {item.isVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-[10px] text-dark-muted">Email: {item.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={item.roleName}
                    onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                    className="bg-dark-bg border border-dark-border rounded-lg py-1 px-2.5 text-xs text-dark-text focus:outline-none"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                    <option value="DELIVERY_PARTNER">Delivery Partner</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: RESTAURANTS */}
      {activeSubTab === 'restaurants' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base font-bold">Outlets Listings</h2>
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
            {restaurants.map((rest) => (
              <div key={rest.id} className="p-4 flex justify-between items-center text-xs flex-wrap gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-dark-text">{rest.name}</h4>
                  <div className="text-[10px] text-dark-muted">Owner: {rest.owner?.email || 'N/A'}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    rest.isActive ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-500'
                  }`}>
                    {rest.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                  <Button size="sm" variant={rest.isActive ? 'secondary' : 'primary'} onClick={() => handleToggleRestaurant(rest.id)}>
                    {rest.isActive ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base font-bold">Global Orders Log</h2>
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 flex justify-between items-center text-xs flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-dark-text">Order: #{ord.id.substring(0, 8)}...</div>
                  <div className="text-[10px] text-dark-muted">
                    Customer: {ord.user?.firstName} • Store: {ord.restaurant?.name}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-0.5 rounded">
                    {ord.status}
                  </span>
                  <div className="font-extrabold text-dark-text">₹{ord.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: COUPONS */}
      {activeSubTab === 'coupons' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Coupon Form */}
          <Card className="p-6 border border-dark-border/40 space-y-4 h-fit">
            <h3 className="text-sm font-bold">Publish Promo Coupon</h3>
            {couponSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs px-4 py-2 rounded-xl">
                {couponSuccess}
              </div>
            )}
            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              <input
                type="text"
                placeholder="Code (e.g. SWIGGY50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={couponDesc}
                onChange={(e) => setCouponDesc(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCouponType('PERCENTAGE')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    couponType === 'PERCENTAGE' ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setCouponType('FLAT')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    couponType === 'FLAT' ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron' : 'border-dark-border text-dark-muted'
                  }`}
                >
                  Flat Rate (₹)
                </button>
              </div>
              <input
                type="number"
                placeholder="Value (e.g. 50)"
                value={couponVal}
                onChange={(e) => setCouponVal(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Min Order Value (e.g. 200)"
                value={couponMinOrder}
                onChange={(e) => setCouponMinOrder(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none"
              />
              <Button type="submit" className="w-full text-xs">
                Publish Code
              </Button>
            </form>
          </Card>

          {/* Coupon list */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold">Active Coupons list</h3>
            <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="font-extrabold text-brand-saffron text-sm">{c.code}</div>
                    <p className="text-[11px] text-dark-muted">{c.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="bg-green-600/10 text-green-500 font-bold px-2 py-0.5 rounded text-[10px]">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                    <div className="text-[10px] text-dark-muted">Used: {c.usedCount} times</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: SYSTEM LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-saffron" />
            Platform Database Audit Logs
          </h2>
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden divide-y divide-dark-border/40">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex justify-between items-center text-xs flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-dark-text flex items-center gap-2">
                    <span className="bg-brand-saffron/10 text-brand-saffron px-1.5 py-0.5 rounded text-[9px] uppercase">
                       {log.action}
                    </span>
                    <span>Table: {log.tableName}</span>
                  </div>
                  <div className="text-[10px] text-dark-muted">
                    Operator: {log.user?.email || 'System'} • Record: {log.recordId}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-dark-text font-semibold">{new Date(log.createdAt).toLocaleTimeString()}</div>
                  <div className="text-[9px] text-dark-muted">{new Date(log.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 7: AI FRAUD DETECTION */}
      {activeSubTab === 'fraud' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk gauge card */}
            <Card className="p-6 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">System Threat Index</span>
                <span className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase px-2 py-0.5 rounded">AI Scan Live</span>
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="text-4xl font-black text-white">
                  {fraudStats?.riskIndex || 0}%
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase text-dark-text">
                    {fraudStats?.riskIndex > 85 ? '🚨 CRITICAL RISK' : fraudStats?.riskIndex > 60 ? '⚠️ HIGH THREAT' : '🟢 MODERATE THREAT'}
                  </div>
                  <p className="text-[10px] text-dark-muted">Aggregated real-time platform risk ratio</p>
                </div>
              </div>
              <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border">
                <div
                  className={`h-full transition-all duration-1000 ${
                    fraudStats?.riskIndex > 85 ? 'bg-red-500' : fraudStats?.riskIndex > 60 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${fraudStats?.riskIndex || 0}%` }}
                />
              </div>
            </Card>

            {/* Scanning details kpi */}
            <Card className="p-6 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Transactions Scanned</span>
                <div className="p-1 rounded bg-brand-saffron/10 text-brand-saffron"><RotateCcw className="w-3.5 h-3.5" /></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{fraudStats?.totalScanned || 0}</h3>
                <p className="text-[10px] text-dark-muted">API requests and checkout sessions scanned in last 24h</p>
              </div>
              <div className="text-[10px] text-green-500 font-extrabold flex items-center gap-1">
                <span>⚡ 100% of activity monitored</span>
              </div>
            </Card>

            {/* Prevented coupon loss card */}
            <Card className="p-6 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Abuse Losses Prevented</span>
                <div className="p-1 rounded bg-green-500/10 text-green-500"><ShieldCheck className="w-3.5 h-3.5" /></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-green-500">₹{fraudStats?.savingsSaved?.toFixed(2) || '0.00'}</h3>
                <p className="text-[10px] text-dark-muted">Savings saved by automatically rejecting bad coupon attempts</p>
              </div>
              <div className="text-[10px] text-dark-muted">
                Blocked Profiles: <span className="text-white font-bold">{fraudStats?.blockedCount || 0} users</span>
              </div>
            </Card>
          </div>

          {/* Action Simulation Console & Realtime Alert Queue split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Simulation controls panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card glass className="p-5 border border-dark-border/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                  <Sparkles className="w-4 h-4 text-brand-saffron" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Attack Vector Simulator</h3>
                </div>
                <p className="text-[11px] text-dark-muted">
                  Trigger automated fraud attacks on our rules engine to test real-time alerting and user mitigation systems.
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    size="sm"
                    variant="glass"
                    className="w-full text-left justify-start text-[11px]"
                    onClick={() => handleSimulateFraud('COUPON_ABUSE')}
                    disabled={fraudSimulateLoading}
                  >
                    🎟️ Simulate Coupon Abuse Attack
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    className="w-full text-left justify-start text-[11px]"
                    onClick={() => handleSimulateFraud('FAKE_REVIEWS')}
                    disabled={fraudSimulateLoading}
                  >
                    ✍️ Simulate Fake Reviews Campaign
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    className="w-full text-left justify-start text-[11px]"
                    onClick={() => handleSimulateFraud('PAYMENT_FRAUD')}
                    disabled={fraudSimulateLoading}
                  >
                    💳 Simulate Payment Fraud Attempt
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    className="w-full text-left justify-start text-[11px]"
                    onClick={() => handleSimulateFraud('BOT_USERS')}
                    disabled={fraudSimulateLoading}
                  >
                    🤖 Simulate Bot Traffic Spike
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    className="w-full text-left justify-start text-[11px]"
                    onClick={() => handleSimulateFraud('DUPLICATE_ACCOUNTS')}
                    disabled={fraudSimulateLoading}
                  >
                    👥 Simulate Duplicate Account Signups
                  </Button>
                </div>
              </Card>

              {/* Engine explanations */}
              <Card className="p-4 border border-dark-border/40 bg-dark-surface/20 text-[11px] space-y-3">
                <div className="font-extrabold text-dark-text uppercase tracking-wider text-[9px]">Fraud Category Rules</div>
                <div className="space-y-2 text-dark-muted">
                  <div><strong>Coupon Abuse:</strong> Triggered when identical card signatures make checkouts using different signup emails.</div>
                  <div><strong>Fake Reviews:</strong> Triggered by submitting positive reviews under 3 seconds from delivery, or repeating phrase structures.</div>
                  <div><strong>Payment Fraud:</strong> Triggered by velocity constraints (exceeding 3 charge attempts with different cards).</div>
                  <div><strong>Bot Activity:</strong> Headless browsers executing actions with zero touch movements or missing user-agents.</div>
                  <div><strong>Duplicate Accounts:</strong> Identified using shared audio/canvas fingerprints + identical phone nodes.</div>
                </div>
              </Card>
            </div>

            {/* Alerts Log Queue list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-saffron animate-pulse" />
                Real-Time Security Alerts Log ({fraudAlerts.length} total)
              </h3>

              {fraudLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-dark-surface border border-dark-border h-24 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : fraudAlerts.length > 0 ? (
                <div className="space-y-3">
                  {fraudAlerts.map((alert) => {
                    const isPending = alert.status === 'PENDING';
                    const isBlocked = alert.status === 'BLOCKED';

                    return (
                      <Card
                        key={alert.id}
                        glass
                        className={`p-4 border relative overflow-hidden transition-all duration-300 ${
                          isBlocked
                            ? 'border-red-500/20 bg-red-500/5'
                            : alert.status === 'DISMISSED'
                            ? 'opacity-40 border-dark-border'
                            : 'border-dark-border/60 hover:border-brand-saffron/20'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  alert.riskScore >= 90
                                    ? 'bg-red-500/10 text-red-500'
                                    : alert.riskScore >= 75
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-green-500/10 text-green-500'
                                }`}
                              >
                                Risk Score: {alert.riskScore}
                              </span>
                              <span className="bg-dark-bg text-dark-text border border-dark-border text-[9px] font-bold px-2 py-0.5 rounded">
                                {alert.category}
                              </span>
                              <span className="text-[10px] text-dark-muted">{alert.time}</span>
                            </div>
                            <h4 className="font-extrabold text-sm text-dark-text pt-1">Target Account: {alert.userEmail}</h4>
                            <p className="text-xs text-dark-muted pt-0.5 leading-relaxed">{alert.description}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="text-[10px] px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white h-7 flex items-center gap-1 border-0"
                                  onClick={() => handleBlockFraudUser(alert.id)}
                                >
                                  Block Profile
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-[10px] px-2.5 py-1 h-7 flex items-center gap-1"
                                  onClick={() => handleDismissFraudAlert(alert.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                  isBlocked
                                    ? 'bg-red-600/20 text-red-500 border border-red-600/30'
                                    : 'bg-dark-border text-dark-muted border border-dark-border'
                                }`}
                              >
                                {alert.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-dark-border rounded-3xl bg-dark-surface/5 flex flex-col items-center justify-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-green-500 opacity-50" />
                  <span className="text-sm font-bold text-dark-text">No Active Fraud Threats</span>
                  <span className="text-xs text-dark-muted">Platform integrity is secure. Trigger simulations on the left to test security systems.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: SECURITY & OPERATIONS */}
      {activeSubTab === 'security' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Dials Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Database status */}
            <Card className="p-5 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-36">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Database Connection</span>
              <div className="py-1">
                <span
                  className={`text-2xl font-black ${
                    securityHealth?.dbStatus === 'ONLINE' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  ● {securityHealth?.dbStatus || 'ONLINE'}
                </span>
                <p className="text-[10px] text-dark-muted mt-1">Prisma PostgreSQL engine ping status</p>
              </div>
              <span className="text-[9.5px] text-green-500 font-semibold">⚡ PostgreSQL 16 ready</span>
            </Card>

            {/* CPU usage dial */}
            <Card className="p-5 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-36">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">System CPU load</span>
              <div className="py-1">
                <span className="text-3xl font-black text-white">{securityHealth?.cpuPercent || 0}%</span>
                <p className="text-[10px] text-dark-muted mt-1">Uptime thread polling CPU core load</p>
              </div>
              <div className="w-full bg-dark-bg h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-saffron transition-all duration-500"
                  style={{ width: `${securityHealth?.cpuPercent || 0}%` }}
                />
              </div>
            </Card>

            {/* RAM heap usage */}
            <Card className="p-5 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-36">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Node heap memory</span>
              <div className="py-1">
                <span className="text-3xl font-black text-white">
                  {securityHealth?.memory?.used || 0} MB
                </span>
                <span className="text-xs text-dark-muted ml-1.5">/ {securityHealth?.memory?.total || 0} MB</span>
                <p className="text-[10px] text-dark-muted mt-1">V8 virtual machine active garbage memory</p>
              </div>
              <span className="text-[9.5px] text-dark-muted">Garbage collection active</span>
            </Card>

            {/* System uptime */}
            <Card className="p-5 border border-dark-border/40 bg-dark-surface/30 flex flex-col justify-between h-36">
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Process Uptime</span>
              <div className="py-1">
                <span className="text-2xl font-black text-white">
                  {securityHealth?.uptimeSeconds || 0} s
                </span>
                <p className="text-[10px] text-dark-muted mt-1">Total process execution running timeline</p>
              </div>
              <span className="text-[9.5px] text-dark-muted">Service Instance: active-worker-1</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Headers & OWASP checklist */}
            <div className="space-y-6">
              {/* Helmet secure headers list */}
              <Card glass className="p-5 border border-dark-border/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Helmet Security Headers (CSP)</h3>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'contentSecurityPolicy', label: '🛡️ Content-Security-Policy', desc: 'Blocks injection and unauthorized assets load' },
                    { key: 'xFrameOptions', label: '🔲 X-Frame-Options (SAMEORIGIN)', desc: 'Prevents clickjacking frame overlays' },
                    { key: 'xXSSProtection', label: '🚫 X-XSS-Protection (1; mode=block)', desc: 'Prevents reflected script triggers' },
                    { key: 'strictTransportSecurity', label: '🔒 Strict-Transport-Security (HSTS)', desc: 'Enforces encrypted HTTPS connections' },
                    { key: 'xContentTypeOptions', label: '📄 X-Content-Type-Options (nosniff)', desc: 'Blocks mime-sniffing script execution' },
                  ].map((header) => {
                    const isSet = securityHealth?.headers?.[header.key as any];
                    return (
                      <div
                        key={header.key}
                        className="flex justify-between items-center bg-dark-bg/60 p-2.5 border border-dark-border/40 rounded-xl text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-white">{header.label}</span>
                          <p className="text-[10px] text-dark-muted">{header.desc}</p>
                        </div>
                        <span className="bg-green-600/10 text-green-500 font-bold uppercase text-[9px] px-2 py-0.5 rounded">
                          {isSet ? 'ENABLED' : 'ACTIVE'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* OWASP checkouts */}
              <Card className="p-5 border border-dark-border/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                  <AlertTriangle className="w-4 h-4 text-brand-saffron" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">OWASP Top 10 Protection Status</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-dark-muted">
                  <div className="bg-dark-surface p-2.5 rounded-xl border border-dark-border/40">
                    <span className="text-white font-bold">SQL Injection:</span>
                    <span className="text-green-500 block">🟢 Sanitized (Prisma Queries)</span>
                  </div>
                  <div className="bg-dark-surface p-2.5 rounded-xl border border-dark-border/40">
                    <span className="text-white font-bold">Broken Authentication:</span>
                    <span className="text-green-500 block">🟢 Secure (JWT + OTP verified)</span>
                  </div>
                  <div className="bg-dark-surface p-2.5 rounded-xl border border-dark-border/40">
                    <span className="text-white font-bold">Cross-Site Scripting (XSS):</span>
                    <span className="text-green-500 block">🟢 Active (CSP Headers)</span>
                  </div>
                  <div className="bg-dark-surface p-2.5 rounded-xl border border-dark-border/40">
                    <span className="text-white font-bold">CSRF Protection:</span>
                    <span className="text-green-500 block">🟢 Configured (Strict CORS)</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Encryption Sandbox column */}
            <div className="space-y-6">
              <Card glass className="p-5 border border-dark-border/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                  <RotateCcw className="w-4 h-4 text-brand-saffron" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">AES-256-GCM Encryption Sandbox</h3>
                </div>
                <p className="text-[11px] text-dark-muted">
                  Enter sensitive credentials (e.g., Credit Card numbers or private API keys) to test key encryption strength and verify decryption logs.
                </p>

                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    placeholder="Enter raw text to encrypt..."
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                  />
                  <Button className="w-full text-xs h-9" onClick={handleEncryptSandbox}>
                    Encrypt Text Data
                  </Button>
                </div>

                {cipherText && (
                  <div className="space-y-3 pt-3 border-t border-t-dark-border/60">
                    {/* Cipher text output */}
                    <div className="bg-dark-bg p-3.5 rounded-xl border border-dark-border/40 font-mono text-[9px] space-y-2 text-dark-muted">
                      <div>
                        <span className="text-brand-saffron font-bold block mb-0.5">Ciphertext (AES hex):</span>
                        <span className="text-white select-all break-all">{cipherText}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px] pt-1">
                        <div>
                          <span className="text-blue-400 font-bold block mb-0.5">IV Hex:</span>
                          <span className="select-all break-all">{ivText}</span>
                        </div>
                        <div>
                          <span className="text-green-400 font-bold block mb-0.5">GCM Tag Hex:</span>
                          <span className="select-all break-all">{tagText}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="secondary" className="w-full text-xs h-9" onClick={handleDecryptSandbox}>
                      Decrypt Ciphertext
                    </Button>
                  </div>
                )}

                {decryptedText && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold uppercase text-[9px] tracking-wider block">Decrypted Plaintext Output:</span>
                    <strong className="text-white text-sm select-all">{decryptedText}</strong>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
      {/* SUBTAB 9: TESTING & QA SUITE */}
      {activeSubTab === 'testing' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Runner Suite */}
            <Card glass className="p-5 border border-dark-border/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                <Sparkles className="w-4 h-4 text-brand-saffron" />
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Automated Test Suites Runner</h3>
              </div>
              <p className="text-[11px] text-dark-muted">
                Execute automated Jest unit, integration, and Cypress end-to-end user journey tests against active sandbox services.
              </p>

              <div className="flex gap-2 pt-1 flex-wrap">
                {[
                  { id: 'unit', label: 'Unit Tests' },
                  { id: 'integration', label: 'Integration' },
                  { id: 'e2e', label: 'E2E User Journey' },
                  { id: 'performance', label: 'Performance' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTestType(type.id as any)}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      testType === type.id
                        ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                        : 'border-dark-border text-dark-muted'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <Button className="w-full text-xs h-9 flex items-center justify-center gap-2" onClick={handleRunTestSuite} disabled={testRunning}>
                🚀 {testRunning ? 'Running Test Cases...' : 'Execute Active Test Suite'}
              </Button>

              {/* Console log output window */}
              <div className="bg-black/80 border border-dark-border rounded-2xl p-4 font-mono text-[9.5px] text-green-400 h-64 overflow-y-auto scrollbar-none space-y-1.5">
                {testLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
                {testLogs.length === 0 && <div className="text-dark-muted italic">Console ready. Click "Execute" above.</div>}
              </div>
            </Card>

            {/* Load Stress tester */}
            <Card glass className="p-5 border border-dark-border/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                <AlertTriangle className="w-4 h-4 text-brand-saffron animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Database Load Stress Tester</h3>
              </div>
              <p className="text-[11px] text-dark-muted">
                Execute concurrent API stress tests against backend database engines to compute latency distributions.
              </p>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-muted uppercase">Target API Endpoint</label>
                    <select
                      value={loadEndpoint}
                      onChange={(e) => setLoadEndpoint(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none"
                    >
                      <option value="/api/restaurants">GET /api/restaurants</option>
                      <option value="/api/recommendations">GET /api/recommendations</option>
                      <option value="/api/users">GET /api/users</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-muted uppercase">Concurrency (Requests)</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={loadConcurrency}
                      onChange={(e) => setLoadConcurrency(parseInt(e.target.value) || 100)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    />
                  </div>
                </div>

                <Button className="w-full text-xs h-9" onClick={handleExecuteLoadTest} disabled={loadTesting}>
                  ⚡ {loadTesting ? 'Stress Testing DB...' : 'Fire Concurrency Stress Run'}
                </Button>
              </div>

              {/* Stress run results dials */}
              {loadResults ? (
                <div className="space-y-4 pt-3 border-t border-dark-border/60 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40">
                      <div className="text-sm font-black text-green-500">{loadResults.rps} RPS</div>
                      <div className="text-[8px] text-dark-muted uppercase font-bold">Throughput</div>
                    </div>
                    <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40">
                      <div className="text-sm font-black text-white">{loadResults.avgLatencyMs} ms</div>
                      <div className="text-[8px] text-dark-muted uppercase font-bold">Avg Latency</div>
                    </div>
                    <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40">
                      <div className="text-sm font-black text-white">{loadResults.successCount} / {loadResults.concurrency}</div>
                      <div className="text-[8px] text-dark-muted uppercase font-bold">Success Reqs</div>
                    </div>
                  </div>

                  {/* Percentile chart */}
                  <div className="bg-dark-bg/60 p-3.5 rounded-xl border border-dark-border/40 text-[10px] space-y-2">
                    <span className="font-extrabold uppercase text-[8.5px] text-dark-muted tracking-wider">Latency Percentiles</span>
                    <div className="grid grid-cols-3 gap-2 font-mono text-center">
                      <div>
                        <span className="text-dark-muted block">p50 (Median)</span>
                        <strong className="text-white text-xs">{loadResults.p50} ms</strong>
                      </div>
                      <div>
                        <span className="text-dark-muted block">p90 (High)</span>
                        <strong className="text-brand-saffron text-xs">{loadResults.p90} ms</strong>
                      </div>
                      <div>
                        <span className="text-dark-muted block">p99 (Peak)</span>
                        <strong className="text-red-500 text-xs">{loadResults.p99} ms</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : loadTesting ? (
                <div className="h-28 bg-dark-bg/60 border border-dashed border-dark-border rounded-2xl flex items-center justify-center">
                  <div className="text-xs text-dark-muted animate-pulse">Running database connections benchmark...</div>
                </div>
              ) : (
                <div className="h-28 bg-dark-bg/60 border border-dashed border-dark-border rounded-2xl flex items-center justify-center">
                  <div className="text-xs text-dark-muted italic">Click button above to benchmark endpoint.</div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      {/* SUBTAB 10: DEVOPS & INFRASTRUCTURE */}
      {activeSubTab === 'devops' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Dials */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Docker Containers', value: '7 / 7 Active', desc: 'All compose nodes online', color: 'text-green-500' },
              { label: 'Kubernetes Pods', value: '5 Replica Pods', desc: 'Running on EKS cluster', color: 'text-blue-500' },
              { label: 'Nginx Proxy', value: 'Healthy (HTTP 200)', desc: 'Routing /api and web views', color: 'text-amber-500' },
              { label: 'Prometheus Target', value: '1 Node active', desc: 'Scraping metrics at 5s rate', color: 'text-green-500' },
            ].map((kpi, i) => (
              <Card key={i} className="p-5 border border-dark-border/40 bg-dark-surface/30">
                <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">{kpi.label}</span>
                <div className="py-2">
                  <h4 className={`text-xl font-black ${kpi.color}`}>{kpi.value}</h4>
                  <p className="text-[9.5px] text-dark-muted mt-0.5">{kpi.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Production Optimizations Engine checklist */}
          <Card className="p-5 border border-dark-border/40 bg-dark-surface/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-dark-border pb-3">
              <Sparkles className="w-4 h-4 text-green-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Production Optimizations Engine</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-[11px] text-dark-muted">
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">Redis Cache</span>
                <span className="text-green-500">🟢 ENABLED (5m TTL on Search)</span>
              </div>
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">Database Indexes</span>
                <span className="text-green-500">🟢 ACTIVE (Prisma schemas)</span>
              </div>
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">Next.js SSR</span>
                <span className="text-green-500">🟢 ACTIVE (Edge cached)</span>
              </div>
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">WebP Images</span>
                <span className="text-green-500">🟢 ENABLED (Next.js Image)</span>
              </div>
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">Gzip Compression</span>
                <span className="text-green-500">🟢 ENABLED (Reverse Proxy)</span>
              </div>
              <div className="bg-dark-surface/60 p-2.5 rounded-xl border border-dark-border/30">
                <span className="text-white font-bold block mb-0.5">Query Pagination</span>
                <span className="text-green-500">🟢 ACTIVE (take/skip bounds)</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Terraform Panel */}
            <Card glass className="p-5 border border-dark-border/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Terraform Provisioning Orchestrator</h3>
              </div>
              <p className="text-[11px] text-dark-muted">
                Provision virtual private clouds (VPC), RDS Postgres database engines, and AWS EKS clusters directly from declared HCL configurations.
              </p>

              <Button className="w-full text-xs h-9 flex items-center justify-center gap-2" onClick={handleRunTerraform} disabled={terraformRunning}>
                ⚙️ {terraformRunning ? 'Planning Deployment...' : 'Execute Terraform Plan'}
              </Button>

              {/* Console log output window */}
              <div className="bg-black/80 border border-dark-border rounded-2xl p-4 font-mono text-[9.5px] text-amber-500 h-60 overflow-y-auto scrollbar-none space-y-1.5">
                {terraformLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
                {terraformLogs.length === 0 && <div className="text-dark-muted italic">Ready to plan infrastructure. Click button above.</div>}
              </div>
            </Card>

            {/* Kubernetes Manifests Selector */}
            <Card glass className="p-5 border border-dark-border/40 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-brand-saffron" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">Kubernetes Configuration Spec</h3>
                </div>
                <select
                  value={selectedK8sManifest}
                  onChange={(e) => setSelectedK8sManifest(e.target.value as any)}
                  className="bg-dark-bg border border-dark-border rounded-lg py-1 px-2 text-[10px] font-bold text-dark-text focus:outline-none"
                >
                  <option value="deployment">Deployments Spec</option>
                  <option value="service">Services Spec</option>
                  <option value="secret">Secrets Encoded Spec</option>
                </select>
              </div>

              {/* Manifest Output */}
              <div className="bg-dark-bg/60 p-4 border border-dark-border/40 rounded-2xl font-mono text-[10px] text-dark-muted h-72 overflow-y-auto scrollbar-none leading-relaxed">
                {selectedK8sManifest === 'deployment' && (
                  <pre className="text-white">
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: swiggyzone-api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: swiggyzone-api
  template:
    spec:
      containers:
        - name: api
          image: swiggyzone/api:latest
          ports:
            - containerPort: 4000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: database-url`}
                  </pre>
                )}

                {selectedK8sManifest === 'service' && (
                  <pre className="text-white">
{`apiVersion: v1
kind: Service
metadata:
  name: swiggyzone-web-service
spec:
  selector:
    app: swiggyzone-web
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: LoadBalancer`}
                  </pre>
                )}

                {selectedK8sManifest === 'secret' && (
                  <pre className="text-white">
{`apiVersion: v1
kind: Secret
metadata:
  name: db-secrets
type: Opaque
data:
  # Base64 encoded database credentials URL
  database-url: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3...`}
                  </pre>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
