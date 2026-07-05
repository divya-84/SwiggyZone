'use client';
import { API_BASE_URL } from '@/config';

import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { addToCart, clearCart } from '@/store/cartSlice';
import { Button, Card } from '@swiggyzone/ui';
import {
  Sparkles,
  Search,
  ShoppingBag,
  MapPin,
  Tag,
  Clock,
  History,
  CreditCard,
  Settings as SettingsIcon,
  Plus,
  Minus,
  Check,
  User as UserIcon,
  X,
  Sliders,
  DollarSign,
  Compass,
  ArrowRight,
  Receipt,
  RotateCcw,
  Bell,
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

function estimateNutritionAndDiet(dish: any) {
  const name = dish.name.toLowerCase();

  // Estimate values
  let calories = dish.calories || 250;
  let protein = dish.protein || 5;
  let carbs = dish.carbohydrates || 20;
  let fats = dish.fats || 8;

  // If not seeded, guess based on food keywords
  if (protein === 0 && fats === 0 && carbs === 0) {
    if (
      name.includes('chicken') ||
      name.includes('mutton') ||
      name.includes('fish') ||
      name.includes('meat')
    ) {
      protein = 28;
      carbs = 10;
      fats = 14;
      calories = calories || 380;
    } else if (name.includes('paneer') || name.includes('cheese') || name.includes('tikka')) {
      protein = 16;
      carbs = 8;
      fats = 18;
      calories = calories || 320;
    } else if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) {
      protein = 12;
      carbs = 65;
      fats = 12;
      calories = calories || 550;
    } else if (name.includes('roll') || name.includes('paratha') || name.includes('wrap')) {
      protein = 8;
      carbs = 45;
      fats = 10;
      calories = calories || 280;
    } else if (name.includes('burger') || name.includes('sandwich')) {
      protein = 14;
      carbs = 38;
      fats = 12;
      calories = calories || 340;
    } else if (name.includes('salad') || name.includes('healthy')) {
      protein = 6;
      carbs = 12;
      fats = 4;
      calories = calories || 120;
    }
  }

  // Calculate Health Score (1-100)
  let healthScore = 100 - fats * 2 - Math.max(0, (calories - 200) / 10) + protein * 1.5;
  healthScore = Math.max(10, Math.min(99, Math.round(healthScore)));

  // Determine Diet Compatibility
  let compatibility = 'Balanced Diet';
  if (fats / (protein + carbs + 0.1) > 1.2) {
    compatibility = 'Keto Friendly 🥩';
  } else if (protein >= 18) {
    compatibility = 'High Protein 💪';
  } else if (carbs <= 15) {
    compatibility = 'Low Carb 🥗';
  } else if (
    dish.isVeg &&
    !name.includes('paneer') &&
    !name.includes('cheese') &&
    !name.includes('egg') &&
    !name.includes('cream')
  ) {
    compatibility = 'Vegan Friendly 🌱';
  }

  return { calories, protein, carbs, fats, healthScore, compatibility };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Auth & Session
  const { isAuthenticated, user, accessToken } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = useSelector((state: RootState) => state.cart.total);

  // Layout Tab State
  const [activeTab, setActiveTab] = React.useState<
    'home' | 'search' | 'offers' | 'orders' | 'wallet' | 'settings'
  >('home');

  // Location State
  const [locationName, setLocationName] = React.useState('Indiranagar, Bangalore');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  'User-Agent': 'SwiggyZone-Food-Delivery-App',
                },
              },
            );
            if (response.ok) {
              const data = await response.json();
              const address = data.address;
              const suburb =
                address.suburb ||
                address.neighbourhood ||
                address.residential ||
                address.road ||
                '';
              const city = address.city || address.town || address.village || address.county || '';

              if (suburb && city) {
                setLocationName(`${suburb}, ${city}`);
              } else if (data.display_name) {
                const parts = data.display_name.split(',');
                const shortAddress = parts.slice(0, 2).join(',').trim();
                setLocationName(shortAddress);
              }
            } else {
              setLocationName(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            }
          } catch (err) {
            console.error('Failed to reverse geocode coordinates:', err);
            setLocationName(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.warn('Geolocation access denied or failed:', error.message);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  // Modal Customization State
  const [selectedDish, setSelectedDish] = React.useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = React.useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = React.useState<any[]>([]);

  // Search Tab State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [selectedCuisine, setSelectedCuisine] = React.useState<string | null>(null);
  const [priceFilter, setPriceFilter] = React.useState<number>(1000);
  const [ratingFilter, setRatingFilter] = React.useState<number>(0);

  // Wallet Simulation
  const [walletBalance, setWalletBalance] = React.useState(1250);
  const [walletAmountInput, setWalletAmountInput] = React.useState('');
  const [walletTransactions, setWalletTransactions] = React.useState([
    { id: '1', type: 'CREDIT', amount: 500, desc: 'Top-up via UPI', date: 'Today, 10:30 AM' },
    {
      id: '2',
      type: 'DEBIT',
      amount: 465,
      desc: 'Order at The Saffron Hub',
      date: 'Yesterday, 8:15 PM',
    },
    {
      id: '3',
      type: 'CREDIT',
      amount: 1000,
      desc: 'Sign-up Promotional Credit',
      date: '01 July, 2:00 PM',
    },
  ]);

  // Payment integration states
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<
    'STRIPE' | 'RAZORPAY' | 'COD' | 'WALLET'
  >('WALLET');
  const [paymentHistory, setPaymentHistory] = React.useState<any[]>([]);
  const [invoiceHtml, setInvoiceHtml] = React.useState<string | null>(null);
  const [invoiceOrderId, setInvoiceOrderId] = React.useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  // AI Vision States
  const [visionLoading, setVisionLoading] = React.useState(false);
  const [visionResults, setVisionResults] = React.useState<any | null>(null);

  // AI Reviews Analytics States
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [reviewsSummary, setReviewsSummary] = React.useState<any | null>(null);

  const handleImageVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setVisionLoading(true);
    setVisionResults(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/recognize-food`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVisionResults(data);
      }
    } catch (err) {
      console.error('Vision analysis upload failed', err);
    } finally {
      setVisionLoading(false);
    }
  };

  // Speech Recognition & Voice Commands States
  const [isListening, setIsListening] = React.useState(false);
  const [voiceLang, setVoiceLang] = React.useState<'en-US' | 'hi-IN' | 'es-ES'>('en-US');
  const [voiceError, setVoiceError] = React.useState<string | null>(null);

  const speakConfirmation = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceListening = () => {
    if (typeof window === 'undefined') return;
    setVoiceError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech Recognition is not supported by your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      setVoiceError(`Voice recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice Command Received:', transcript);

      // 1. Confirm / Checkout commands
      if (
        transcript.includes('confirm order') ||
        transcript.includes('checkout') ||
        transcript.includes('check out') ||
        transcript.includes('confirmar pedido') ||
        transcript.includes('order confirm')
      ) {
        speakConfirmation(
          voiceLang === 'hi-IN'
            ? 'सुरक्षित चेकआउट खोला जा रहा है'
            : voiceLang === 'es-ES'
              ? 'Abriendo el pago seguro'
              : 'Opening secure checkout window',
        );
        handleCheckoutTrigger();
        return;
      }

      // 2. Clear Cart commands
      if (
        transcript.includes('clear cart') ||
        transcript.includes('empty cart') ||
        transcript.includes('cart clear') ||
        transcript.includes('limpiar carrito')
      ) {
        dispatch(clearCart());
        speakConfirmation(
          voiceLang === 'hi-IN'
            ? 'आपका कार्ट खाली कर दिया गया है'
            : voiceLang === 'es-ES'
              ? 'Carrito limpiado'
              : 'Cleared your cart items',
        );
        return;
      }

      // 3. Add to Cart command matching
      const keywords = ['biryani', 'roll', 'burger', 'pizza', 'salad', 'tikka'];
      let matchedKeyword = '';
      for (const kw of keywords) {
        if (transcript.includes(kw)) {
          matchedKeyword = kw;
          break;
        }
      }

      if (matchedKeyword) {
        const allDishesList = [
          {
            id: 'dish-1',
            name: 'Special Saffron Chicken Biryani',
            price: 320,
            isVeg: false,
            calories: 680,
          },
          { id: 'dish-2', name: 'Paneer Tikka Roll', price: 180, isVeg: true, calories: 420 },
        ];

        const foundDish = allDishesList.find((d) => d.name.toLowerCase().includes(matchedKeyword));

        if (foundDish) {
          dispatch(
            addToCart({
              dish: {
                id: foundDish.id,
                restaurantId: 'rest-1',
                name: foundDish.name,
                description: 'Added via Voice Command',
                price: foundDish.price,
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400',
                dietaryTags: foundDish.isVeg ? ['Veg' as any] : ['Non-Veg' as any],
                nutritionalInfo: {
                  calories: foundDish.calories,
                  protein: 0,
                  carbohydrates: 0,
                  fats: 0,
                },
                isAvailable: true,
                isCustomizable: false,
              },
              quantity: 1,
              customizationNotes: `Voice Command Match: "${transcript}"`,
            }),
          );

          speakConfirmation(
            voiceLang === 'hi-IN'
              ? `${foundDish.name} को कार्ट में जोड़ दिया गया है`
              : voiceLang === 'es-ES'
                ? `Añadido ${foundDish.name} al carrito`
                : `Added ${foundDish.name} to your cart`,
          );
        } else {
          speakConfirmation(
            voiceLang === 'hi-IN'
              ? 'मुझे वह भोजन नहीं मिला'
              : voiceLang === 'es-ES'
                ? 'No encontré ese plato'
                : 'I could not find matching food items',
          );
        }
      } else {
        speakConfirmation(
          voiceLang === 'hi-IN'
            ? 'आदेश समझ में नहीं आया'
            : voiceLang === 'es-ES'
              ? 'Comando no reconocido'
              : 'Command not recognized. Try saying add chicken biryani.',
        );
      }
    };

    recognition.start();
  };

  // Notifications
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // AI Chat Assistant Widget
  const [showAiChat, setShowAiChat] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');
  const [aiMessages, setAiMessages] = React.useState<any[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your SwiggyZone AI Concierge. Ask me to find Biryani, meals under a specific budget, or allergen-free options!',
    },
  ]);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiRecommendations, setAiRecommendations] = React.useState<any[]>([]);

  // Order tracking & coordinates states
  const [trackingOrder, setTrackingOrder] = React.useState<any | null>(null);
  const [trackingStep, setTrackingStep] = React.useState(0);
  const [driverCoords, setDriverCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [weatherType, setWeatherType] = React.useState<'SUNNY' | 'RAINY' | 'COLD'>('SUNNY');
  const [recommendationsLoading, setRecommendationsLoading] = React.useState(false);

  // Dynamic Promotion Simulation State
  const [simDemand, setSimDemand] = React.useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [simWeather, setSimWeather] = React.useState<'SUNNY' | 'RAINY' | 'COLD' | 'HOT' | 'WINDY'>(
    'SUNNY',
  );
  const [simTraffic, setSimTraffic] = React.useState<'LOW' | 'MEDIUM' | 'HEAVY'>('LOW');
  const [simFestival, setSimFestival] = React.useState<
    'NONE' | 'DIWALI' | 'HOLI' | 'CHRISTMAS' | 'EID' | 'NEW_YEAR'
  >('NONE');
  const [simDistance, setSimDistance] = React.useState<number>(2.5);
  const [recommendedPromos, setRecommendedPromos] = React.useState<any[]>([]);
  const [promosLoading, setPromosLoading] = React.useState(false);
  const [appliedPromoCoupon, setAppliedPromoCoupon] = React.useState<any | null>(null);
  const [userAddressId, setUserAddressId] = React.useState<string>('addr-dummy-id');

  // Notification System States
  const [notifPrefs, setNotifPrefs] = React.useState<any>({
    push: true,
    email: true,
    sms: false,
    whatsapp: true,
    inApp: true,
  });
  const [selectedTemplate, setSelectedTemplate] = React.useState('ORDER_PLACED');
  const [selectedChannels, setSelectedChannels] = React.useState<string[]>(['push', 'inApp']);
  const [queueLogs, setQueueLogs] = React.useState<string[]>([]);
  const [queueJobs, setQueueJobs] = React.useState<any[]>([]);

  const loadNotifPreferences = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifPrefs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePref = async (channel: string, value: boolean) => {
    if (!accessToken) return;
    const nextPrefs = { ...notifPrefs, [channel]: value };
    setNotifPrefs(nextPrefs);
    try {
      await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(nextPrefs),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadQueueStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/queue/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueueJobs(data.jobs || []);
        setQueueLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTestNotif = async () => {
    if (!accessToken) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          channels: selectedChannels,
        }),
      });
      await loadQueueStatus();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'settings' && isAuthenticated) {
      loadNotifPreferences();
      loadQueueStatus();

      const interval = setInterval(() => {
        loadQueueStatus();
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [activeTab, isAuthenticated]);

  // Loyalty System States
  const [loyaltyProfile, setLoyaltyProfile] = React.useState<any>(null);
  const [simOrderAmount, setSimOrderAmount] = React.useState('500');
  const [referralInput, setReferralInput] = React.useState('');
  const [loyaltySuccess, setLoyaltySuccess] = React.useState<string | null>(null);
  const [loyaltyError, setLoyaltyError] = React.useState<string | null>(null);

  const loadLoyaltyProfile = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfile(data);
        setWalletBalance(data.walletBalance);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLoyaltyFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const amount = parseFloat(walletAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/wallet/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfile(data);
        setWalletBalance(data.walletBalance);
        setWalletAmountInput('');
        setLoyaltySuccess(`Successfully topped up ₹${amount.toFixed(2)} to wallet.`);
        setTimeout(() => setLoyaltySuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rewardId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfile(data);
        setWalletBalance(data.walletBalance);
        setLoyaltySuccess('Reward claimed and applied successfully!');
        setTimeout(() => setLoyaltySuccess(null), 3000);
      } else {
        const errData = await res.json();
        setLoyaltyError(errData.message || 'Failed to claim reward');
        setTimeout(() => setLoyaltyError(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeemReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !referralInput) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/referral/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: referralInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfile(data);
        setWalletBalance(data.walletBalance);
        setReferralInput('');
        setLoyaltySuccess('Referral invitation code redeemed! ₹100 added to your wallet.');
        setTimeout(() => setLoyaltySuccess(null), 4000);
      } else {
        const errData = await res.json();
        setLoyaltyError(errData.message || 'Invalid referral code');
        setTimeout(() => setLoyaltyError(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatePointsCashback = async () => {
    if (!accessToken) return;
    const amount = parseFloat(simOrderAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/loyalty/simulate/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfile(data);
        setWalletBalance(data.walletBalance);
        setLoyaltySuccess(
          `Simulated order checkout. Earned ${Math.round(data.points - loyaltyProfile.points)} points and cashback!`,
        );
        setTimeout(() => setLoyaltySuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'wallet' && isAuthenticated) {
      loadLoyaltyProfile();
    }
  }, [activeTab, isAuthenticated]);

  const cartSubtotal = React.useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  }, [cartItems]);

  const appliedDiscount = React.useMemo(() => {
    if (!appliedPromoCoupon) return 0;
    if (appliedPromoCoupon.discountType === 'PERCENTAGE') {
      const calculated = (cartSubtotal * appliedPromoCoupon.discountValue) / 100;
      return appliedPromoCoupon.maxDiscount
        ? Math.min(calculated, appliedPromoCoupon.maxDiscount)
        : calculated;
    }
    return appliedPromoCoupon.discountValue;
  }, [appliedPromoCoupon, cartSubtotal]);

  const finalCartTotal = React.useMemo(() => {
    if (cartItems.length === 0) return 0;
    const deliveryFee = 40;
    const tax = parseFloat((cartSubtotal * 0.05).toFixed(2));
    return parseFloat((cartSubtotal + deliveryFee + tax - appliedDiscount).toFixed(2));
  }, [cartItems, cartSubtotal, appliedDiscount]);

  const loadRecommendations = async (weather: string) => {
    if (!isAuthenticated || !accessToken) return;
    setRecommendationsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations?weather=${weather}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to load personalized recommendations', err);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadPromoRecommendations = async () => {
    if (!isAuthenticated || !accessToken) return;
    setPromosLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/recommendations/promotions?demand=${simDemand}&weather=${simWeather}&traffic=${simTraffic}&festival=${simFestival}&distanceKm=${simDistance}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setRecommendedPromos(data.promotions || []);
        setUserAddressId(data.defaultAddressId || 'addr-dummy-id');
      }
    } catch (err) {
      console.error('Failed to load promo recommendations', err);
    } finally {
      setPromosLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadRecommendations(weatherType);
    }
  }, [isAuthenticated, accessToken, weatherType]);

  React.useEffect(() => {
    if (activeTab === 'offers' && isAuthenticated) {
      loadPromoRecommendations();
    }
  }, [activeTab, isAuthenticated, simDemand, simWeather, simTraffic, simFestival, simDistance]);

  // Socket reference
  const socketRef = React.useRef<any>(null);

  // Mock Restaurants & Menu details
  const [restaurants, setRestaurants] = React.useState<any[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = React.useState(true);
  const [selectedRestDetails, setSelectedRestDetails] = React.useState<any | null>(null);

  // Establish Socket.io Connection
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(API_BASE_URL, {
      query: { userId: user.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to SwiggyZone WebSocket Gateway');
    });

    socket.on('notification', (newNotif: any) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Handle Order room joining and location movement listeners
  React.useEffect(() => {
    if (!socketRef.current || !trackingOrder) return;

    const socket = socketRef.current;
    socket.emit('joinOrderRoom', { orderId: trackingOrder.id });

    socket.on('orderStatusUpdate', (data: { orderId: string; status: string; eta: string }) => {
      if (data.orderId === trackingOrder.id) {
        const statusMap: Record<string, number> = {
          PLACED: 0,
          PENDING: 0,
          ACCEPTED: 1,
          COOKING: 1,
          PREPARING: 1,
          READY: 2,
          PICKED_UP: 3,
          DELIVERED: 4,
          CANCELLED: 5,
        };
        const step = statusMap[data.status] ?? 0;
        setTrackingStep(step);
      }
    });

    socket.on(
      'driverLocationUpdate',
      (coords: { orderId: string; latitude: number; longitude: number }) => {
        if (coords.orderId === trackingOrder.id) {
          setDriverCoords({ lat: coords.latitude, lng: coords.longitude });
        }
      },
    );

    return () => {
      socket.off('orderStatusUpdate');
      socket.off('driverLocationUpdate');
    };
  }, [trackingOrder]);

  // Simulate rider coordinate updates for demo maps
  React.useEffect(() => {
    if (!trackingOrder || trackingStep < 3 || trackingStep >= 4 || !socketRef.current) return;

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      const progress = index / 10;
      const lat = 12.9723 - progress * 0.0008;
      const lng = 77.6418 - progress * 0.0016;

      socketRef.current.emit('updateDriverLocation', {
        orderId: trackingOrder.id,
        latitude: lat,
        longitude: lng,
        driverId: 'rider-amit',
      });

      if (index >= 10) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [trackingOrder, trackingStep]);

  // Fetch Restaurants & Sync
  React.useEffect(() => {
    const loadRestaurants = async () => {
      setRestaurantsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search`);
        if (res.ok) {
          const data = await res.json();
          setRestaurants(data);
        } else {
          setRestaurants([
            {
              id: 'rest-1',
              name: 'The Saffron Hub',
              description: 'Gourmet North Indian Cuisine & Biryani',
              coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
              rating: 4.8,
              deliveryTimeMinutes: 25,
              costForTwo: 400,
              isActive: true,
              cuisines: ['Biryani', 'North Indian'],
              latitude: 12.9723,
              longitude: 77.6418,
            },
            {
              id: 'rest-2',
              name: 'Burger Craft',
              description: 'Gourmet American Burgers',
              coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
              rating: 4.6,
              deliveryTimeMinutes: 18,
              costForTwo: 300,
              isActive: true,
              cuisines: ['Burger', 'Healthy Salad'],
              latitude: 12.9715,
              longitude: 77.6402,
            },
          ]);
        }
      } catch {
        setRestaurants([
          {
            id: 'rest-1',
            name: 'The Saffron Hub',
            description: 'Gourmet North Indian Cuisine & Biryani',
            coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
            rating: 4.8,
            deliveryTimeMinutes: 25,
            costForTwo: 400,
            isActive: true,
            cuisines: ['Biryani', 'North Indian'],
          },
          {
            id: 'rest-2',
            name: 'Burger Craft',
            description: 'Gourmet American Burgers',
            coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
            rating: 4.6,
            deliveryTimeMinutes: 18,
            costForTwo: 300,
            isActive: true,
            cuisines: ['Burger'],
          },
        ]);
      } finally {
        setRestaurantsLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  // Fetch payment logs from API
  const fetchPaymentLogs = async () => {
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const logs = await res.json();
        setPaymentHistory(logs);
      }
    } catch (err) {
      console.error('Failed fetching payment history', err);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'wallet' || activeTab === 'settings') {
      fetchPaymentLogs();
    }
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [activeTab, isAuthenticated, accessToken]);

  const handleMarkNotificationRead = async (id: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch suggestions on Autocomplete query change
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/autocomplete?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Execute Search
  const triggerSearch = async (cuisine?: string) => {
    setSearchLoading(true);
    try {
      const q = searchQuery || '';
      let url = `${API_BASE_URL}/api/search?q=${q}&maxPrice=${priceFilter}&rating=${ratingFilter}`;
      if (cuisine) {
        url += `&q=${cuisine}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults(restaurants.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())));
      }
    } catch {
      setSearchResults(restaurants);
    } finally {
      setSearchLoading(false);
    }
  };

  // Open Restaurant Details View
  const handleOpenRestaurant = async (rest: any) => {
    setSelectedRestDetails(rest);
    setReviewsSummary(null);
    setReviewsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/search/restaurants/${rest.id}/reviews/summary`);
      if (res.ok) {
        const data = await res.json();
        setReviewsSummary(data);
      }
    } catch (err) {
      console.error('Failed to load reviews summary', err);
    } finally {
      setReviewsLoading(false);
    }

    rest.menuCategories = [
      {
        id: 'cat-1',
        name: 'Biryanis',
        items: [
          {
            id: 'dish-1',
            name: 'Special Saffron Chicken Biryani',
            description: 'Fragrant basmati rice layered with juicy chicken and secret spices.',
            price: 320,
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400',
            isVeg: false,
            calories: 680,
            isAvailable: true,
            variants: [
              { id: 'v1', name: 'Half Portion', priceDelta: 0 },
              { id: 'v2', name: 'Full Portion', priceDelta: 100 },
            ],
            addons: [
              { id: 'a1', name: 'Extra Salan & Raita', price: 20, categoryName: 'Sides' },
              { id: 'a2', name: 'Double Masala Egg', price: 30, categoryName: 'Add-ons' },
            ],
          },
        ],
      },
      {
        id: 'cat-2',
        name: 'Starters',
        items: [
          {
            id: 'dish-2',
            name: 'Paneer Tikka Roll',
            description: 'Grilled cottage cheese wrapped in a paratha with mint sauce.',
            price: 180,
            image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?q=80&w=400',
            isVeg: true,
            calories: 420,
            isAvailable: true,
            variants: [],
            addons: [{ id: 'a3', name: 'Extra Cheese Slice', price: 30, categoryName: 'Add-ons' }],
          },
        ],
      },
    ];
  };

  // Customization Handlers
  const handleAddDishClick = (dish: any) => {
    setSelectedDish(dish);
    if (dish.variants && dish.variants.length > 0) {
      setSelectedVariant(dish.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setSelectedAddons([]);
  };

  const handleToggleAddon = (addon: any) => {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirmCustomization = () => {
    if (!selectedDish) return;

    const basePrice = selectedDish.price;
    const variantPriceDelta = selectedVariant ? selectedVariant.priceDelta : 0;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const finalUnitPrice = basePrice + variantPriceDelta + addonsPrice;

    const customNotes = [
      selectedVariant ? `Size: ${selectedVariant.name}` : '',
      selectedAddons.length > 0 ? `Add-ons: ${selectedAddons.map((a) => a.name).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    dispatch(
      addToCart({
        dish: {
          ...selectedDish,
          price: finalUnitPrice,
        },
        quantity: 1,
        customizationNotes: customNotes,
      }),
    );

    setSelectedDish(null);
  };

  // Submit checkout order to backend API
  const handleCheckoutTrigger = async () => {
    if (cartItems.length === 0) return;

    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          restaurantId: selectedRestDetails?.id || 'rest-1',
          addressId: userAddressId,
          notes: 'Standard Delivery',
          items: cartItems.map((i) => ({
            menuItemId: i.dish.id,
            quantity: i.quantity,
          })),
          couponCode: appliedPromoCoupon?.code || null,
        }),
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.message || 'Failed placing order');
      }

      setCheckoutOrderId(orderData.id);
      setShowPaymentModal(true);
      fetchNotifications();
    } catch (err: any) {
      const fallbackOrderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
      setCheckoutOrderId(fallbackOrderId);
      setShowPaymentModal(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Confirm payment selection and call backend API
  const handleConfirmPayment = async () => {
    if (!checkoutOrderId) return;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      if (paymentMethod === 'WALLET' && walletBalance < finalCartTotal) {
        throw new Error('Insufficient wallet balance to cover the order');
      }

      if (accessToken) {
        const response = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orderId: checkoutOrderId, method: paymentMethod }),
        });

        if (response.ok) {
          const result = await response.json();
          if (paymentMethod === 'WALLET') {
            setWalletBalance((prev) => prev - finalCartTotal);
            setWalletTransactions([
              {
                id: `txn-${Date.now()}`,
                type: 'DEBIT',
                amount: finalCartTotal,
                desc: `Order #${checkoutOrderId} payment`,
                date: 'Just now',
              },
              ...walletTransactions,
            ]);
          }

          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return;
          }
        }
      }

      const mockOrder = {
        id: checkoutOrderId,
        restaurantName: selectedRestDetails ? selectedRestDetails.name : 'The Saffron Hub',
        total: finalCartTotal,
        status: 'PLACED',
        items: cartItems,
        eta: '25 mins',
      };

      setTrackingOrder(mockOrder);
      setTrackingStep(0);
      setDriverCoords(null);
      dispatch(clearCart());
      setShowPaymentModal(false);
      setActiveTab('orders');

      // Simulate order lifecycle statuses transitions and emit over ws
      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        if (socketRef.current) {
          socketRef.current.emit('updateDriverLocation', {
            orderId: mockOrder.id,
            latitude: 12.9723 - step * 0.0001,
            longitude: 77.6418 - step * 0.0002,
            driverId: 'rider-amit',
          });
        }
        setTrackingStep(step);
        fetchNotifications();
        if (step >= 5) {
          clearInterval(interval);
        }
      }, 6000);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Process refund triggers
  const handleRefundTrigger = async (paymentId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to cancel the order and request a refund?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/refund/${paymentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        alert('Refund processed successfully to your source payment method!');
        fetchPaymentLogs();
        fetchNotifications();
        if (trackingOrder) {
          setTrackingOrder(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Invoice HTML frame
  const handleOpenInvoice = (orderId: string) => {
    setInvoiceOrderId(orderId);
    setInvoiceHtml(`${API_BASE_URL}/api/payments/invoice/${orderId}`);
  };

  // Wallet Add Actions
  const handleAddWalletMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(walletAmountInput);
    if (isNaN(amt) || amt <= 0) return;

    setWalletBalance((prev) => prev + amt);
    setWalletTransactions([
      {
        id: `txn-${Date.now()}`,
        type: 'CREDIT',
        amount: amt,
        desc: 'Added funds via Net Banking',
        date: 'Just now',
      },
      ...walletTransactions,
    ]);
    setWalletAmountInput('');
  };

  // Send message to AI assistant
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !accessToken) return;

    const userText = aiInput;
    setAiInput('');
    setAiMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt: userText }),
      });

      if (res.ok) {
        const data = await res.json();
        // Render streaming effect (wow factor)
        simulateStreamingText(data.message, data.recommendations);
      }
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Error connecting to AI engine.' },
      ]);
      setAiLoading(false);
    }
  };

  // Typing streaming simulation render
  const simulateStreamingText = (fullText: string, recommendations: any[]) => {
    let index = 0;
    const placeholderMsgIndex = aiMessages.length + 1; // position of new message

    // Create a blank response entry
    setAiMessages((prev) => [...prev, { sender: 'assistant', text: '' }]);

    const interval = setInterval(() => {
      index += 5; // render 5 chars at a time for fast streaming feel
      const slice = fullText.slice(0, index);

      setAiMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { sender: 'assistant', text: slice };
        return copy;
      });

      if (index >= fullText.length) {
        clearInterval(interval);
        setAiRecommendations(recommendations || []);
        setAiLoading(false);
      }
    }, 15);
  };

  // Clear AI session memory
  const handleClearAiMemory = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/memory`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setAiMessages([
          {
            sender: 'assistant',
            text: 'AI Memory reset completed. Ask me to find dishes matching your budget or preferences!',
          },
        ]);
        setAiRecommendations([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action Add Recommended Dish
  const handleAddRecommendedDish = (dish: any) => {
    dispatch(
      addToCart({
        dish: {
          id: dish.id,
          restaurantId: dish.restaurantId || 'rest-1',
          name: dish.name,
          description: dish.description || '',
          price: dish.price,
          image:
            dish.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400',
          dietaryTags: dish.isVeg ? ['Veg' as any] : ['Non-Veg' as any],
          nutritionalInfo: {
            calories: dish.calories || 0,
            protein: 0,
            carbohydrates: 0,
            fats: 0,
          },
          isAvailable: true,
          isCustomizable: false,
        },
        quantity: 1,
        customizationNotes: 'AI Recommendation Match',
      }),
    );
  };

  // Quick Action Add Promo Item
  const handleAddPromoItem = (promo: any) => {
    dispatch(
      addToCart({
        dish: {
          id: promo.discountedItemId,
          restaurantId: promo.restaurantId || 'rest-1',
          name: promo.discountedItemName,
          description: promo.description || '',
          price: promo.discountedItemPrice,
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400',
          dietaryTags: ['Non-Veg' as any],
          nutritionalInfo: {
            calories: 680,
            protein: 32,
            carbohydrates: 85,
            fats: 22,
          },
          isAvailable: true,
          isCustomizable: false,
        },
        quantity: 1,
        customizationNotes: 'Promo Stock Clearance Deal',
      }),
    );
    // Apply coupon
    setAppliedPromoCoupon(promo);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col pb-24 md:pb-0 md:pl-20">
      {/* Sidebar Navigation for Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-dark-surface border-r border-dark-border hidden md:flex flex-col items-center py-6 justify-between z-40">
        <div className="flex flex-col items-center gap-8">
          <div
            className="bg-brand-saffron text-white p-3 rounded-xl shadow-lg shadow-brand-saffron/20 cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <nav className="flex flex-col gap-6">
            {[
              { id: 'home', icon: Compass, label: 'Explore' },
              { id: 'search', icon: Search, label: 'Search' },
              { id: 'offers', icon: Tag, label: 'Offers' },
              { id: 'orders', icon: History, label: 'Timeline' },
              { id: 'wallet', icon: CreditCard, label: 'Wallet' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedRestDetails(null);
                }}
                className={`p-3 rounded-xl transition-all duration-300 relative group ${
                  activeTab === tab.id
                    ? 'bg-brand-saffron/10 text-brand-saffron border border-brand-saffron/20'
                    : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="absolute left-24 bg-dark-surface border border-dark-border text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
        <button
          onClick={() => {
            setActiveTab('settings');
            setSelectedRestDetails(null);
          }}
          className={`p-3 rounded-xl transition-all duration-300 ${
            activeTab === 'settings'
              ? 'bg-brand-saffron/10 text-brand-saffron border border-brand-saffron/20'
              : 'text-dark-muted hover:text-dark-text'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </aside>

      {/* Top Header */}
      <header className="bg-dark-surface/30 backdrop-blur-md sticky top-0 border-b border-dark-border py-4 px-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div
            className="bg-brand-saffron text-white p-2 rounded-xl cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-sm font-black tracking-wider uppercase text-brand-saffron select-none">
            SwiggyZone
          </span>
          <span className="text-dark-border select-none">|</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider">
              Delivery Location
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-brand-saffron" />
              <span>{locationName}</span>
            </div>
          </div>
        </div>

        {/* Header alert widgets */}
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  fetchNotifications();
                }}
                className="p-2 border border-dark-border rounded-xl text-dark-muted hover:text-dark-text relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-saffron rounded-full ring-2 ring-dark-surface" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-fadeIn max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-dark-border pb-2">
                    <span className="text-xs font-bold text-dark-text">Recent Alerts</span>
                    <button
                      className="text-[10px] text-brand-saffron hover:underline"
                      onClick={() => setShowNotifications(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="space-y-3.5 divide-y divide-dark-border/40">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="pt-2 text-xs flex justify-between items-start gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-dark-text flex items-center gap-1">
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 bg-brand-saffron rounded-full shrink-0" />
                              )}
                              {n.title}
                            </div>
                            <div className="text-[11px] text-dark-muted">{n.content}</div>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkNotificationRead(n.id)}
                              className="text-[9px] text-brand-saffron font-bold hover:underline"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[10px] text-dark-muted">
                      No notifications yet
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && user ? (
            <div
              className="flex items-center gap-2 bg-dark-surface/50 border border-dark-border py-1.5 px-3 rounded-xl cursor-pointer"
              onClick={() => setActiveTab('settings')}
            >
              <div className="w-6 h-6 bg-brand-saffron/10 text-brand-saffron rounded-full flex items-center justify-center font-bold text-xs">
                {user.firstName[0]}
              </div>
              <span className="text-xs font-bold hidden sm:inline">{user.firstName}</span>
            </div>
          ) : (
            <Button size="sm" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        {/* TAB 1: EXPLORE */}
        {activeTab === 'home' && !selectedRestDetails && (
          <div className="space-y-8 animate-fadeIn">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-saffron/20 to-brand-orange/5 border border-brand-saffron/10 p-6 md:p-10 flex flex-col justify-center min-h-[180px]">
              <div className="space-y-3 max-w-md">
                <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Welcome to SwiggyZone
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Free Deliveries and Smart AI Customizations.
                </h2>
                <p className="text-xs text-dark-muted">
                  Use coupon code <strong className="text-brand-saffron">FREEDEL</strong> to cover
                  delivery fees on orders above ₹200.
                </p>
              </div>
            </div>

            {/* AI Smart Recommendations Section */}
            {isAuthenticated && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-saffron animate-pulse" />
                      Smart AI Recommendations
                    </h3>
                    <p className="text-[10px] text-dark-muted">
                      Dishes personalized for your history, current time, and weather.
                    </p>
                  </div>
                  <div className="flex gap-1.5 bg-dark-surface p-1 rounded-xl border border-dark-border">
                    {(['SUNNY', 'RAINY', 'COLD'] as const).map((wt) => (
                      <button
                        key={wt}
                        onClick={() => setWeatherType(wt)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                          weatherType === wt
                            ? 'bg-brand-saffron text-white shadow-sm'
                            : 'text-dark-muted hover:text-dark-text'
                        }`}
                      >
                        {wt === 'SUNNY' && '☀️ Sunny'}
                        {wt === 'RAINY' && '🌧️ Rainy'}
                        {wt === 'COLD' && '❄️ Cold'}
                      </button>
                    ))}
                  </div>
                </div>

                {recommendationsLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="min-w-[200px] h-28 bg-dark-surface/50 border border-dark-border/40 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {recommendations.map((item) => (
                      <div
                        key={item.id}
                        className="min-w-[220px] bg-dark-surface border border-dark-border hover:border-brand-saffron/20 rounded-2xl p-3.5 flex flex-col justify-between gap-3 text-xs shrink-0 bg-dark-surface/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="bg-brand-saffron/10 text-brand-saffron text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Score: {item.score}
                            </span>
                            <span className="text-[9px] text-dark-muted font-semibold">
                              {item.distanceKm} km
                            </span>
                          </div>
                          <h4 className="font-extrabold text-dark-text truncate">{item.name}</h4>
                          <div className="text-[10px] text-dark-muted truncate">
                            Store: {item.restaurantName}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-saffron">₹{item.price}</span>
                          <Button
                            size="sm"
                            className="text-[9px] px-2 py-0.5 h-6"
                            onClick={() => handleAddRecommendedDish(item)}
                          >
                            Add +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-dark-muted border border-dashed border-dark-border rounded-2xl bg-dark-surface/10">
                    Order some dishes first to activate personalized history matching!
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-dark-muted uppercase tracking-wider">
                What&apos;s on your mind?
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {[
                  {
                    name: 'Biryani',
                    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=150',
                  },
                  {
                    name: 'Burger',
                    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=150',
                  },
                  {
                    name: 'Pizza',
                    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=150',
                  },
                  {
                    name: 'Healthy Salad',
                    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=150',
                  },
                  {
                    name: 'Desserts',
                    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=150',
                  },
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setActiveTab('search');
                      setSearchQuery(c.name);
                      triggerSearch(c.name);
                    }}
                    className="flex flex-col items-center gap-2 min-w-[70px] group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-dark-border group-hover:border-brand-saffron transition-all duration-300">
                      <img
                        src={c.img}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-dark-muted group-hover:text-dark-text transition-colors">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Top Restaurant Chains in Bangalore</h3>
              {restaurantsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-dark-surface border border-dark-border h-48 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {restaurants.map((rest) => (
                    <Card
                      key={rest.id}
                      className="cursor-pointer overflow-hidden flex flex-col sm:flex-row gap-4 p-4 items-center bg-dark-surface/40 hover:bg-dark-surface/70 border border-dark-border/40 hover:border-brand-saffron/20 transition-all duration-300"
                      onClick={() => handleOpenRestaurant(rest)}
                    >
                      <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-dark-bg shrink-0">
                        <img
                          src={rest.coverImage}
                          alt={rest.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex justify-between items-start flex-col sm:flex-row">
                          <h4 className="font-extrabold text-base">{rest.name}</h4>
                          <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 sm:mt-0">
                            ★ {rest.rating}
                          </span>
                        </div>
                        <p className="text-xs text-dark-muted line-clamp-1">{rest.description}</p>
                        <div className="flex gap-4 text-xs font-semibold text-dark-muted justify-center sm:justify-start">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-saffron" />
                            <span>{rest.deliveryTimeMinutes} mins</span>
                          </div>
                          <span>•</span>
                          <span>₹{rest.costForTwo} for two</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1 DETAIL: RESTAURANT VIEW */}
        {activeTab === 'home' && selectedRestDetails && (
          <div className="space-y-6 animate-fadeIn">
            <Button size="sm" variant="secondary" onClick={() => setSelectedRestDetails(null)}>
              ← Back to restaurants
            </Button>

            <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 bg-dark-surface border border-dark-border flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                <img
                  src={selectedRestDetails.coverImage}
                  alt={selectedRestDetails.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center md:text-left flex-1">
                <h2 className="text-2xl font-extrabold">{selectedRestDetails.name}</h2>
                <p className="text-xs text-dark-muted">{selectedRestDetails.description}</p>
                <div className="flex items-center gap-6 justify-center md:justify-start text-xs font-bold text-dark-text mt-3">
                  <span className="bg-brand-saffron/10 text-brand-saffron px-2 py-1 rounded-md">
                    ★ {selectedRestDetails.rating}
                  </span>
                  <span>{selectedRestDetails.deliveryTimeMinutes} mins</span>
                  <span>₹{selectedRestDetails.costForTwo} for two</span>
                </div>
              </div>
            </div>

            {/* AI Reviews Summary & Insights Panel */}
            {reviewsLoading && (
              <div className="p-4 bg-dark-surface/50 border border-dark-border rounded-3xl animate-pulse text-xs text-dark-muted text-center">
                🤖 AI is analyzing customer reviews and generating sentiment insights...
              </div>
            )}

            {!reviewsLoading && reviewsSummary && (
              <Card
                glass
                className="p-5 border border-brand-saffron/20 space-y-5 rounded-3xl animate-fadeIn"
              >
                <div className="flex items-center gap-2 border-b border-dark-border/40 pb-3">
                  <Sparkles className="w-5 h-5 text-brand-saffron animate-pulse" />
                  <div>
                    <h3 className="text-xs font-black text-dark-text uppercase tracking-wider">
                      AI Reviews Summary & Sentiment Insights
                    </h3>
                    <p className="text-[10px] text-dark-muted">
                      Aggregated from {reviewsSummary.totalReviews} reviews
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sentiments progress bars */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Customer Sentiment Distribution
                    </h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-green-500">Positive</span>
                          <span>{reviewsSummary.sentiments.positive}%</span>
                        </div>
                        <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${reviewsSummary.sentiments.positive}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-yellow-500">Neutral</span>
                          <span>{reviewsSummary.sentiments.neutral}%</span>
                        </div>
                        <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full rounded-full"
                            style={{ width: `${reviewsSummary.sentiments.neutral}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-red-500">Negative</span>
                          <span>{reviewsSummary.sentiments.negative}%</span>
                        </div>
                        <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full"
                            style={{ width: `${reviewsSummary.sentiments.negative}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topic Scores */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Feature Rating Scores
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                      <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40 flex justify-between items-center">
                        <span className="text-dark-muted">👅 Taste</span>
                        <span className="text-brand-saffron">{reviewsSummary.topics.taste}/10</span>
                      </div>
                      <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40 flex justify-between items-center">
                        <span className="text-dark-muted">📦 Packaging</span>
                        <span className="text-brand-saffron">
                          {reviewsSummary.topics.packaging}/10
                        </span>
                      </div>
                      <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40 flex justify-between items-center">
                        <span className="text-dark-muted">🚴 Delivery</span>
                        <span className="text-brand-saffron">
                          {reviewsSummary.topics.delivery}/10
                        </span>
                      </div>
                      <div className="bg-dark-bg/60 p-2.5 rounded-xl border border-dark-border/40 flex justify-between items-center">
                        <span className="text-dark-muted">💵 Price</span>
                        <span className="text-brand-saffron">{reviewsSummary.topics.price}/10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI generated Insights list */}
                <div className="space-y-2 border-t border-dark-border/40 pt-4">
                  <h4 className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                    Key Takeaways & AI Recommendations
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-dark-text leading-relaxed">
                    {reviewsSummary.insights.map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            <div className="space-y-8 pt-4">
              {selectedRestDetails.menuCategories?.map((cat: any) => (
                <div key={cat.id} className="space-y-4">
                  <h3 className="text-lg font-extrabold border-b border-dark-border pb-2">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.items.map((dish: any) => (
                      <Card
                        key={dish.id}
                        className="p-4 flex justify-between gap-4 bg-dark-surface/20 border-dark-border/40"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${dish.isVeg ? 'border-green-600' : 'border-red-600'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-600' : 'bg-red-600'}`}
                              />
                            </span>
                            <span className="text-[10px] text-dark-muted font-semibold">
                              {dish.calories} kcal
                            </span>
                          </div>
                          <h4 className="font-bold text-sm">{dish.name}</h4>
                          <div className="text-xs font-extrabold text-brand-saffron">
                            ₹{dish.price}
                          </div>
                          <p className="text-[11px] text-dark-muted line-clamp-2">
                            {dish.description}
                          </p>

                          {/* Dynamic Nutrition Stats Grid */}
                          {(() => {
                            const nu = estimateNutritionAndDiet(dish);
                            return (
                              <div className="pt-2.5 space-y-2">
                                <div className="flex gap-2 flex-wrap text-[9px] font-bold">
                                  <span className="bg-green-600/10 text-green-500 border border-green-500/10 px-1.5 py-0.5 rounded">
                                    Health Score: {nu.healthScore}/100
                                  </span>
                                  <span className="bg-brand-saffron/10 text-brand-saffron border border-brand-saffron/10 px-1.5 py-0.5 rounded">
                                    {nu.compatibility}
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1 text-[8px] font-extrabold text-dark-muted text-center max-w-[210px]">
                                  <div className="bg-dark-bg/60 p-1.5 rounded border border-dark-border/40">
                                    <div className="text-dark-text font-black">{nu.calories}</div>
                                    <div className="text-[5px] uppercase tracking-wider text-dark-muted opacity-60">
                                      Cal
                                    </div>
                                  </div>
                                  <div className="bg-dark-bg/60 p-1.5 rounded border border-dark-border/40">
                                    <div className="text-dark-text font-black">{nu.protein}g</div>
                                    <div className="text-[5px] uppercase tracking-wider text-dark-muted opacity-60">
                                      Prot
                                    </div>
                                  </div>
                                  <div className="bg-dark-bg/60 p-1.5 rounded border border-dark-border/40">
                                    <div className="text-dark-text font-black">{nu.carbs}g</div>
                                    <div className="text-[5px] uppercase tracking-wider text-dark-muted opacity-60">
                                      Carb
                                    </div>
                                  </div>
                                  <div className="bg-dark-bg/60 p-1.5 rounded border border-dark-border/40">
                                    <div className="text-dark-text font-black">{nu.fats}g</div>
                                    <div className="text-[5px] uppercase tracking-wider text-dark-muted opacity-60">
                                      Fat
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex flex-col items-center shrink-0 gap-2">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-bg border border-dark-border">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full text-xs py-1"
                            onClick={() => handleAddDishClick(dish)}
                          >
                            + Add Item
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold">Search Food & Restaurants</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search for restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') triggerSearch();
                  }}
                  className="w-full bg-dark-surface border border-dark-border rounded-xl py-3 pl-10 pr-12 text-xs focus:outline-none focus:border-brand-saffron"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-dark-muted" />
                <label
                  className="absolute right-3.5 top-2.5 p-1 text-dark-muted hover:text-brand-saffron transition-colors cursor-pointer"
                  title="Search by Food Image"
                >
                  📸
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageVisionUpload}
                  />
                </label>
              </div>
              <Button
                className="flex items-center justify-center gap-1.5"
                onClick={() => triggerSearch()}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>

            {/* Vision AI loading skeleton */}
            {visionLoading && (
              <div className="p-4 bg-dark-surface/50 border border-dark-border rounded-2xl animate-pulse text-xs text-dark-muted text-center">
                🤖 AI Vision is recognizing your dish...
              </div>
            )}

            {/* Vision AI Identification Results Cards */}
            {visionResults && (
              <Card glass className="p-5 border border-brand-saffron/20 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-start border-b border-dark-border pb-3 flex-wrap gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-brand-saffron uppercase bg-brand-saffron/10 px-2 py-0.5 rounded">
                      Confidence: {visionResults.confidence}%
                    </span>
                    <h3 className="text-sm font-extrabold mt-1">
                      Identified:{' '}
                      <span className="text-brand-saffron">{visionResults.recognizedFood}</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-dark-muted font-bold">Est. Market Price</div>
                    <div className="text-xs font-black text-green-500">
                      ₹{visionResults.estimatedPrice?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                    Restaurants serving matching dish
                  </h4>
                  {visionResults.recommendations?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visionResults.recommendations.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-dark-surface/50 border border-dark-border rounded-xl flex justify-between items-center text-xs gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-dark-text truncate max-w-[150px]">
                              {item.restaurantName}
                            </div>
                            <div className="text-[10px] text-dark-muted">Price: ₹{item.price}</div>
                          </div>
                          <Button
                            size="sm"
                            className="text-[9px] px-2.5 py-0.5 h-6"
                            onClick={() => handleAddRecommendedDish(item)}
                          >
                            Order
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-dark-muted">
                      No database outlets found serving this recognized dish.
                    </div>
                  )}
                </div>
              </Card>
            )}

            {suggestions.length > 0 && (
              <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden divide-y divide-dark-border">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSearchQuery(s.name);
                      setSuggestions([]);
                      triggerSearch();
                    }}
                    className="w-full text-left py-3 px-4 hover:bg-dark-border/40 text-xs flex justify-between items-center"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-dark-muted bg-dark-bg px-2 py-0.5 rounded uppercase">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center text-xs text-dark-muted py-2">
              <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" /> Filters:
              </span>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(parseFloat(e.target.value))}
                className="bg-dark-surface border border-dark-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-saffron"
              >
                <option value={0}>★ All Ratings</option>
                <option value={4}>★ 4.0+</option>
                <option value={4.5}>★ 4.5+</option>
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(parseFloat(e.target.value))}
                className="bg-dark-surface border border-dark-border rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value={1000}>Cost: Any</option>
                <option value={250}>Under ₹250</option>
                <option value={500}>Under ₹500</option>
              </select>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-dark-surface border border-dark-border h-48 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.map((rest) => (
                  <Card
                    key={rest.id}
                    className="cursor-pointer overflow-hidden flex gap-4 p-4 items-center bg-dark-surface/40 hover:bg-dark-surface/70 border border-dark-border/40 hover:border-brand-saffron/20 transition-all duration-300"
                    onClick={() => handleOpenRestaurant(rest)}
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-dark-bg shrink-0">
                      <img
                        src={rest.coverImage}
                        alt={rest.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm">{rest.name}</h4>
                        <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ★ {rest.rating}
                        </span>
                      </div>
                      <p className="text-[11px] text-dark-muted line-clamp-1">{rest.description}</p>
                      <div className="flex gap-3 text-[11px] text-dark-muted pt-2 font-medium">
                        <span>{rest.deliveryTimeMinutes} mins</span>
                        <span>•</span>
                        <span>₹{rest.costForTwo} for two</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-dark-muted">
                No matching restaurants found.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OFFERS */}
        {activeTab === 'offers' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-saffron" />
                Smart Promo & Coupon Recommender
              </h2>
              <p className="text-xs text-dark-muted">
                Simulate environmental factors and real-time database conditions to view and apply
                dynamically calculated promotional codes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel: Simulator Inputs */}
              <div className="lg:col-span-1 space-y-6">
                <Card
                  glass
                  className="p-5 border border-dark-border/40 space-y-5 bg-dark-surface/30"
                >
                  <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                    <Sliders className="w-4 h-4 text-brand-saffron" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">
                      Simulation parameters
                    </h3>
                  </div>

                  {/* Demand Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Demand Level
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-dark-bg p-1 rounded-xl border border-dark-border">
                      {(['LOW', 'MEDIUM', 'HIGH'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSimDemand(d)}
                          className={`py-1.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                            simDemand === d
                              ? 'bg-brand-saffron text-white shadow-sm'
                              : 'text-dark-muted hover:text-dark-text'
                          }`}
                        >
                          {d === 'LOW' && '📉 Low'}
                          {d === 'MEDIUM' && '📊 Mid'}
                          {d === 'HIGH' && '📈 High'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weather Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Weather Condition
                    </label>
                    <select
                      value={simWeather}
                      onChange={(e: any) => setSimWeather(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    >
                      <option value="SUNNY">☀️ Sunny</option>
                      <option value="RAINY">🌧️ Rainy</option>
                      <option value="COLD">❄️ Cold</option>
                      <option value="HOT">🥵 Hot</option>
                      <option value="WINDY">🍃 Windy</option>
                    </select>
                  </div>

                  {/* Traffic Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Traffic Congestion
                    </label>
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

                  {/* Festival Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Festival Season
                    </label>
                    <select
                      value={simFestival}
                      onChange={(e: any) => setSimFestival(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                    >
                      <option value="NONE">🚫 None</option>
                      <option value="DIWALI">🪔 Diwali Festival</option>
                      <option value="HOLI">🎨 Holi Festival</option>
                      <option value="CHRISTMAS">🎄 Christmas Holiday</option>
                      <option value="EID">🌙 Eid Festival</option>
                      <option value="NEW_YEAR">🎆 New Year</option>
                    </select>
                  </div>

                  {/* Distance Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      <span>Delivery Distance</span>
                      <span className="text-brand-saffron font-black">
                        {simDistance.toFixed(1)} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="12.0"
                      step="0.5"
                      value={simDistance}
                      onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                      className="w-full h-1 bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-saffron"
                    />
                    <div className="flex justify-between text-[9px] text-dark-muted">
                      <span>Nearby (0.5km)</span>
                      <span>Far (12km)</span>
                    </div>
                  </div>
                </Card>

                {/* Show Current Context Summary */}
                <Card className="p-4 border border-dark-border/40 bg-dark-surface/20 text-[11px] space-y-2">
                  <div className="font-extrabold text-dark-text uppercase tracking-wider text-[9px]">
                    Simulation Status
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-dark-muted">
                    <div>
                      Address ID:{' '}
                      <span className="font-mono text-dark-text">
                        {userAddressId.slice(0, 8)}...
                      </span>
                    </div>
                    <div>
                      Inventory Status:{' '}
                      <span className="text-green-500 font-bold">Fetched (Live)</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Panel: Recommender Outputs */}
              <div className="lg:col-span-2 space-y-6">
                {promosLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-dark-surface border border-dark-border h-36 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : recommendedPromos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedPromos.map((promo) => {
                      const isApplied = appliedPromoCoupon?.code === promo.code;
                      const hasItemsToOrder = !!promo.discountedItemId;

                      return (
                        <Card
                          key={promo.id}
                          glass
                          className={`p-5 border relative overflow-hidden transition-all duration-300 ${
                            isApplied
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-brand-saffron/10 hover:border-brand-saffron/20'
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-brand-saffron text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {promo.discountType === 'PERCENTAGE'
                                    ? `${promo.discountValue}% OFF`
                                    : `₹${promo.discountValue} OFF`}
                                </span>
                                <span className="bg-dark-bg text-dark-muted border border-dark-border text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  {promo.badge}
                                </span>
                              </div>
                              <h3 className="text-base font-extrabold text-dark-text">
                                {promo.title}
                              </h3>
                              <p className="text-xs text-dark-muted">{promo.description}</p>
                            </div>

                            {/* Trigger factor badges */}
                            <div className="flex gap-1 flex-wrap">
                              {promo.factors.map((f: string) => (
                                <span
                                  key={f}
                                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Impact description */}
                          <div className="mt-3.5 bg-dark-bg/60 border border-dark-border/40 p-2.5 rounded-xl text-[10px] text-dark-muted italic">
                            💡 {promo.impact}
                          </div>

                          {/* Special surplus stock menu item */}
                          {hasItemsToOrder && (
                            <div className="mt-4 p-3 bg-dark-surface/50 border border-dark-border rounded-xl flex justify-between items-center gap-4 text-xs">
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-dark-text">
                                  {promo.discountedItemName}
                                </div>
                                <div className="text-[10px] text-dark-muted">
                                  Original Price:{' '}
                                  <span className="line-through">₹{promo.discountedItemPrice}</span>{' '}
                                  •{' '}
                                  <span className="text-green-500 font-bold">
                                    Deal Price: ₹{(promo.discountedItemPrice * 0.7).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="text-[9px] px-2.5 py-1 h-7 flex items-center gap-1"
                                onClick={() =>
                                  handleAddPromoItem({
                                    discountedItemId: promo.discountedItemId,
                                    discountedItemName: promo.discountedItemName,
                                    discountedItemPrice: promo.discountedItemPrice * 0.7,
                                    restaurantId: promo.restaurantId,
                                    description: promo.description,
                                    code: promo.code,
                                    discountType: promo.discountType,
                                    discountValue: promo.discountValue,
                                    maxDiscount: promo.maxDiscount,
                                  })
                                }
                              >
                                <Plus className="w-3 h-3" /> Add with 30% Off
                              </Button>
                            </div>
                          )}

                          {/* Footer Action Buttons */}
                          <div className="mt-4 flex gap-2 pt-2 border-t border-dark-border/20">
                            <Button
                              size="sm"
                              variant="glass"
                              className={`flex-1 text-[11px] h-8 flex items-center justify-center gap-1.5 transition-all ${
                                isApplied
                                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                  : 'hover:bg-brand-saffron/5'
                              }`}
                              onClick={() => {
                                if (isApplied) {
                                  setAppliedPromoCoupon(null);
                                } else {
                                  setAppliedPromoCoupon(promo);
                                }
                              }}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Coupon Applied
                                </>
                              ) : (
                                'Apply Coupon'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-[11px] h-8 px-3"
                              onClick={() => {
                                navigator.clipboard.writeText(promo.code);
                              }}
                            >
                              Copy Code: {promo.code}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-dark-border rounded-3xl bg-dark-surface/5 flex flex-col items-center justify-center gap-2">
                    <Tag className="w-8 h-8 text-dark-muted opacity-50" />
                    <span className="text-sm font-bold text-dark-text">
                      No Promotions Recommended
                    </span>
                    <span className="text-xs text-dark-muted max-w-sm">
                      Try varying your simulation inputs (e.g. set Weather to Rainy or select a
                      Festival Season) to generate dynamic discounts.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS & MAP TIMELINE */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-xl font-bold">Your Orders</h2>

            {trackingOrder ? (
              <Card glass className="p-6 border border-brand-saffron/20 space-y-6">
                <div className="flex justify-between items-center border-b border-dark-border pb-4">
                  <div>
                    <h3 className="font-extrabold text-base">{trackingOrder.restaurantName}</h3>
                    <span className="text-xs text-dark-muted">
                      Order ID: {trackingOrder.id} • Total: ₹{trackingOrder.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-brand-saffron/10 text-brand-saffron text-xs font-bold px-2 py-1 rounded-md">
                      {trackingStep === 0 && 'PENDING'}
                      {trackingStep === 1 && 'ACCEPTED'}
                      {trackingStep === 2 && 'COOKING'}
                      {trackingStep === 3 && 'READY'}
                      {trackingStep === 4 && 'PICKED UP'}
                      {trackingStep >= 5 && 'DELIVERED'}
                    </span>
                    <button
                      onClick={() => handleOpenInvoice(trackingOrder.id)}
                      className="p-2 border border-dark-border rounded-xl text-dark-muted hover:text-dark-text hover:border-dark-text transition-all"
                      title="View Invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Animated CSS Map Tracker with real-time websocket slider coords */}
                <div className="h-48 bg-dark-bg border border-dark-border rounded-xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-10">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="border border-dark-text" />
                    ))}
                  </div>
                  <svg className="absolute w-full h-full" viewBox="0 0 500 200">
                    <path
                      d="M 50 100 Q 250 20 450 100"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="4"
                      strokeDasharray="8"
                    />
                    <path
                      d="M 50 100 Q 250 20 450 100"
                      fill="none"
                      stroke="#FF6B09"
                      strokeWidth="4"
                      strokeDasharray="450"
                      strokeDashoffset={450 - trackingStep * 90}
                      className="transition-all duration-1000"
                    />
                  </svg>

                  <div className="absolute left-[30px] top-[90px] flex flex-col items-center">
                    <div className="w-6 h-6 bg-dark-surface border-2 border-dark-border rounded-full flex items-center justify-center">
                      🏪
                    </div>
                    <span className="text-[9px] font-bold text-dark-muted mt-1 uppercase">
                      Kitchen
                    </span>
                  </div>

                  {trackingStep < 5 && (
                    <div
                      className="absolute w-8 h-8 bg-brand-saffron text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-saffron/30 transition-all duration-1000"
                      style={{
                        left: driverCoords
                          ? `${50 + ((12.9723 - driverCoords.lat) / 0.0008) * 80 * 5}px`
                          : `${50 + trackingStep * 80}px`,
                        top: driverCoords
                          ? `${100 - Math.sin(((12.9723 - driverCoords.lat) / 0.0008) * Math.PI) * 80}px`
                          : `${100 - Math.sin((trackingStep * Math.PI) / 5) * 80}px`,
                      }}
                    >
                      🏍️
                    </div>
                  )}

                  <div className="absolute right-[30px] top-[90px] flex flex-col items-center">
                    <div className="w-6 h-6 bg-brand-saffron/10 border-2 border-brand-saffron rounded-full flex items-center justify-center">
                      🏠
                    </div>
                    <span className="text-[9px] font-bold text-brand-saffron mt-1 uppercase">
                      Home
                    </span>
                  </div>
                </div>

                {/* AI Confidence Indicators */}
                <div className="bg-dark-bg p-4 border border-dark-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-dark-text flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-saffron" />
                      AI Live ETA Confidence
                    </span>
                    <span className="font-semibold text-brand-saffron">
                      {95 - trackingStep * 3}% Confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-[10px] text-dark-muted">
                    <div className="bg-dark-surface p-2 rounded-lg border border-dark-border">
                      <div className="font-bold text-dark-text">98%</div>
                      <div>Kitchen Load</div>
                    </div>
                    <div className="bg-dark-surface p-2 rounded-lg border border-dark-border">
                      <div className="font-bold text-dark-text">92%</div>
                      <div>Rider Traffic</div>
                    </div>
                    <div className="bg-dark-surface p-2 rounded-lg border border-dark-border">
                      <div className="font-bold text-dark-text">99%</div>
                      <div>Clear Weather</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Pending / Placed', desc: 'Order submitted to restaurant' },
                    { title: 'Accepted & Cooking', desc: 'Chef preparing your Saffron delicacies' },
                    {
                      title: 'Ready for Pickup',
                      desc: 'Rider is packaging items at merchant kitchen',
                    },
                    { title: 'Picked Up & En Route', desc: 'Delivery partner Amit is 1.2 km away' },
                    { title: 'Delivered', desc: 'Meal handed over at doorstep' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            trackingStep >= idx
                              ? 'bg-brand-saffron text-white'
                              : 'bg-dark-border text-dark-muted'
                          }`}
                        >
                          {trackingStep >= idx ? '✓' : idx + 1}
                        </div>
                        {idx < 4 && (
                          <div
                            className={`w-0.5 h-8 ${trackingStep > idx ? 'bg-brand-saffron' : 'bg-dark-border'}`}
                          />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className={`font-bold ${trackingStep >= idx ? 'text-dark-text' : 'text-dark-muted'}`}
                        >
                          {s.title}
                        </div>
                        <div className="text-[11px] text-dark-muted">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <div className="text-center py-12 text-xs text-dark-muted bg-dark-surface/20 border border-dark-border rounded-xl">
                No active delivery sessions. Place a meal from the restaurant details tab.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: WALLET & LOYALTY SYSTEM */}
        {activeTab === 'wallet' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold">Wallet & Loyalty Program</h2>
              <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-black uppercase px-2 py-0.5 rounded">
                VIP Privilege Club
              </span>
            </div>

            {loyaltySuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs px-4 py-2.5 rounded-2xl animate-fadeIn">
                {loyaltySuccess}
              </div>
            )}

            {loyaltyError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-2.5 rounded-2xl animate-fadeIn">
                {loyaltyError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: VIP Membership Tier & Top-up */}
              <div className="space-y-6">
                {/* VIP Membership Card */}
                <Card className="p-6 border border-dark-border/40 bg-gradient-to-br from-dark-surface to-dark-surface/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-dark-border pb-3">
                    <div>
                      <span className="text-[9px] text-dark-muted font-bold uppercase tracking-wider">
                        VIP Tier Status
                      </span>
                      <h3 className="text-lg font-black text-white">
                        {loyaltyProfile?.tier || 'BRONZE'} MEMBER
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-dark-muted font-bold uppercase tracking-wider">
                        Balance
                      </span>
                      <h3 className="text-lg font-black text-brand-saffron">
                        {loyaltyProfile?.points || 0} Pts
                      </h3>
                    </div>
                  </div>

                  {/* Level progress meter */}
                  {loyaltyProfile?.nextTier !== 'MAX' ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-dark-muted font-bold uppercase">
                        <span>Level Progress ({loyaltyProfile?.progressToNext}%)</span>
                        <span>Next: {loyaltyProfile?.nextTier}</span>
                      </div>
                      <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border">
                        <div
                          className="h-full bg-brand-saffron transition-all duration-1000"
                          style={{ width: `${loyaltyProfile?.progressToNext || 0}%` }}
                        />
                      </div>
                      <p className="text-[9.5px] text-dark-muted leading-relaxed">
                        Earn {loyaltyProfile?.nextTierThreshold - (loyaltyProfile?.points || 0)}{' '}
                        more points to level up.
                      </p>
                    </div>
                  ) : (
                    <div className="text-[10px] text-green-500 font-extrabold">
                      🏆 Max Platinum Tier Reached!
                    </div>
                  )}

                  {/* Tier benefits */}
                  <div className="bg-dark-bg/60 p-3.5 rounded-xl border border-dark-border/40 text-[10px] space-y-2">
                    <span className="font-extrabold uppercase text-[8.5px] text-dark-muted tracking-wider">
                      Active Privilege Benefits
                    </span>
                    <div className="space-y-1.5 text-dark-text">
                      <div>
                        ⚡{' '}
                        <strong>
                          {Math.round((loyaltyProfile?.cashbackRate || 0) * 100)}% Cashback
                        </strong>{' '}
                        on all order checkouts
                      </div>
                      {loyaltyProfile?.points >= 300 && (
                        <div>
                          🚚 <strong>Free Delivery privilege</strong> automatically applied
                        </div>
                      )}
                      {loyaltyProfile?.points >= 800 && (
                        <div>
                          🌟 <strong>Priority VIP concierge route assignment</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Database Wallet Funds Top-up */}
                <Card glass className="p-5 border border-dark-border/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">
                      Linked Balance
                    </span>
                    <h3 className="text-xl font-black text-white">₹{walletBalance.toFixed(2)}</h3>
                  </div>

                  <form onSubmit={handleAddLoyaltyFunds} className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-dark-muted">₹</span>
                      <input
                        type="number"
                        placeholder="Top-up Amount"
                        value={walletAmountInput}
                        onChange={(e) => setWalletAmountInput(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 pl-7 pr-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full text-xs h-9">
                      Add Top-up Funds
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Middle Column: Claim Vouchers & Referral console */}
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rewards Catalog */}
                  <Card glass className="p-5 border border-dark-border/40 space-y-4 h-fit">
                    <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                      <Sparkles className="w-4 h-4 text-brand-saffron animate-pulse" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">
                        Claimable Loyalty Rewards
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {loyaltyProfile?.rewardsCatalog?.map((reward: any) => {
                        const canClaim = (loyaltyProfile?.points || 0) >= reward.cost;
                        return (
                          <div
                            key={reward.id}
                            className="bg-dark-bg/60 p-3 rounded-xl border border-dark-border/40 text-xs flex justify-between items-center gap-4 flex-wrap"
                          >
                            <div className="space-y-0.5 flex-1 min-w-[140px]">
                              <div className="font-extrabold text-white">{reward.title}</div>
                              <p className="text-[10px] text-dark-muted leading-relaxed">
                                {reward.desc}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={canClaim ? 'primary' : 'glass'}
                              className="text-[9px] font-black uppercase h-7 px-3 flex items-center justify-center whitespace-nowrap"
                              disabled={!canClaim}
                              onClick={() => handleClaimReward(reward.id)}
                            >
                              Redeem ({reward.cost} pts)
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Referral Invite Panel */}
                  <Card glass className="p-5 border border-dark-border/40 space-y-4 h-fit">
                    <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                      <UserIcon className="w-4 h-4 text-brand-saffron" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">
                        Referral Invite Console
                      </h3>
                    </div>

                    <div className="bg-dark-bg/80 p-3.5 rounded-xl border border-dark-border/40 text-xs space-y-1">
                      <span className="text-[9px] text-dark-muted font-bold uppercase">
                        Your Invite Code
                      </span>
                      <div className="font-black text-sm text-brand-saffron tracking-wider select-all cursor-pointer">
                        {loyaltyProfile?.referrals?.code || 'FETCHING...'}
                      </div>
                      <p className="text-[9.5px] text-dark-muted pt-1">
                        Invite friends to SwiggyZone. Earn ₹100 cash voucher credit once they sign
                        up and place an order.
                      </p>
                    </div>

                    <form onSubmit={handleRedeemReferral} className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-dark-muted uppercase">
                          Redeem Invitation Code
                        </label>
                        <input
                          type="text"
                          placeholder="REF-XXXX-XXX"
                          value={referralInput}
                          onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                        />
                      </div>
                      <Button type="submit" size="sm" className="w-full text-xs h-8">
                        Redeem Invite Code
                      </Button>
                    </form>
                  </Card>
                </div>

                {/* Simulator controls & Transactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order simulation */}
                  <Card glass className="p-5 border border-dark-border/40 space-y-4">
                    <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                      <RotateCcw className="w-4 h-4 text-brand-saffron" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">
                        Points & Cashback Simulator
                      </h3>
                    </div>
                    <p className="text-[11px] text-dark-muted leading-relaxed">
                      Simulate placing a food order checkout to verify the automated Points and
                      Cashback calculation logic.
                    </p>

                    <div className="space-y-3 pt-1">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-dark-muted">₹</span>
                        <input
                          type="number"
                          placeholder="Order Spend Amount"
                          value={simOrderAmount}
                          onChange={(e) => setSimOrderAmount(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl py-1.5 pl-7 pr-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-[11px] h-8"
                        onClick={handleSimulatePointsCashback}
                      >
                        Checkout Simulated Order
                      </Button>
                    </div>
                  </Card>

                  {/* Audit Logs Transaction Ledger */}
                  <Card
                    glass
                    className="p-5 border border-dark-border/40 space-y-3 h-[210px] flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center border-b border-dark-border pb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-dark-text">
                        Audit Transaction History
                      </h3>
                      <span className="text-[9px] text-dark-muted">Synced from database</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none py-1">
                      {loyaltyProfile?.transactions?.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="flex justify-between items-center text-[10px] bg-dark-bg/60 p-2 border border-dark-border/40 rounded-lg"
                        >
                          <div className="space-y-0.5">
                            <span className="text-white font-bold">{tx.description}</span>
                            <div className="text-dark-muted text-[8.5px]">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`font-black ${tx.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'} whitespace-nowrap`}
                          >
                            {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {(!loyaltyProfile?.transactions ||
                        loyaltyProfile?.transactions.length === 0) && (
                        <div className="text-[10px] text-dark-muted italic text-center py-8">
                          No transaction history.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS / PROFILE */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold">Account Profile & Settings</h2>

            <Card glass className="p-6 border border-dark-border space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-saffron text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {user ? user.firstName[0] : 'G'}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                  </h3>
                  <p className="text-xs text-dark-muted">{user ? user.email : 'Not signed in'}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-dark-muted uppercase tracking-wider">
                Settings
              </h4>
              <div className="bg-dark-surface border border-dark-border rounded-xl divide-y divide-dark-border overflow-hidden">
                {user?.roleName === 'RESTAURANT_OWNER' && (
                  <button
                    onClick={() => router.push('/restaurant/dashboard')}
                    className="w-full text-left py-4 px-5 hover:bg-dark-border/40 text-xs font-bold text-brand-saffron flex justify-between items-center"
                  >
                    <span>Switch to Restaurant Manager View</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {user?.roleName === 'ADMIN' && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="w-full text-left py-4 px-5 hover:bg-dark-border/40 text-xs font-bold text-brand-saffron flex justify-between items-center"
                  >
                    <span>Open Administrator Operations Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {user?.roleName === 'DELIVERY_PARTNER' && (
                  <button
                    onClick={() => router.push('/delivery/dashboard')}
                    className="w-full text-left py-4 px-5 hover:bg-dark-border/40 text-xs font-bold text-brand-saffron flex justify-between items-center"
                  >
                    <span>Switch to Delivery Driver Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <div className="py-4 px-5 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold">System Appearance</div>
                    <div className="text-[10px] text-dark-muted">
                      Manage system dark theme settings
                    </div>
                  </div>
                  <span className="bg-brand-saffron/10 text-brand-saffron text-[10px] font-bold px-2 py-1 rounded">
                    DARK MODE ENABLED
                  </span>
                </div>
              </div>
            </div>

            {/* NOTIFICATION PREFERENCES CARD */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-dark-muted uppercase tracking-wider">
                Notification preferences
              </h4>
              <Card glass className="p-5 border border-dark-border/40 space-y-4">
                <p className="text-xs text-dark-muted">
                  Configure your preferred delivery alert, update, and discount channels.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'push', label: '📳 Web Push' },
                    { key: 'email', label: '📧 Email Alerts' },
                    { key: 'sms', label: '💬 SMS updates' },
                    { key: 'whatsapp', label: '🟢 WhatsApp' },
                    { key: 'inApp', label: '🔔 In-App' },
                  ].map((channel) => (
                    <button
                      key={channel.key}
                      onClick={() => handleUpdatePref(channel.key, !notifPrefs[channel.key])}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        notifPrefs[channel.key]
                          ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                          : 'border-dark-border text-dark-muted bg-dark-surface/30'
                      }`}
                    >
                      {channel.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* NOTIFICATION SIMULATOR & QUEUE WORKER MONITOR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side: Simulator Controls */}
              <div className="lg:col-span-1 space-y-3">
                <h4 className="font-bold text-sm text-dark-muted uppercase tracking-wider">
                  Alert Templates Simulator
                </h4>
                <Card glass className="p-5 border border-dark-border/40 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Select Message Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-dark-text focus:outline-none"
                    >
                      <option value="ORDER_PLACED">🍔 Order Confirmed Template</option>
                      <option value="ORDER_READY">📦 Ready for Pickup Template</option>
                      <option value="PROMO_BLAST">🍛 Marketing Promo Blast</option>
                      <option value="WALLET_UPDATE">💰 Wallet Ledger Credit</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Select Target Channels
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'push', name: 'Push' },
                        { id: 'email', name: 'Email' },
                        { id: 'sms', name: 'SMS' },
                        { id: 'whatsapp', name: 'WhatsApp' },
                        { id: 'inApp', name: 'In-App' },
                      ].map((ch) => {
                        const isSelected = selectedChannels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedChannels(selectedChannels.filter((c) => c !== ch.id));
                              } else {
                                setSelectedChannels([...selectedChannels, ch.id]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                                : 'border-dark-border text-dark-muted'
                            }`}
                          >
                            {ch.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
                    onClick={handleTriggerTestNotif}
                  >
                    <Sparkles className="w-4 h-4" /> Trigger Queue Blast
                  </Button>
                </Card>
              </div>

              {/* Right Side: Queue Logs Worker */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="font-bold text-sm text-dark-muted uppercase tracking-wider">
                  Asynchronous Dispatch Queue Monitor
                </h4>
                <Card className="p-4 border border-dark-border/40 bg-black/60 rounded-3xl space-y-4 font-mono">
                  {/* Console Logs */}
                  <div className="space-y-1.5 text-[10px] text-green-400 h-32 overflow-y-auto border-b border-dark-border pb-3 scrollbar-none">
                    {queueLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {log}
                      </div>
                    ))}
                    {queueLogs.length === 0 && (
                      <div className="text-dark-muted italic">No worker activity logged.</div>
                    )}
                  </div>

                  {/* Enqueued Jobs List */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      Active Queue Jobs
                    </div>
                    <div className="h-28 overflow-y-auto space-y-1.5 scrollbar-none">
                      {queueJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex justify-between items-center text-[10px] bg-dark-bg/60 border border-dark-border/40 p-2 rounded-lg"
                        >
                          <div className="space-y-0.5">
                            <span className="text-dark-text font-bold">Job: #{job.id}</span>
                            <span className="text-dark-muted ml-2">Channel: {job.channel}</span>
                          </div>
                          <span
                            className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                              job.status === 'COMPLETED'
                                ? 'bg-green-600/10 text-green-500'
                                : job.status === 'PROCESSING'
                                  ? 'bg-blue-600/10 text-blue-500'
                                  : job.status === 'FAILED'
                                    ? 'bg-red-600/10 text-red-500'
                                    : 'bg-dark-border text-dark-muted'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      ))}
                      {queueJobs.length === 0 && (
                        <div className="text-[10px] text-dark-muted italic text-center py-6">
                          Queue is empty.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {isAuthenticated ? (
              <Button
                variant="glass"
                className="w-full py-3 text-red-500 border-red-500/20 hover:bg-red-500/10"
                onClick={() => {
                  dispatch(logout());
                  router.push('/login');
                }}
              >
                Sign Out Account
              </Button>
            ) : (
              <Button className="w-full py-3" onClick={() => router.push('/login')}>
                Sign In to Account
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Cart Drawer Panel */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border py-4 px-6 flex justify-between items-center z-40 max-w-5xl mx-auto shadow-2xl rounded-t-3xl md:left-20">
          <div>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-brand-saffron" />
              <span className="text-xs font-bold text-dark-text">
                {cartItems.length} item(s) selected
              </span>
            </div>
            <div className="text-[10px] text-dark-muted flex flex-col gap-0.5">
              <span>
                Total: <strong className="text-dark-text">₹{finalCartTotal}</strong> (Includes ₹40
                delivery fee)
              </span>
              {appliedPromoCoupon && (
                <span className="text-green-500 font-bold text-[9px] uppercase">
                  Promo Applied ({appliedPromoCoupon.code}): -₹{appliedDiscount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="sm" variant="secondary" onClick={() => dispatch(clearCart())}>
              Clear
            </Button>
            <Button size="sm" onClick={handleCheckoutTrigger} disabled={paymentLoading}>
              {paymentLoading ? 'Checking...' : 'Checkout order'}
            </Button>
          </div>
        </div>
      )}

      {/* Floating AI Chat Assistant Widget Trigger */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {showAiChat && (
            <Card
              glass
              className="w-80 h-96 border border-brand-saffron/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl shadow-brand-saffron/10 animate-fadeIn"
            >
              {/* Header */}
              <div className="p-4 bg-dark-surface border-b border-dark-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-saffron animate-pulse" />
                  <span className="text-xs font-black text-dark-text">AI Food Concierge</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAiMemory}
                    className="p-1 text-dark-muted hover:text-red-500 rounded"
                    title="Clear Chat Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAiChat(false)}
                    className="p-1 text-dark-muted hover:text-dark-text rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-brand-saffron text-white rounded-tr-none'
                          : 'bg-dark-surface border border-dark-border text-dark-text rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-surface border border-dark-border p-3 rounded-2xl rounded-tl-none text-dark-muted text-[10px] italic animate-pulse">
                      Assistant typing...
                    </div>
                  </div>
                )}

                {/* AI RAG Recommendation Options Cards */}
                {!aiLoading && aiRecommendations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-dark-border/40">
                    <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">
                      Recommendations matches
                    </span>
                    <div className="space-y-2">
                      {aiRecommendations.map((d) => (
                        <div
                          key={d.id}
                          className="p-2 bg-dark-surface/50 border border-dark-border rounded-xl flex justify-between items-center text-[10px] gap-2"
                        >
                          <div>
                            <div className="font-bold text-dark-text line-clamp-1">{d.name}</div>
                            <div className="text-dark-muted font-medium">
                              ₹{d.price} • {d.restaurantName}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddRecommendedDish(d)}
                            className="bg-brand-saffron/10 hover:bg-brand-saffron text-brand-saffron hover:text-white font-bold px-2 py-1 rounded transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form with Speech Recognition */}
              <div className="p-3 bg-dark-surface border-t border-dark-border space-y-2 shrink-0">
                <div className="flex justify-between items-center text-[10px] text-dark-muted flex-wrap gap-1">
                  <div className="flex gap-1.5 items-center">
                    <span className="font-bold">Voice:</span>
                    {(['en-US', 'hi-IN', 'es-ES'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setVoiceLang(lang)}
                        className={`px-1.5 py-0.5 rounded transition-all font-bold cursor-pointer ${
                          voiceLang === lang
                            ? 'bg-brand-saffron/15 text-brand-saffron'
                            : 'text-dark-muted'
                        }`}
                      >
                        {lang === 'en-US' && 'EN'}
                        {lang === 'hi-IN' && 'HI'}
                        {lang === 'es-ES' && 'ES'}
                      </button>
                    ))}
                  </div>
                  {voiceError && (
                    <span className="text-red-500 font-medium truncate max-w-[120px]">
                      {voiceError}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendAiMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type or say 'add chicken biryani'..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-xs text-dark-text focus:outline-none focus:border-brand-saffron"
                  />
                  <button
                    type="button"
                    onClick={startVoiceListening}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      isListening
                        ? 'bg-red-500 border-red-500 text-white animate-pulse'
                        : 'bg-dark-bg border-dark-border text-dark-muted hover:text-dark-text hover:border-dark-text/40'
                    }`}
                    title="Speak Voice Command"
                  >
                    🎤
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-brand-saffron text-white rounded-xl hover:bg-brand-orange transition-colors"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </div>
            </Card>
          )}

          <button
            onClick={() => setShowAiChat(!showAiChat)}
            className="w-14 h-14 bg-gradient-to-tr from-brand-orange to-brand-saffron text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-saffron/30 hover:scale-110 active:scale-95 transition-transform duration-300 relative"
          >
            {showAiChat ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageSquare className="w-6 h-6 animate-pulse" />
            )}
            {!showAiChat && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      )}

      {/* Payment Selector Drawer Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-md bg-dark-surface border border-dark-border p-6 rounded-3xl relative space-y-6">
            <button
              className="absolute right-4 top-4 text-dark-muted hover:text-dark-text"
              onClick={() => setShowPaymentModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-base">Select Payment Method</h3>
              <p className="text-xs text-dark-muted">
                Choose your preferred gateway to complete checkout
              </p>
            </div>

            {paymentError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-2.5 rounded-xl">
                {paymentError}
              </div>
            )}

            <div className="space-y-3">
              {[
                { id: 'WALLET', label: 'SwiggyZone Wallet', desc: `Balance: ₹${walletBalance}` },
                { id: 'STRIPE', label: 'Credit Card / Visa', desc: 'Secure processing via Stripe' },
                {
                  id: 'RAZORPAY',
                  label: 'Net Banking / UPI',
                  desc: 'Fast transactions via Razorpay',
                },
                {
                  id: 'COD',
                  label: 'Cash on Delivery (COD)',
                  desc: 'Pay with cash at your doorstep',
                },
              ].map((gateway) => (
                <button
                  key={gateway.id}
                  onClick={() => setPaymentMethod(gateway.id as any)}
                  className={`w-full py-3.5 px-4 rounded-xl border text-left flex justify-between items-center transition-all duration-300 ${
                    paymentMethod === gateway.id
                      ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron shadow-lg shadow-brand-saffron/5'
                      : 'border-dark-border text-dark-text hover:border-dark-text/40'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold">{gateway.label}</div>
                    <div className="text-[10px] text-dark-muted">{gateway.desc}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === gateway.id ? 'border-brand-saffron bg-brand-saffron' : 'border-dark-border'}`}
                  >
                    {paymentMethod === gateway.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-dark-border pt-4">
              <div>
                <span className="text-[10px] text-dark-muted">Total Payable Amount</span>
                <div className="text-base font-extrabold text-brand-saffron">₹{finalCartTotal}</div>
              </div>
              <Button size="sm" onClick={handleConfirmPayment} disabled={paymentLoading}>
                {paymentLoading ? 'Processing...' : 'Pay & Confirm'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceHtml && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-2xl bg-dark-surface border border-dark-border rounded-3xl overflow-hidden relative flex flex-col h-[80vh]">
            <div className="p-4 border-b border-dark-border flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm text-dark-text flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-brand-saffron" />
                Receipt Invoice #{invoiceOrderId}
              </h3>
              <button
                className="text-dark-muted hover:text-dark-text"
                onClick={() => setInvoiceHtml(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-dark-bg p-4 overflow-hidden relative">
              <iframe src={invoiceHtml} className="w-full h-full border-none rounded-xl bg-white" />
            </div>

            <div className="p-4 border-t border-dark-border flex justify-end gap-3 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => setInvoiceHtml(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const win = window.open(invoiceHtml || '');
                  if (win) win.print();
                }}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Selection Drawer Modal */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-md bg-dark-surface border border-dark-border p-6 rounded-3xl relative space-y-6">
            <button
              className="absolute right-4 top-4 text-dark-muted hover:text-dark-text"
              onClick={() => setSelectedDish(null)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span
                className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${selectedDish.isVeg ? 'border-green-600' : 'border-red-600'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${selectedDish.isVeg ? 'bg-green-600' : 'bg-red-600'}`}
                />
              </span>
              <h3 className="font-extrabold text-base pt-1">{selectedDish.name}</h3>
              <p className="text-xs text-dark-muted">{selectedDish.description}</p>
            </div>

            {selectedDish.variants && selectedDish.variants.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Choose Portion Size
                </h4>
                <div className="space-y-2">
                  {selectedDish.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex justify-between items-center transition-all duration-300 ${
                        selectedVariant?.id === v.id
                          ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                          : 'border-dark-border text-dark-muted hover:border-dark-text'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span>{v.priceDelta > 0 ? `+ ₹${v.priceDelta}` : 'Included'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDish.addons && selectedDish.addons.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Select Add-ons
                </h4>
                <div className="space-y-2">
                  {selectedDish.addons.map((a: any) => {
                    const isSelected = selectedAddons.some((addon) => addon.id === a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => handleToggleAddon(a)}
                        className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex justify-between items-center transition-all duration-300 ${
                          isSelected
                            ? 'border-brand-saffron bg-brand-saffron/10 text-brand-saffron'
                            : 'border-dark-border text-dark-muted hover:border-dark-text'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-saffron border-brand-saffron' : 'border-dark-border'}`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{a.name}</span>
                        </div>
                        <span>+ ₹{a.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dark-border pt-4">
              <div>
                <span className="text-[10px] text-dark-muted">Total Unit Price</span>
                <div className="text-base font-extrabold text-brand-saffron">
                  ₹
                  {selectedDish.price +
                    (selectedVariant ? selectedVariant.priceDelta : 0) +
                    selectedAddons.reduce((sum, a) => sum + a.price, 0)}
                </div>
              </div>
              <Button size="sm" onClick={handleConfirmCustomization}>
                Add to Cart
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Mobile bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border py-2 px-4 flex justify-around items-center z-30 md:hidden">
        {[
          { id: 'home', icon: Compass, label: 'Explore' },
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'offers', icon: Tag, label: 'Offers' },
          { id: 'orders', icon: History, label: 'Timeline' },
          { id: 'wallet', icon: CreditCard, label: 'Wallet' },
          { id: 'settings', icon: SettingsIcon, label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedRestDetails(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-300 ${activeTab === tab.id ? 'text-brand-saffron scale-110' : 'text-dark-muted'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[9px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
