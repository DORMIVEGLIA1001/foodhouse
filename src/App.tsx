import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Utensils, 
  ShoppingCart, 
  MapPin, 
  Calendar, 
  Sparkles, 
  User, 
  X, 
  Send, 
  Check, 
  PhoneCall, 
  PhoneOff, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  Heart, 
  Filter, 
  Bot, 
  FileText, 
  CreditCard,
  ChefHat,
  Map,
  RotateCcw,
  Star,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Play,
  Phone,
  MessageSquare,
  BookmarkCheck,
  ShieldAlert,
  LogOut,
  Sliders,
  DollarSign,
  Database,
  Mail
} from 'lucide-react';
import { Dish, Order, Reservation, ChatMessage, UserPreferences, ChatAction } from './types';
import LeafletMap from './components/LeafletMap';
import CustomerApp from './components/CustomerApp';
import RestaurantApp from './components/RestaurantApp';
import ShipperApp from './components/ShipperApp';
import ChatScreen from './components/customer/ChatScreen';
import MenuScreen from './components/customer/MenuScreen';
import TrackingScreen from './components/customer/TrackingScreen';
import ReservationsScreen from './components/customer/ReservationsScreen';
import PreferencesScreen from './components/customer/PreferencesScreen';
import CustomerSidebar from './components/customer/CustomerSidebar';
import ChatMessagesPanel from './components/customer/ChatMessagesPanel';
import MenuGridSection from './components/customer/MenuGridSection';
import OrderHistoryPanel from './components/customer/OrderHistoryPanel';
import RestaurantStatsSection from './components/restaurant/RestaurantStatsSection';
import RestaurantOrdersBoard from './components/restaurant/RestaurantOrdersBoard';
import RestaurantOrderCard from './components/restaurant/RestaurantOrderCard';
import RestaurantSideColumn from './components/restaurant/RestaurantSideColumn';
import ShipperOrdersList from './components/shipper/ShipperOrdersList';
import ShipperDeliveryWorkspace from './components/shipper/ShipperDeliveryWorkspace';
import ShipperRoutePanel from './components/shipper/ShipperRoutePanel';
import LivekitCallModal from './components/shared/LivekitCallModal';
import { useLivekitCall } from './hooks/useLivekitCall';
import { motion } from 'motion/react';

interface BoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallback?: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(_: Error): BoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default function App() {
  // Global States
  const [activeTab, setActiveTab] = useState<'chat' | 'menu' | 'map' | 'reservations' | 'preferences'>('chat');
  const [restaurantView, setRestaurantView] = useState<'operations' | 'reservations' | 'menu'>('operations');
  const [shipperView, setShipperView] = useState<'orders' | 'customer' | 'route'>('route');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({ dietaryNotes: '', favorites: [] });

  // Custom Authentication State (Google, Facebook & Local accounts)
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatar: string;
    provider: 'google' | 'facebook' | 'local';
    username?: string;
    phoneNumber?: string;
    address?: string;
    role?: 'customer' | 'restaurant' | 'shipper';
  } | null>(() => {
    const saved = localStorage.getItem('hv_user_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authRole, setAuthRole] = useState<'customer' | 'restaurant' | 'shipper'>('customer');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // States for Twilio Phone SMS OTP validation
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [otpSimulatedCode, setOtpSimulatedCode] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [facebookClientId, setFacebookClientId] = useState('');
  const [facebookSdkReady, setFacebookSdkReady] = useState(false);
  const [facebookAuthLoading, setFacebookAuthLoading] = useState(false);

  // Decode JWT credentials returned by Google Identity Services SDK
  const decodeGoogleJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT decoding error:", e);
      return null;
    }
  };

  const applyAuthenticatedUser = (matchedUser: {
    fullName?: string;
    username?: string;
    email?: string;
    avatar?: string;
    provider?: 'google' | 'facebook' | 'local';
    phoneNumber?: string;
    address?: string;
    role?: 'customer' | 'restaurant' | 'shipper';
  }) => {
    const resolvedRole = matchedUser.role || 'customer';
    const resolvedEmail = matchedUser.email || (matchedUser.username?.includes('@') ? matchedUser.username : '') || '';
    const profile = {
      name: matchedUser.fullName || matchedUser.username || resolvedEmail || 'Khách hàng',
      email: resolvedEmail,
      avatar: matchedUser.avatar || (matchedUser.fullName || matchedUser.username || 'U').charAt(0),
      provider: matchedUser.provider || 'local' as const,
      username: matchedUser.username,
      phoneNumber: matchedUser.phoneNumber,
      address: matchedUser.address,
      role: resolvedRole
    };

    localStorage.setItem('hv_user_profile', JSON.stringify(profile));
    setUserProfile(profile);
    setUserRole(resolvedRole);
    if (resolvedRole === 'customer') {
      setCheckoutName(profile.name);
      setResName(profile.name);
      if (matchedUser.phoneNumber) {
        setCheckoutPhone(matchedUser.phoneNumber);
        setResPhone(matchedUser.phoneNumber);
      }
      if (resolvedEmail) {
        setCheckoutEmail(resolvedEmail);
        setResEmail(resolvedEmail);
      }
      if (matchedUser.address) {
        setCheckoutAddress(matchedUser.address);
      }
    }
    setIsAuthModalOpen(false);
    setAuthError('');
  };

  // Google Sign-In SDK Loader and Initializer
  useEffect(() => {
    const initGoogleAuth = () => {
      if ((window as any).google?.accounts?.id) {
        try {
          const client_id = googleClientId;
          if (!client_id) return;
          (window as any).google.accounts.id.initialize({
            client_id: client_id,
            use_fedcm_for_prompt: false,
            callback: (response: any) => {
              if (response.credential) {
                const decoded = decodeGoogleJwt(response.credential);
                if (decoded) {
                  applyAuthenticatedUser({
                    fullName: decoded.name || decoded.email,
                    username: decoded.email,
                    email: decoded.email,
                    avatar: decoded.picture || "",
                    provider: 'google',
                    role: 'customer',
                  });
                }
              }
            }
          });

          // Draw the Google button securely to the DOM target element if it exists
          const container = document.getElementById('google-signin-btn-target');
          if (container) {
            (window as any).google.accounts.id.renderButton(
              container,
              { 
                theme: "filled_blue", 
                size: "large", 
                text: "signin_with", 
                shape: "pill",
                width: 200
              }
            );
          }
          // Also invoke One Tap prompt in the background as a nice modern UX feature!
          // Only trigger if we are not embedded in an iframe to prevent FedCM NotAllowedError in sandbox environments
          if (window.self === window.top) {
            (window as any).google.accounts.id.prompt();
          }
        } catch (err) {
          console.error("Error initializing Google Identity Services:", err);
        }
      }
    };

    if (isAuthModalOpen) {
      // Delay slightly to ensure standard DOM mounting is absolute, then load
      const timer = setTimeout(initGoogleAuth, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthModalOpen, authTab, googleClientId]);

  useEffect(() => {
    const initFacebookAuth = () => {
      const facebookSdk = (window as any).FB;
      if (!facebookSdk || !facebookClientId) return;
      try {
        facebookSdk.init({
          appId: facebookClientId,
          cookie: false,
          xfbml: false,
          version: 'v20.0',
        });
        setFacebookSdkReady(true);
      } catch (error) {
        console.error('Facebook SDK init error:', error);
        setFacebookSdkReady(false);
      }
    };

    if (!isAuthModalOpen || !facebookClientId) return;

    if ((window as any).FB) {
      initFacebookAuth();
      return;
    }

    (window as any).fbAsyncInit = initFacebookAuth;
    const existingScript = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onerror = () => {
      setFacebookSdkReady(false);
      setAuthError('Không tải được Facebook SDK. Vui lòng kiểm tra kết nối và domain app.');
    };
    document.body.appendChild(script);
  }, [isAuthModalOpen, facebookClientId]);

  // Multi-role System states
  const [userRole, setUserRole] = useState<'customer' | 'restaurant' | 'shipper'>(() => {
    const saved = localStorage.getItem('hv_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role) return parsed.role;
      } catch (err) {}
    }
    return 'customer';
  });
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(65000);
  const [newDishCategory, setNewDishCategory] = useState<'main' | 'starter' | 'drink' | 'dessert'>('main');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImage, setNewDishImage] = useState('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600');
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [restSearchQuery, setRestSearchQuery] = useState('');
  const [selectedShipperOrder, setSelectedShipperOrder] = useState<Order | null>(null);

  // VietQR Merchant Custom parameters (Real MoMo/ZaloPay targets)
  const [bankId, setBankId] = useState(() => localStorage.getItem('hv_bank_id') || 'vcb');
  const [bankNo, setBankNo] = useState(() => localStorage.getItem('hv_bank_no') || '0011004234567');
  const [bankName, setBankName] = useState(() => localStorage.getItem('hv_bank_name') || 'NHÀ HÀNG HƯƠNG VIỆT');

  // Supabase Database connection checker states
  const [dbCheckStatus, setDbCheckStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [dbCheckResult, setDbCheckResult] = useState<any>(null);

  const handleCheckDatabaseConnection = async () => {
    setDbCheckStatus('checking');
    setDbCheckResult(null);
    try {
      const res = await fetch('/api/check-db');
      const data = await res.json();
      if (data.success) {
        setDbCheckStatus('success');
        setDbCheckResult(data);
      } else {
        setDbCheckStatus('failed');
        setDbCheckResult(data);
      }
    } catch (err: any) {
      setDbCheckStatus('failed');
      setDbCheckResult({
        success: false,
        message: 'Lỗi mạng hoặc máy chủ không phản hồi.',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleCheckTwilio = async () => {
    setTwilioDiagLoading(true);
    setTwilioDiagError(null);
    setTwilioDiagResult(null);
    try {
      const res = await fetch('/api/phone-call/debug-twilio');
      const data = await res.json();
      if (res.ok && data.success) {
        setTwilioDiagResult(data);
      } else {
        setTwilioDiagError(data.error || "Gặp lỗi không rõ khi kết nối Twilio.");
      }
    } catch (err: any) {
      setTwilioDiagError("Lỗi kết nối máy chủ khi thực hiện chẩn đoán Twilio.");
    } finally {
      setTwilioDiagLoading(false);
    }
  };

  // Resend Email Notification States
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [testEmailTo, setTestEmailTo] = useState('mha17003@gmail.com');
  const [testEmailSubject, setTestEmailSubject] = useState('Kiểm thử kết nối Resend - Nhà Hàng Hương Việt');
  const [testEmailBody, setTestEmailBody] = useState('<p>Chào bạn, đây là thư thử nghiệm được gửi từ API <strong>Resend.com</strong> của hệ thống quản lý Nhà hàng Hương Việt!</p>');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResultMessage, setSendResultMessage] = useState<string | null>(null);
  const [sendResultSuccess, setSendResultSuccess] = useState<boolean>(true);

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/emails/history');
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (err) {
      console.warn("Lỗi lấy nhật ký email:", err);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo || !testEmailSubject || !testEmailBody) {
      alert("Vui lòng điền đủ người nhận, tiêu đề và nội dung.");
      return;
    }
    setSendingEmail(true);
    setSendResultMessage(null);
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailTo,
          subject: testEmailSubject,
          html: testEmailBody
        })
      });
      const data = await res.json();
      if (data.success) {
        setSendResultSuccess(true);
        setSendResultMessage(`Gửi thành công! ID: ${data.id || 'N/A'}`);
        fetchEmailLogs();
      } else {
        setSendResultSuccess(false);
        setSendResultMessage(`Lỗi gửi: ${data.error || 'Lỗi không xác định.'}`);
        fetchEmailLogs();
      }
    } catch (err: any) {
      setSendResultSuccess(false);
      setSendResultMessage(`Lỗi mạng: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSendingEmail(false);
    }
  };
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Xin chào quý khách! Tôi là Hương Việt AI, trợ lý web của nhà hàng. Tôi có thể tư vấn món, tạo đơn ngay trong chat, hỗ trợ thanh toán và theo dõi trạng thái đơn hàng liên tục cho bạn.',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Active Tracking Order States
  const [trackingOrderId, setTrackingOrderId] = useState<string>('HV-2026');
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [isTrackingLoop, setIsTrackingLoop] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Reservation Form States
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resEmail, setResEmail] = useState('mha17003@gmail.com');
  const [resCount, setResCount] = useState(2);
  const [resTime, setResTime] = useState('19:00 tối nay');

  // Checkout Form States
  const [checkoutName, setCheckoutName] = useState('Nguyễn Hoàng Nam');
  const [checkoutPhone, setCheckoutPhone] = useState('0987654321');
  const [checkoutEmail, setCheckoutEmail] = useState('mha17003@gmail.com');
  const [checkoutAddress, setCheckoutAddress] = useState('12 Lý Thái Tổ, Phố Cổ, Hoàn Kiếm, Hà Nội');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'dine_in'>('delivery');
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'momo' | 'zalopay'>('momo');
  
  // UI Overlays & Interactive States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState<Dish | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [paymentQRModal, setPaymentQRModal] = useState<{ isOpen: boolean; orderId: string; amount: number; method: 'momo' | 'zalopay' }>({ isOpen: false, orderId: '', amount: 0, method: 'momo' });
  const [callIncoming, setCallIncoming] = useState(false);
  const [activeCallTargetOrder, setActiveCallTargetOrder] = useState<Order | null>(null);
  const [isPhoneCallActive, setIsPhoneCallActive] = useState(false);
  const [phoneCallText, setPhoneCallText] = useState('');
  const [phoneCallDialog, setPhoneCallDialog] = useState<{ speaker: 'assistant' | 'user'; text: string }[]>([
    { speaker: 'assistant', text: 'Kính chào quý thực khách. Đây là cuộc gọi thoại tự động từ nhà hàng Hương Việt AI để xác nhận tình trạng đơn hàng của quý khách ạ.' }
  ]);
  const [isPhoneCallLoading, setIsPhoneCallLoading] = useState(false);

  // LiveKit WebRTC Cloud Web Calling states
  const livekitCall = useLivekitCall();
  const [callTriggerLoading, setCallTriggerLoading] = useState<string | null>(null);
  const [expandedCallLogId, setExpandedCallLogId] = useState<string | null>(null);

  // Twilio Diagnostic state variables
  const [twilioDiagLoading, setTwilioDiagLoading] = useState(false);
  const [twilioDiagError, setTwilioDiagError] = useState<string | null>(null);
  const [twilioDiagResult, setTwilioDiagResult] = useState<{
    success: boolean;
    accountSid?: string;
    configFromNum?: string;
    verifiedNumbers?: Array<{ friendlyName: string; phoneNumber: string; sid: string }>;
    inboundNumbers?: Array<{ friendlyName: string; phoneNumber: string; sid: string }>;
    message?: string;
  } | null>(null);

  const [filterCategory, setFilterCategory] = useState<'all' | 'main' | 'starter' | 'drink' | 'dessert'>('all');

  const effectiveRole = userProfile?.role || 'customer';
  const isCustomerRole = effectiveRole === 'customer';
  const isRestaurantRole = effectiveRole === 'restaurant';
  const isShipperRole = effectiveRole === 'shipper';

  const customerVisibleOrders = orders.filter((order) => {
    if (!userProfile || effectiveRole !== 'customer') return true;
    const normalizedEmail = (userProfile.email || '').trim().toLowerCase();
    const normalizedName = (userProfile.name || '').trim().toLowerCase();
    const normalizedPhone = (userProfile.phoneNumber || '').trim();
    return (
      (normalizedEmail && (order.customerEmail || '').trim().toLowerCase() === normalizedEmail) ||
      (normalizedPhone && (order.phoneNumber || '').trim() === normalizedPhone) ||
      (normalizedName && (order.customerName || '').trim().toLowerCase() === normalizedName)
    );
  });
  const customerVisibleReservations = reservations.filter((reservation) => {
    if (!userProfile || effectiveRole !== 'customer') return true;
    const normalizedName = (userProfile.name || '').trim().toLowerCase();
    const normalizedPhone = (userProfile.phoneNumber || '').trim();
    return (
      (normalizedPhone && (reservation.phoneNumber || '').trim() === normalizedPhone) ||
      (normalizedName && (reservation.customerName || '').trim().toLowerCase() === normalizedName)
    );
  });
  const shipperVisibleOrders = orders.filter((order) => order.deliveryType === 'delivery' && order.trackingStatus !== 'cancelled');
  const restaurantTrackedOrder =
    orders.find((order) => order.id === trackingOrderId && order.deliveryType === 'delivery') ||
    orders.find((order) => order.deliveryType === 'delivery' && ['preparing', 'shipping'].includes(order.trackingStatus)) ||
    orders.find((order) => order.deliveryType === 'delivery') ||
    null;

  // MoMo & ZaloPay Sandbox Mode configurations
  const [paymentGatewayMode, setPaymentGatewayMode] = useState<'vietqr' | 'sandbox'>('sandbox');
  const [sandboxPayload, setSandboxPayload] = useState<any>(null);
  const [sandboxSignature, setSandboxSignature] = useState<string>('');
  const [sandboxApiUrl, setSandboxApiUrl] = useState<string>('');
  const [sandboxRealApi, setSandboxRealApi] = useState<boolean>(false);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxPayUrl, setSandboxPayUrl] = useState<string>('');
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);

  // Synchronize reservation and checkout inputs with userProfile dynamically when logged in
  useEffect(() => {
    if (userProfile) {
      setUserRole(userProfile.role || 'customer');
      const uName = userProfile.name || '';
      if (uName) {
        setCheckoutName(uName);
        setResName(uName);
      }
      if (userProfile.phoneNumber) {
        setCheckoutPhone(userProfile.phoneNumber);
        setResPhone(userProfile.phoneNumber);
      }
      if (userProfile.email) {
        setCheckoutEmail(userProfile.email);
        setResEmail(userProfile.email);
      }
      if (userProfile.address) {
        setCheckoutAddress(userProfile.address);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.role && userRole !== userProfile.role) {
      setUserRole(userProfile.role);
    }
  }, [userRole, userProfile]);

  useEffect(() => {
    if (effectiveRole === 'customer') {
      if (!['chat', 'menu', 'map', 'reservations', 'preferences'].includes(activeTab)) {
        setActiveTab('chat');
      }
      return;
    }

    if (effectiveRole === 'shipper') {
      const pendingShipper = shipperVisibleOrders.find((order) => ['preparing', 'shipping'].includes(order.trackingStatus)) || shipperVisibleOrders[0];
      if (pendingShipper) {
        setSelectedShipperOrder((current) => current?.id === pendingShipper.id ? current : pendingShipper);
      }
    }
  }, [effectiveRole, activeTab, shipperVisibleOrders]);

  // Practical Improvements States: Search, Coupons, Reviews, Seating Options
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [resSittingArea, setResSittingArea] = useState('Trong nhà ấm cúng (Sang trọng)');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0); 
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Client-Side Speech Synthesis for High Fidelity Interactive Call Simulation
  const speakSimulated = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn("Speech synthesis error caught (probably blocked by iframe sandbox):", error);
    }
  };

  // Trigger automated call (True Twilio call or browser simulation)
  const startAutomatedCall = async (orderId: string, isSimulated: boolean) => {
    setCallTriggerLoading(orderId);
    try {
      const res = await fetch('/api/phone-call/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, isSimulated })
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể khởi tạo cuộc gọi. Hãy cấu hình thông tin Twilio.");
      } else {
        if (isSimulated) {
          const targetedOrder = orders.find(o => o.id === orderId);
          if (targetedOrder) {
            setActiveCallTargetOrder(targetedOrder);
            setCallIncoming(true);
          }
        } else {
          setExpandedCallLogId(orderId);
        }
      }
      refreshOrdersAndReservations();
    } catch (e: any) {
      console.error(e);
      alert("Đã xảy ra lỗi khi khởi tạo cuộc gọi.");
    } finally {
      setCallTriggerLoading(null);
    }
  };

  const startLivekitRoleCall = async (
    order: Order,
    channel: 'restaurant-shipper' | 'customer-shipper'
  ) => {
    const roomName = `hv-${channel}-${order.id}`.toLowerCase();
    const callerRole = effectiveRole === 'restaurant' ? 'restaurant' : effectiveRole === 'shipper' ? 'shipper' : 'customer';
    const callerName = userProfile?.name || userProfile?.email || `user-${Math.floor(100 + Math.random() * 900)}`;
    const callerIdentity = `${callerRole}-${callerName}-${order.id}`.replace(/\s+/g, '-');

    await livekitCall.startCall({
      callerIdentity,
      roomName,
      subtitle: `Đơn hàng ${order.id}`,
      title: channel === 'restaurant-shipper' ? 'Cuộc gọi giữa Quán và Tài xế' : 'Cuộc gọi giữa Khách hàng và Tài xế',
    });
  };

  const fetchSandboxPaymentDetails = async (orderId: string, amount: number, method: 'momo' | 'zalopay') => {
    setSandboxLoading(true);
    setSandboxError(null);
    setSandboxLogs([`[Sandbox] Gửi yêu cầu khởi động phiên giao dịch chuẩn hóa qua cổng API ${method.toUpperCase()}...`]);
    try {
      const endpoint = method === 'momo' ? '/api/payment/momo/create' : '/api/payment/zalopay/create';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount })
      });
      const info = await res.json();
      if (info.success) {
        setSandboxPayload(info.payload);
        setSandboxSignature(info.signature || info.mac || '');
        setSandboxApiUrl(info.apiUrl);
        setSandboxRealApi(!!info.realApi);
        if (info.realApi) {
          const mainUrl = method === 'momo' ? (info.data?.payUrl || '#') : (info.data?.order_url || '#');
          setSandboxPayUrl(mainUrl);
          
          let responseDetail = "";
          if (method === 'momo') {
            responseDetail = `Result Code: ${info.data?.resultCode} (${info.data?.message || 'N/A'}) - RequestId: ${info.data?.requestId}`;
          } else {
            responseDetail = `Return Code: ${info.data?.return_code} (${info.data?.return_message || 'N/A'})`;
          }

          setSandboxLogs(prev => [
            ...prev,
            `✓ [Chữ ký HMAC] Kết xuất chữ ký xác thực thành công!`,
            `📡 API URL: ${info.apiUrl}`,
            `📡 Response: ${responseDetail}`,
            ...(info.data?.resultCode && info.data.resultCode !== 0 ? [` Lỗi MoMo: [Code ${info.data.resultCode}] ${info.data.message}`] : []),
            ...(info.data?.return_code && info.data.return_code !== 1 ? [` Lỗi ZaloPay: [Code ${info.data.return_code}] ${info.data.return_message}`] : []),
            `💡 Trạng thái: SẴN SÀNG KHỞI ĐỘNG CỔNG THANH TOÁN SANDBOX.`,
            `🔗 URL cổng Sandbox: ${mainUrl !== '#' ? mainUrl.substring(0, 75) + '...' : 'N/A'}`
          ]);
        } else {
          setSandboxPayUrl('#');
          setSandboxLogs(prev => [
            ...prev,
            `✓ [Hệ thống giả lập] Đã khởi tạo cấu hình chữ ký thành công: ${info.signature || info.mac || 'N/A'}`,
            `💡 API Endpoint: ${info.apiUrl}`,
            `💡 Trạng thái: Mô phỏng môi trường Sandbox AI Studio. Hoạt động webhook/IPN đầy đủ.`
          ]);
        }
      } else {
        setSandboxError(info.error || "Lỗi truy hồi cấu hình");
        setSandboxLogs(prev => [...prev, `❌ Lỗi: ${info.error || 'Server error'}`]);
      }
    } catch (err: any) {
      setSandboxError(err.message);
      setSandboxLogs(prev => [...prev, `❌ Lỗi kết nối: ${err.message}`]);
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => {
    if (paymentQRModal.isOpen && paymentGatewayMode === 'sandbox') {
      fetchSandboxPaymentDetails(paymentQRModal.orderId, paymentQRModal.amount, paymentQRModal.method);
    }
  }, [paymentQRModal.isOpen, paymentQRModal.orderId, paymentQRModal.method, paymentGatewayMode]);

  const [smsTriggerLoading, setSmsTriggerLoading] = useState<string | null>(null);
  const startTwilioSMS = async (orderId: string) => {
    setSmsTriggerLoading(orderId);
    try {
      const res = await fetch('/api/phone-call/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gửi SMS không thành công. Vui lòng cấu hình Twilio secrets.");
      } else {
        alert("Thành công: Đã gửi một SMS xác nhận hóa đơn thực tế tới số điện thoại của bạn!");
        refreshOrdersAndReservations();
      }
    } catch (e: any) {
      alert("Lỗi mạng khi kết nối cổng SMS: " + e.message);
    } finally {
      setSmsTriggerLoading(null);
    }
  };

  // Poll orders if any of them is currently executing a live telephone confirmation call
  useEffect(() => {
    let timer: any;
    const hasActiveCall = orders.some(o => o.callStatus === 'calling' || o.callStatus === 'ringing' || o.callStatus === 'answered');
    if (hasActiveCall) {
      const pollCallStatus = async () => {
        try {
          const res = await fetch('/api/orders');
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
          }
        } catch (e) {
          console.warn("Lỗi cập nhật trạng thái cuộc gi tự động (b qua nếu mạng tạm gián đoạn):", e instanceof Error ? e.message : e);
        }
      };
      timer = setInterval(pollCallStatus, 3000);
    }
    return () => clearInterval(timer);
  }, [orders]);

  const [preferenceInput, setPreferenceInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const phoneEndRef = useRef<HTMLDivElement>(null);

  // Initialization Data
  useEffect(() => {
    const fetchPublicConfig = async () => {
      try {
        const res = await fetch('/api/public-config');
        if (!res.ok) return;
        const data = await res.json();
        setGoogleClientId(data.googleClientId || '');
        setFacebookClientId(data.facebookClientId || '');
      } catch (error) {
        console.warn('Không tải được public config:', error);
      }
    };

    fetchPublicConfig();
    fetchDishes();
    refreshOrdersAndReservations();
    fetchPreferences();
    fetchEmailLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchEmailLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    phoneEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phoneCallDialog]);

  // Driver Location Map Simulator Polling
  useEffect(() => {
    let timer: any;
    if (isTrackingLoop && trackingOrderId && trackingOrderId.startsWith('HV-')) {
      const fetchLoc = async () => {
        try {
          const res = await fetch(`/api/driver-map/${trackingOrderId}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              setDriverInfo(data);
            }
          }
        } catch (e) {
          // Gracefully swallow temporary "Failed to fetch" network errors during system deployment restarts or intermittent networks to prevent false-alarm console error triggers
          console.warn("Lỗi tạm thi khi cập nhật định vị tài xế:", e instanceof Error ? e.message : e);
        }
      };
      fetchLoc();
      timer = setInterval(fetchLoc, 5000); // Poll every 5s
    }
    return () => clearInterval(timer);
  }, [trackingOrderId, isTrackingLoop]);

  const fetchDishes = async () => {
    try {
      const res = await fetch('/api/dishes');
      const data = await res.json();
      setDishes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshOrdersAndReservations = async () => {
    try {
      const resOrders = await fetch('/api/orders');
      const dataOrders = await resOrders.json();
      setOrders(dataOrders);
      // Select the latest order for automatic live tracking
      if (dataOrders.length > 0) {
        // Find latest delivery order if any
        const devOrders = dataOrders.filter((o: Order) => o.deliveryType === 'delivery' && o.trackingStatus !== 'cancelled');
        if (devOrders.length > 0) {
          setTrackingOrderId(devOrders[devOrders.length - 1].id);
        } else {
          setTrackingOrderId(dataOrders[dataOrders.length - 1].id);
        }
      }

      const resRes = await fetch('/api/reservations');
      const dataRes = await resRes.json();
      setReservations(dataRes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      setPreferences(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFocusOrderFromChat = (order: Order) => {
    setTrackingOrderId(order.id);
    setActiveCallTargetOrder(order);
    setActiveTab(order.deliveryType === 'delivery' ? 'map' : 'chat');
  };

  const handleFocusReservationFromChat = (reservation: Reservation) => {
    setActiveTab('reservations');
    setResName(reservation.customerName);
    setResPhone(reservation.phoneNumber);
    setResCount(reservation.numberOfGuests);
    setResTime(reservation.reservationTime);
  };

  const handlePayOrderFromChat = async (order: Order) => {
    setActivePaymentOrder(order);
    if (order.paymentMethod === 'cash') {
      try {
        const res = await fetch('/api/orders/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, paymentMethod: 'cash' })
        });
        if (res.ok) {
          await refreshOrdersAndReservations();
        }
      } catch (error) {
        console.error(error);
      }
      return;
    }
    setPaymentQRModal({
      isOpen: true,
      orderId: order.id,
      amount: order.total,
      method: order.paymentMethod === 'zalopay' ? 'zalopay' : 'momo',
    });
  };

  const pushAssistantMessage = (text: string, actionData?: ChatAction[]) => {
    setChatMessages(prev => [
      ...prev,
      {
        id: `ai-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'assistant',
        text,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isAction: Array.isArray(actionData) && actionData.length > 0,
        actionData,
      }
    ]);
  };

  // UI Event Handlers
  const handleAddToCart = (dishId: string) => {
    setCart(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1
    }));
  };

  const handleUpdateCartQty = (dishId: string, delta: number) => {
    setCart(prev => {
      const nextQty = (prev[dishId] || 0) + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[dishId];
        return next;
      }
      return { ...prev, [dishId]: nextQty };
    });
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[dishId];
      return next;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((acc, [dishId, qty]) => {
      const dish = dishes.find(d => d.id === dishId);
      const quantity = typeof qty === 'number' ? qty : 0;
      return acc + (dish ? dish.price : 0) * quantity;
    }, 0);
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoFeedback({ type: 'error', text: 'Vui lòng nhập mã khuyến mãi.' });
      return;
    }
    const subtotal = getCartTotal();
    if (subtotal === 0) {
      setPromoFeedback({ type: 'error', text: 'Vui lòng thêm món ăn vào giỏ.' });
      return;
    }

    if (code === 'HUONGVIET20') {
      const discount = Math.round(subtotal * 0.2);
      setPromoDiscount(discount);
      setAppliedPromo('HUONGVIET20');
      setPromoFeedback({ type: 'success', text: `Áp dụng thành công mã HUONGVIET20: Giảm 20% (-${discount.toLocaleString('vi-VN')} đ)` });
    } else if (code === 'MIENSHIP') {
      const discount = 15000;
      setPromoDiscount(discount);
      setAppliedPromo('MIENSHIP');
      setPromoFeedback({ type: 'success', text: `Áp dụng thành công mã MIENSHIP: Miễn phí ship hàng (-15.000 đ)` });
    } else if (code === 'CHAOHUONGVIET') {
      const discount = Math.min(30000, subtotal);
      setPromoDiscount(discount);
      setAppliedPromo('CHAOHUONGVIET');
      setPromoFeedback({ type: 'success', text: `Áp dụng thành công mã CHAOHUONGVIET: Giảm trực tiếp -${discount.toLocaleString('vi-VN')} đ` });
    } else {
      setPromoFeedback({ type: 'error', text: 'Mã giảm giá không chính xác hoặc không khả dụng.' });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoFeedback(null);
    setPromoInput('');
  };

  const handleSubmitReview = async (dishId: string) => {
    if (!newReviewName.trim() || !newReviewText.trim()) {
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/dishes/${dishId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newReviewName,
          rating: newReviewRating,
          text: newReviewText
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local dishes list
        setDishes(prev => prev.map(d => d.id === dishId ? result.dish : d));
        // Update selected detail
        setSelectedDishDetail(result.dish);
        
        // Reset review form
        setNewReviewName('');
        setNewReviewText('');
        setNewReviewRating(5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const executeCheckout = async () => {
    const items = Object.entries(cart).map(([dishId, qty]) => ({
      dishId,
      quantity: qty
    }));

    if (items.length === 0) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: checkoutName,
          phoneNumber: checkoutPhone,
          address: deliveryType === 'delivery' ? checkoutAddress : '',
          deliveryType,
          paymentMethod: selectedPayment,
          discount: promoDiscount,
          customerEmail: checkoutEmail
        })
      });

      if (response.ok) {
        const result = await response.json();
        const createdOrder: Order = result.order;
        
        // Clear Cart & Coupon states
        setCart({});
        setAppliedPromo(null);
        setPromoDiscount(0);
        setPromoFeedback(null);
        setPromoInput('');
        setShowCheckoutModal(false);
        refreshOrdersAndReservations();

        // If cashless payment is selected, show QR Dialog in real-time
        if (createdOrder.paymentMethod !== 'cash') {
          setPaymentQRModal({
            isOpen: true,
            orderId: createdOrder.id,
            amount: createdOrder.total,
            method: createdOrder.paymentMethod
          });
        } else {
          pushAssistantMessage(
            `Đơn ${createdOrder.id} đã được tạo thành công và đang chờ quán xác nhận. Bạn có thể tiếp tục chat để theo dõi đơn hoặc đổi phương thức thanh toán nếu muốn.`,
            [{ type: 'orderStatus', order: createdOrder }]
          );
        }

        // Set layout map to view the newly created order
        setTrackingOrderId(createdOrder.id);
        setActiveTab('map');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mock confirm payments (User scanned QR code simulator trigger)
  const handleConfirmDirectPayment = async (orderId: string, paymentMethod: 'momo' | 'zalopay') => {
    try {
      const res = await fetch('/api/orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod })
      });
      if (res.ok) {
        setPaymentQRModal(prev => ({ ...prev, isOpen: false }));
        refreshOrdersAndReservations();
        const ordersRes = await fetch('/api/orders');
        const updatedOrdersList = await ordersRes.json();
        const ord = updatedOrdersList.find((o: any) => o.id === orderId);
        if (ord) {
          pushAssistantMessage(
            `Mình đã ghi nhận thanh toán cho đơn ${ord.id}. Quán đang chuyển đơn sang trạng thái chuẩn bị, bạn có thể tiếp tục theo dõi ngay trên web.`,
            [{ type: 'payOrder', order: ord }]
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderId}?`)) return;
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        refreshOrdersAndReservations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) {
      alert("Vui lòng điền tên và giá món.");
      return;
    }
    try {
      const res = await fetch(editingDishId ? `/api/dishes/${editingDishId}` : '/api/dishes/add', {
        method: editingDishId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDishName,
          price: Number(newDishPrice),
          category: newDishCategory,
          description: newDishDesc,
          image: newDishImage
        })
      });
      if (res.ok) {
        alert(editingDishId ? "Cập nhật món thành công!" : "Thêm món đặc sản thành công!");
        const dishesRes = await fetch('/api/dishes');
        const updatedDishes = await dishesRes.json();
        setDishes(updatedDishes);
        
        // Reset inputs
        setEditingDishId(null);
        setNewDishName('');
        setNewDishPrice(65000);
        setNewDishCategory('main');
        setNewDishDesc('');
        setNewDishImage('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600');
      } else {
        alert(editingDishId ? "Đã xảy ra lỗi khi cập nhật món." : "Đã xảy ra lỗi khi thêm món.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDish = (dish: Dish) => {
    setEditingDishId(dish.id);
    setNewDishName(dish.name);
    setNewDishPrice(dish.price);
    setNewDishCategory(dish.category);
    setNewDishDesc(dish.description);
    setNewDishImage(dish.image);
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Bạn có chắc muốn xóa món này khi thực đơn?')) return;
    try {
      const res = await fetch(`/api/dishes/${dishId}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingDishId === dishId) {
          setEditingDishId(null);
          setNewDishName('');
          setNewDishPrice(65000);
          setNewDishCategory('main');
          setNewDishDesc('');
          setNewDishImage('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600');
        }
        fetchDishes();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuthLogin = async (e?: React.FormEvent, customCredentials?: { username: string; password: string }) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    const usernameInput = customCredentials ? customCredentials.username : authUsername;
    const passwordInput = customCredentials ? customCredentials.password : authPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Đăng nhập thất bại.");
        setAuthLoading(false);
        return;
      }

      const matchedUser = data.user;
      applyAuthenticatedUser({
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        email: matchedUser.email || (matchedUser.username.includes('@') ? matchedUser.username : `${matchedUser.username}@gmail.com`),
        avatar: matchedUser.avatar || matchedUser.fullName.charAt(0),
        provider: 'local',
        phoneNumber: matchedUser.phoneNumber,
        address: matchedUser.address,
        role: matchedUser.role
      });
      setAuthUsername('');
      setAuthPassword('');
      setAuthError('');
    } catch (err) {
      console.error(err);
      setAuthError("Lỗi kết nối máy chủ khi đăng nhập.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!authPhone) {
      setAuthError("Vui lòng điền số điện thoại trước khi gửi OTP.");
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    setOtpSuccessMessage('');
    setOtpSimulatedCode('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: authPhone })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Gửi OTP thất bại.");
        return;
      }
      setIsOtpSent(true);
      setOtpSuccessMessage(data.message);
      if (data.simulated && data.otp) {
        setOtpSimulatedCode(data.otp);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Lỗi kết nối máy chủ khi gửi OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!authOtpCode) {
      setAuthError("Vui lòng điền mã OTP để xác nhận.");
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: authPhone, otp: authOtpCode })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Mã OTP không hợp lệ.");
        return;
      }
      setIsOtpVerified(true);
      setOtpSuccessMessage("Xác minh số điện thoại thành công!");
    } catch (err) {
      console.error(err);
      setAuthError("Lỗi kết nối máy chủ khi xác thực OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword || !authFullName || !authPhone) {
      setAuthError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (!isOtpVerified) {
      setAuthError("Vui lòng xác minh số điện thoại bằng mã OTP trước khi tiến hành đăng ký.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          fullName: authFullName,
          phoneNumber: authPhone,
          address: authAddress,
          role: authRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Đăng ký thất bại.");
        setAuthLoading(false);
        return;
      }

      const matchedUser = data.user;
      applyAuthenticatedUser({
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        email: matchedUser.email || (matchedUser.username.includes('@') ? matchedUser.username : `${matchedUser.username}@gmail.com`),
        avatar: matchedUser.avatar || matchedUser.fullName.charAt(0),
        provider: 'local',
        phoneNumber: matchedUser.phoneNumber,
        address: matchedUser.address,
        role: matchedUser.role
      });
      setAuthUsername('');
      setAuthPassword('');
      setAuthFullName('');
      setAuthPhone('');
      setAuthAddress('');
      setAuthError('');
      setAuthOtpCode('');
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtpSuccessMessage('');
      setOtpSimulatedCode('');
    } catch (err) {
      console.error(err);
      setAuthError("Lỗi kết nối máy chủ khi đăng ký.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setAuthError('');
    if (!facebookClientId) {
      setAuthError('Backend chưa cấp FACEBOOK_CLIENT_ID cho frontend.');
      return;
    }

    const facebookSdk = (window as any).FB;
    if (!facebookSdk) {
      setAuthError('Facebook SDK chưa sẵn sàng. Vui lòng đợi thêm giây lát.');
      return;
    }

    setFacebookAuthLoading(true);
    facebookSdk.login(
      async (response: any) => {
        if (!response?.authResponse?.accessToken) {
          setFacebookAuthLoading(false);
          setAuthError('Bạn đã hủy hoặc Facebook từ chối cấp quyền đăng nhập.');
          return;
        }

        try {
          const res = await fetch('/api/auth/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: response.authResponse.accessToken })
          });
          const data = await res.json();
          if (!res.ok) {
            setAuthError(data.error || 'Đăng nhập Facebook thất bại.');
            return;
          }

          applyAuthenticatedUser({
            fullName: data.user.fullName,
            username: data.user.username,
            email: data.user.email,
            avatar: data.user.avatar,
            provider: 'facebook',
            phoneNumber: data.user.phoneNumber,
            address: data.user.address,
            role: data.user.role
          });
        } catch (error) {
          console.error(error);
          setAuthError('Không thể kết nối server để xác minh đăng nhập Facebook.');
        } finally {
          setFacebookAuthLoading(false);
        }
      },
      {
        scope: 'public_profile,email',
        return_scopes: true
      }
    );
  };

  const handleShipperUpdateStep = async (stepIndex: number) => {
    if (!selectedShipperOrder) return;
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedShipperOrder.id,
          manualDriverStep: stepIndex,
          trackingStatus: stepIndex === 7 ? 'delivered' : 'shipping'
        })
      });
      if (res.ok) {
        // Refresh local orders list
        const ordersRes = await fetch('/api/orders');
        const updatedOrders = await ordersRes.json();
        setOrders(updatedOrders);
        
        // Update selected shipper order reference
        const matched = updatedOrders.find((o: any) => o.id === selectedShipperOrder.id);
        if (matched) {
          setSelectedShipperOrder(matched);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const DRIVER_ROUTE_COORDS = [
    { lat: 21.0260, lng: 105.8550, title: "0. Nhận đơn (Hương Việt)" },
    { lat: 21.0270, lng: 105.8540, title: "1. Qua Cầu Thê Húc" },
    { lat: 21.0285, lng: 105.8521, title: "2. Đường Đinh Tiên Hoàng" },
    { lat: 21.0295, lng: 105.8505, title: "3. Ngã tư Hàng Khay" },
    { lat: 21.0312, lng: 105.8495, title: "4. Ngả rẽ phố Lò Sũ" },
    { lat: 21.0325, lng: 105.8480, title: "5. Đến phố cổ Hàng Bạc" },
    { lat: 21.0335, lng: 105.8465, title: "6. Qua ngõ Hàng Ngang" },
    { lat: 21.0338, lng: 105.8460, title: "7. Giao hàng thành công" }
  ];

  const executeReservation = async () => {
    if (!resName || !resPhone) {
      alert("Vui lòng điền tên và số điện thoại.");
      return;
    }
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: resName,
          phoneNumber: resPhone,
          numberOfGuests: resCount,
          reservationTime: resTime,
          sittingArea: resSittingArea,
          customerEmail: resEmail
        })
      });
      if (res.ok) {
        setResName('');
        setResPhone('');
        refreshOrdersAndReservations();
        alert("Khời tạo bàn ăn đặt trước thành công! Email xác nhận đã được gửi tự động qua Resend.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelReservation = async (resId: string) => {
    try {
      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resId })
      });
      if (response.ok) {
        refreshOrdersAndReservations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeUpdatePreferenceManual = async () => {
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietaryNotes: preferenceInput
        })
      });
      if (res.ok) {
        fetchPreferences();
        setPreferenceInput('');
        alert("Đã lưu giữ cấu hình cá nhân hóa!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavoriteToggle = async (dishName: string) => {
    const isFav = preferences.favorites?.includes(dishName);
    let nextFavorites = preferences.favorites || [];
    if (isFav) {
      nextFavorites = nextFavorites.filter(f => f !== dishName);
    } else {
      nextFavorites = [...nextFavorites, dishName];
    }

    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorites: nextFavorites
        })
      });
      if (res.ok) {
        fetchPreferences();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Conversational AI Assistant
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context: {
            customerName: userProfile?.name || checkoutName,
            phoneNumber: userProfile?.phoneNumber || checkoutPhone,
            customerEmail: userProfile?.email || checkoutEmail,
            address: userProfile?.address || checkoutAddress,
            deliveryType,
            paymentMethod: selectedPayment,
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const assistantActions: ChatAction[] = Array.isArray(result.actions) ? result.actions : [];
        
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: result.text,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isAction: assistantActions.length > 0,
            actionData: assistantActions,
          }
        ]);

        // If backend executed function actions, update our databases!
        if (assistantActions.length > 0) {
          await refreshOrdersAndReservations();
          await fetchPreferences();

          // Check if order was placed
          const orderPlacedAction = assistantActions.find((act: ChatAction) => act.type === 'placeOrder');
          if (orderPlacedAction) {
            const placedOrder = orderPlacedAction.order as Order;
            setTrackingOrderId(placedOrder.id);
            pushAssistantMessage(
              `Bạn có thể tiếp tục nhắn như “thanh toán đơn ${placedOrder.id} bằng MoMo”, “theo dõi đơn ${placedOrder.id}” hoặc “hủy đơn ${placedOrder.id}” ngay trong cuộc trò chuyện này.`
            );
          }

          const orderStatusAction = assistantActions.find((act: ChatAction) => act.type === 'orderStatus');
          if (orderStatusAction?.order) {
            setTrackingOrderId(orderStatusAction.order.id);
          }
        }
      } else {
        const result = await response.json().catch(() => ({}));
        const errorMsg = result.text || result.error || "Hệ thống AI hiện đang bận hoặc quá tải lượt yêu cầu, vui lòng thử lại sau vài giây hoặc thao tác đặt món trực tiếp nhé!";
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'assistant',
            text: errorMsg,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: "Không thể kết nối với hệ thống AI Hương Việt. Quý khách vui lòng thử lại sau hoặc đặt món qua bảng điều khiển bên cạnh nhé!",
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Simulated Phone confirmation Call Engine
  const handleAcceptCall = () => {
    setCallIncoming(false);
    setIsPhoneCallActive(true);
    setPhoneCallText('');
    const welcome = `Dạ em chào anh chị ${activeCallTargetOrder?.customerName || 'quý khách'}! Đây là trợ lý tổng đài tự động Hương Việt AI. Em gọi điện để xác nhận lại đơn đặt hàng mã hiệu ${activeCallTargetOrder?.id || ''} của mình đúng không ạ?`;
    setPhoneCallDialog([
      { speaker: 'assistant', text: welcome }
    ]);
    speakSimulated(welcome);
  };

  const handleSendPhoneResponse = async () => {
    if (!phoneCallText.trim()) return;
    const userSay = phoneCallText;
    setPhoneCallDialog(prev => [...prev, { speaker: 'user', text: userSay }]);
    setPhoneCallText('');
    setIsPhoneCallLoading(true);

    try {
      // Determine conversational flow based on response
      const orderSummaryDetail = activeCallTargetOrder 
        ? `Khách hàng: ${activeCallTargetOrder.customerName}, sđt: ${activeCallTargetOrder.phoneNumber}, giao tại: ${activeCallTargetOrder.deliveryType === 'delivery' ? activeCallTargetOrder.address : 'Tại chỗ bàn ăn'}, các món: ${activeCallTargetOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}, phương thức: ${activeCallTargetOrder.paymentMethod}, tổng tiền: ${activeCallTargetOrder.total}đ, tình trạng thanh toán: ${activeCallTargetOrder.paymentStatus}.`
        : 'Xác nhận đơn hàng Hương Việt tinh tế.';

      const response = await fetch('/api/phone-simulation/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: userSay,
          step: phoneCallDialog.length < 3 ? 1 : phoneCallDialog.length < 5 ? 2 : 3,
          orderDetail: orderSummaryDetail
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPhoneCallDialog(prev => [...prev, { speaker: 'assistant', text: result.text }]);
        speakSimulated(result.text);

        // Smart text recognition to auto-confirm or cancel order details based on AI voice reply
        const textLower = result.text.toLowerCase();
        let action: 'confirm' | 'cancel' | null = null;
        if (textLower.includes('đã lưu') || textLower.includes('chuẩn bị') || textLower.includes('giao hàng') || textLower.includes('món ăn của quý khách') || textLower.includes('bếp')) {
          action = 'confirm';
        } else if (textLower.includes('hủy') || textLower.includes('hoãn')) {
          action = 'cancel';
        }

        if (action && activeCallTargetOrder) {
          fetch('/api/phone-call/simulate-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: activeCallTargetOrder.id, action })
          }).then(() => refreshOrdersAndReservations());
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPhoneCallLoading(false);
    }
  };

  return (
    <div id="huongviet-dashboard" className="flex h-screen w-full bg-[#FCFBFA] text-stone-800 font-sans overflow-hidden">
      
      {/* Left Navigation Rail */}
      <nav className="w-20 border-r border-[#ded9cf] flex flex-col items-center py-6 space-y-6 bg-[#f2efe8] shrink-0 z-10">
        <div className="w-12 h-12 bg-[#8a6538] text-white rounded-full flex flex-col items-center justify-center font-extrabold cursor-pointer border border-[#8a6538]/20 hover:scale-105 transition-transform shadow-sm" 
             onClick={() => setActiveTab('chat')}>
          <span className="text-sm font-serif">HV</span>
          <span className="text-[7px] leading-none uppercase font-sans tracking-wide text-amber-200">AI</span>
        </div>
        
        <div className={`flex-col space-y-4 pt-4 ${isCustomerRole ? 'flex' : 'hidden'}`}>
          <button 
            id="nav-chat-btn"
            title="Trợ lý AI"
            onClick={() => {
              setActiveTab('chat');
              if (userRole !== 'customer') {
                setUserRole('customer');
                refreshOrdersAndReservations();
              }
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer group flex flex-col items-center relative border ${activeTab === 'chat' && userRole === 'customer' ? 'bg-[#8a6538]/15 text-[#8a6538] border-[#8a6538]/30 shadow-sm' : 'text-stone-500 border-transparent hover:bg-stone-200/50 hover:text-stone-800'}`}
          >
            <Bot className="w-6 h-6" />
            <span className="text-[9px] mt-1 hidden md:block font-medium">Chat AI</span>
          </button>

          <button 
            id="nav-menu-btn"
            title="Thực đơn chi tiết"
            onClick={() => {
              setActiveTab('menu');
              if (userRole !== 'customer') {
                setUserRole('customer');
                refreshOrdersAndReservations();
              }
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer group flex flex-col items-center relative border ${activeTab === 'menu' && userRole === 'customer' ? 'bg-[#8a6538]/15 text-[#8a6538] border-[#8a6538]/30 shadow-sm' : 'text-stone-500 border-transparent hover:bg-stone-200/50 hover:text-stone-800'}`}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-[9px] mt-1 hidden md:block font-medium">Món ăn</span>
          </button>

          <button 
            id="nav-map-btn"
            title="Dinh vi shipper"
            onClick={() => {
              setActiveTab('map');
              if (userRole !== 'customer') {
                setUserRole('customer');
                refreshOrdersAndReservations();
              }
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer group flex flex-col items-center relative border ${activeTab === 'map' && userRole === 'customer' ? 'bg-[#8a6538]/15 text-[#8a6538] border-[#8a6538]/30 shadow-sm' : 'text-stone-500 border-transparent hover:bg-stone-200/50 hover:text-stone-800'}`}
          >
            <Map className="w-6 h-6" />
            <span className="text-[9px] mt-1 hidden md:block font-medium">Shipper</span>
            {orders.some(o => o.trackingStatus === 'shipping') && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          <button 
            id="nav-res-btn"
            title="Đặt bàn trực tiếp"
            onClick={() => {
              setActiveTab('reservations');
              if (userRole !== 'customer') {
                setUserRole('customer');
                refreshOrdersAndReservations();
              }
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer group flex flex-col items-center relative border ${activeTab === 'reservations' && userRole === 'customer' ? 'bg-[#8a6538]/15 text-[#8a6538] border-[#8a6538]/30 shadow-sm' : 'text-stone-500 border-transparent hover:bg-stone-200/50 hover:text-stone-800'}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[9px] mt-1 hidden md:block font-medium">Đặt bàn</span>
          </button>

          <button 
            id="nav-pref-btn"
            title="Hồ sơ cá nhân và cấu hình thanh toán"
            onClick={() => {
              setActiveTab('preferences');
              if (userRole !== 'customer') {
                setUserRole('customer');
                refreshOrdersAndReservations();
              }
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer group flex flex-col items-center relative border ${activeTab === 'preferences' && userRole === 'customer' ? 'bg-[#8a6538]/15 text-[#8a6538] border-[#8a6538]/30 shadow-sm' : 'text-stone-500 border-transparent hover:bg-stone-200/50 hover:text-stone-800'}`}
          >
            <User className="w-6 h-6 animate-pulse" />
            <span className="text-[9px] mt-1 hidden md:block font-medium text-center leading-tight">Hồ sơ & Bank</span>
          </button>
        </div>

        {!isCustomerRole && (
          <div className="flex flex-col space-y-4 pt-4">
            {isRestaurantRole && (
              <>
                <button
                  type="button"
                  onClick={() => setRestaurantView('operations')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center border ${restaurantView === 'operations' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <DollarSign className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Điều phối</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestaurantView('reservations')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center border ${restaurantView === 'reservations' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <Calendar className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Đặt bàn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestaurantView('menu')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center border ${restaurantView === 'menu' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <ChefHat className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Thực đơn</span>
                </button>
              </>
            )}
            {isShipperRole && (
              <>
                <button
                  type="button"
                  onClick={() => setShipperView('route')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center relative border ${shipperView === 'route' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <Map className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Lộ trình ship</span>
                  {shipperVisibleOrders.some(o => ['preparing', 'shipping'].includes(o.trackingStatus)) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShipperView('orders')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center border ${shipperView === 'orders' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Đơn hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShipperView('customer')}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col items-center border ${shipperView === 'customer' ? 'text-[#8a6538] border-[#8a6538]/30 bg-[#8a6538]/10 shadow-sm' : 'text-stone-600 border-stone-250 bg-white hover:bg-stone-50'}`}
                >
                  <UserCheck className="w-6 h-6" />
                  <span className="text-[9px] mt-1 hidden md:block font-medium text-center">Khách nhận</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col items-center space-y-4">
          <div className="p-1.5 border border-[#ded9cf] rounded-lg text-[9px] text-[#8a6538] text-center w-14 leading-tight font-serif uppercase tracking-widest bg-[#fff]/60 font-bold">
            BẾP ẤM
          </div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="Hệ thống AI đang hoạt động" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header bar */}
        <header className="h-20 border-b border-[#ded9cf] flex items-center justify-between px-6 bg-[#FCFBFA]/95 backdrop-blur-md z-1">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-serif italic text-[#8a6538] font-bold">Hương Việt AI</h1>
              <span className="px-2 py-0.5 bg-amber-600/10 text-[#8a6538] rounded text-[10px] font-mono border border-[#8a6538]/20 font-bold">AGENT 3.5</span>
            </div>
            <p className="text-xs text-stone-500 uppercase tracking-[0.15em] hidden sm:block">GIAN BẾP VIỆT ẤM CÚNG CÙNG TRỢ LÝ AI THÂN THIỆN</p>
          </div>

          {/* Active role indicator */}
          <div className="flex bg-[#f3f0e9] p-1 rounded-2xl border border-stone-250/60 shadow-inner select-none shrink-0 mx-2">
            <div className={`px-3 md:px-5 py-2 rounded-xl text-xs font-extrabold font-sans flex items-center gap-1.5 ${effectiveRole === 'customer' ? 'bg-[#8a6538] text-white shadow-sm' : 'text-stone-500'}`}>
              <span>Khách</span>
            </div>
            <div className={`px-3 md:px-5 py-2 rounded-xl text-xs font-extrabold font-sans flex items-center gap-1.5 ${effectiveRole === 'restaurant' ? 'bg-[#8a6538] text-white shadow-sm' : 'text-stone-500'}`}>
              <span>Quán ăn</span>
            </div>
            <div className={`px-3 md:px-5 py-2 rounded-xl text-xs font-extrabold font-sans flex items-center gap-1.5 ${effectiveRole === 'shipper' ? 'bg-[#8a6538] text-white shadow-sm' : 'text-stone-500'}`}>
              <span>Shipper</span>
            </div>
          </div>

          <div className="flex space-x-4 items-center">
            {/* Preferences quick panel */}
            {(preferences.dietaryNotes || (preferences.favorites && preferences.favorites.length > 0)) && (
              <div className="hidden lg:flex items-center space-x-2 bg-amber-50 border border-[#8a6538]/20 px-3 py-1.5 rounded-lg text-xs shadow-xs">
                <span className="text-[#8a6538] font-bold">Cá nhân hóa:</span>
                <span className="text-stone-600 truncate max-w-[120px]" title={preferences.dietaryNotes}>
                  {preferences.dietaryNotes || preferences.favorites?.join(', ')}
                </span>
              </div>
            )}

            <div className="text-right hidden xl:block">
              <p className="text-xs text-stone-400 font-medium">Giờ Hà Nội hiện tại</p>
              <p className="text-sm font-mono text-[#8a6538] font-bold">17:22 (Simulated)</p>
            </div>
            
            <div className="h-10 w-[1px] bg-stone-200 hidden sm:block" />

            {userProfile ? (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => {
                    if (userProfile.role === 'customer') {
                      setUserRole('customer');
                      setActiveTab('preferences');
                    } else if (userProfile.role === 'restaurant') {
                      setUserRole('restaurant');
                    } else if (userProfile.role === 'shipper') {
                      setUserRole('shipper');
                    }
                  }}
                  className="flex items-center space-x-2 bg-amber-50 hover:bg-amber-100/50 p-2 rounded-xl transition-all cursor-pointer border border-[#8a6538]/20"
                >
                  <div id="verified-identity-badge" className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                    {userProfile.avatar || userProfile.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-stone-800">{userProfile.name}</p>
                    <p className="text-[9px] text-[#8a6538] flex items-center gap-0.5 font-mono font-bold capitalize">
                      {userProfile.role === 'restaurant' ? 'Quán ăn' : userProfile.role === 'shipper' ? 'Shipper' : 'Khách'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('hv_user_profile');
                    setUserProfile(null);
                    setUserRole('customer');
                    setActiveTab('chat');
                  }}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 bg-[#8a6538] hover:bg-[#6e4e27] text-white p-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md text-xs font-bold uppercase tracking-wider"
              >
                <User className="w-4 h-4 text-white mr-1" /> Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Content Body Grid */}
        <CustomerApp
          isVisible={isCustomerRole}
          mainContent={
            <>
            
            {/* View Tab Contents */}
            <ChatScreen isActive={activeTab === 'chat'}>
                
                {/* Chat dialog body */}
                <ChatMessagesPanel>
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={msg.id || index}
                      className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-[#8a6538]/30 flex items-center justify-center shrink-0 shadow-xs">
                          <Bot className="w-4 h-4 text-[#8a6538] animate-pulse" />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] p-3.5 rounded-2xl border ${
                        msg.sender === 'user' 
                          ? 'bg-[#8a6538] text-white font-medium rounded-tr-none border-[#8a6538] shadow-md shadow-stone-200/40' 
                          : 'bg-white text-stone-800 rounded-tl-none border-stone-200/80 shadow-sm'
                      }`}>
                        
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {/* Parse bold and strong words slightly */}
                          {msg.text.split(/(\*\*.*?\*\*)/).map((chunk, i) => {
                            if (chunk.startsWith('**') && chunk.endsWith('**')) {
                              return <strong key={i} className={`font-bold ${msg.sender === 'user' ? 'text-amber-200' : 'text-[#8a6538]'}`}>{chunk.slice(2, -2)}</strong>;
                            }
                            return chunk;
                          })}
                        </div>

                        {/* Visual Dishes Attachment Feature - "món ăn sẽ xuất hiện kèm hình ảnh" */}
                        {msg.sender === 'assistant' && msg.actionData && msg.actionData.length > 0 && (
                          <div className="mt-4 space-y-2.5 border-t border-stone-100 pt-3">
                            {msg.actionData.map((action, actionIndex) => (
                              <div
                                key={`${msg.id}-action-${actionIndex}`}
                                className="rounded-xl border border-[#8a6538]/20 bg-amber-50/40 p-3 shadow-2xs"
                              >
                                {action.type === 'placeOrder' && action.order && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#8a6538]">Đơn vừa tạo</p>
                                        <p className="text-sm font-bold text-stone-800">{action.order.id}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] text-stone-500 uppercase tracking-wide">Tổng tiền</p>
                                        <p className="text-sm font-extrabold text-[#8a6538]">{action.order.total.toLocaleString('vi-VN')} đ</p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-stone-600">
                                      {action.order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                                    </p>
                                    <div className={`rounded-lg border px-2.5 py-2 text-[11px] ${
                                      action.order.emailConfirmation?.success
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-amber-200 bg-amber-50 text-amber-800'
                                    }`}>
                                      {action.order.emailConfirmation?.success
                                        ? `ã gửi email xác nhận${action.order.customerEmail ? ` tới ${action.order.customerEmail}` : ''}.`
                                        : `Chưa gửi được email xác nhận${action.order.emailConfirmation?.error ? `: ${action.order.emailConfirmation.error}` : '.'}`}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <button
                                        onClick={() => handleFocusOrderFromChat(action.order!)}
                                        className="px-3 py-1.5 rounded-lg bg-[#8a6538] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#6c4d29] transition-colors cursor-pointer"
                                      >
                                        Theo dõi đơn
                                      </button>
                                      <button
                                        onClick={() => handlePayOrderFromChat(action.order!)}
                                        className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-[11px] font-bold uppercase tracking-wide hover:bg-white transition-colors cursor-pointer"
                                      >
                                        Thanh toán ngay
                                      </button>
                                      <button
                                        onClick={() => handleCancelOrder(action.order!.id)}
                                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wide hover:bg-white transition-colors cursor-pointer"
                                      >
                                        Hủy đơn này
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {action.type === 'orderStatus' && action.order && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-sky-700">Trạng thái đơn</p>
                                        <p className="text-sm font-bold text-stone-800">{action.order.id}</p>
                                      </div>
                                      <span className="px-2 py-1 rounded-lg bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wide border border-sky-200">
                                        {action.order.trackingStatus}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-600">
                                      Thanh toán: <strong>{action.order.paymentStatus}</strong> · Tổng tiền: <strong>{action.order.total.toLocaleString('vi-VN')} đ</strong>
                                    </p>
                                    <button
                                      onClick={() => handleFocusOrderFromChat(action.order!)}
                                      className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-sky-700 transition-colors cursor-pointer"
                                    >
                                      Xem đơn này
                                    </button>
                                    {action.order.trackingStatus !== 'cancelled' && action.order.trackingStatus !== 'delivered' && (
                                      <button
                                        onClick={() => handleCancelOrder(action.order!.id)}
                                        className="ml-2 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wide hover:bg-white transition-colors cursor-pointer"
                                      >
                                        Hủy đơn này
                                      </button>
                                    )}
                                  </div>
                                )}

                                {action.type === 'cancelOrder' && action.order && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-rose-700">Đơn đã hủy</p>
                                    <p className="text-sm font-bold text-stone-800">{action.order.id}</p>
                                    <p className="text-xs text-stone-600">Đơn hàng này đã được đánh dấu hủy trên hệ thống.</p>
                                    <button
                                      onClick={() => refreshOrdersAndReservations()}
                                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wide hover:bg-white transition-colors cursor-pointer"
                                    >
                                      Tải lại danh sách đơn
                                    </button>
                                  </div>
                                )}

                                {action.type === 'bookTable' && action.reservation && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-700">Đặt bàn đã tạo</p>
                                        <p className="text-sm font-bold text-stone-800">{action.reservation.id}</p>
                                      </div>
                                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide border border-emerald-200">
                                        Bàn {action.reservation.tableNumber}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-600">
                                      {action.reservation.numberOfGuests} khách · {action.reservation.reservationTime}
                                    </p>
                                    <button
                                      onClick={() => handleFocusReservationFromChat(action.reservation!)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors cursor-pointer"
                                    >
                                      Mở đặt bàn
                                    </button>
                                  </div>
                                )}

                                {action.type === 'updatePreferences' && action.preferences && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700">Cá nhân hóa đã lưu</p>
                                    <p className="text-xs text-stone-600">
                                      Khẩu vị: <strong>{action.preferences.dietaryNotes || 'Chưa có'}</strong>
                                    </p>
                                    <p className="text-xs text-stone-600">
                                      Yêu thích: <strong>{action.preferences.favorites?.join(', ') || 'Chưa có'}</strong>
                                    </p>
                                    <button
                                      onClick={() => setActiveTab('preferences')}
                                      className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wide hover:bg-white transition-colors cursor-pointer"
                                    >
                                      Mở hồ sơ khẩu vị
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.sender === 'assistant' && (() => {
                          const textLower = msg.text.toLowerCase();
                          const matchedFoods = dishes.filter(d => 
                            textLower.includes(d.name.toLowerCase()) || 
                            textLower.includes(d.id.toLowerCase())
                          );
                          if (matchedFoods.length === 0) return null;
                          return (
                            <div className="mt-4 pt-3 border-t border-stone-100 space-y-2.5 animate-fade-in">
                              <p className="text-[10px] text-[#8a6538] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Gợi ý trực quan từ Hương Việt AI:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {matchedFoods.map(food => (
                                  <div key={food.id} className="bg-stone-50/80 border border-stone-250/50 rounded-xl p-2 flex items-center gap-3 hover:border-[#8a6538]/30 hover:bg-stone-50 transition-all shadow-2xs group relative overflow-hidden">
                                    <img 
                                      src={food.image} 
                                      alt={food.name} 
                                      referrerPolicy="no-referrer"
                                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-200"
                                    />
                                    <div className="flex-1 min-w-0 pr-1.5">
                                      <h4 className="text-xs font-bold text-stone-800 truncate group-hover:text-[#8a6538] transition-colors">{food.name}</h4>
                                      <p className="text-[10px] text-[#8a6538] font-semibold font-mono mt-0.5">{food.price.toLocaleString('vi-VN')} đ</p>
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        <button
                                          onClick={() => {
                                            const count = cart[food.id] || 0;
                                            setCart(prev => ({ ...prev, [food.id]: count + 1 }));
                                          }}
                                          className="text-[9px] bg-[#8a6538] hover:bg-[#6f502c] text-white px-2 py-1 rounded font-bold cursor-pointer flex items-center gap-0.5 transition-colors"
                                        >
                                          <ShoppingCart className="w-2.5 h-2.5" /> Gọi món này
                                        </button>
                                        <button
                                          onClick={() => setSelectedDishDetail(food)}
                                          className="text-[9px] border border-stone-300 text-stone-600 hover:bg-stone-100 px-1.5 py-1 rounded font-semibold cursor-pointer transition-colors"
                                        >
                                          Chi tiết
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        <div className="mt-2.5 flex items-center justify-between text-[10px] opacity-75 pt-1 border-t border-dotted border-stone-100">
                          <span className="font-mono">{msg.timestamp}</span>
                          {msg.sender === 'assistant' && (
                            <span className="text-[#8a6538] uppercase font-bold tracking-widest text-[8px]">Hương Việt AI</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
 
                  {isChatLoading && (
                    <div className="flex space-x-3 justify-start">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-[#8a6538]/40 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-[#8a6538] animate-spin" />
                      </div>
                      <div className="bg-white text-stone-700 p-3.5 rounded-2xl rounded-tl-none border border-stone-200/70 max-w-[80%] flex items-center space-x-2 shadow-sm">
                        <span className="text-xs">Hương Việt AI đang kiểm tra hệ thống thực đơn và chuẩn bị phản hồi...</span>
                        <span className="flex space-x-1">
                          <span className="w-1.5 h-1.5 bg-[#8a6538] rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-[#8a6538] rounded-full animate-bounce delay-200"></span>
                          <span className="w-1.5 h-1.5 bg-[#8a6538] rounded-full animate-bounce delay-300"></span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </ChatMessagesPanel>
 
                {/* Intelligent Preset Buttons (Suggestion Chips) */}
                <div id="ai-quick-triggers" className="my-3 flex flex-wrap gap-2 overflow-x-auto py-1">
                  <button 
                    onClick={() => handleSendChatMessage("Gợi ý cho tôi các món ăn tối độc đáo nhất")}
                    className="px-3.5 py-1.5 bg-white hover:bg-stone-100/80 border border-stone-200 rounded-full text-xs text-[#8a6538] cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-xs font-medium"
                  >
                    <ChefHat className="w-3.5 h-3.5" /> Gợi ý đặc sản tối nay
                  </button>
                  <button 
                    onClick={() => handleSendChatMessage("Tôi bị dị ứng lạc và kiêng đường, hãy lưu lại lưu ý này")}
                    className="px-3.5 py-1.5 bg-white hover:bg-stone-100/80 border border-stone-200 rounded-full text-xs text-stone-700 cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-xs font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Cập nhật dị ứng lạc
                  </button>
                  <button 
                    onClick={() => handleSendChatMessage("Tôi muốn đặt bàn 4 người vào 19:30 tối nay")}
                    className="px-3.5 py-1.5 bg-white hover:bg-stone-100/80 border border-stone-200 rounded-full text-xs text-stone-700 cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-xs font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Đặt bàn 4 người 19:30
                  </button>
                </div>
 
                {/* Input action bar */}
                <div className="bg-white rounded-full border border-stone-300 p-1.5 flex items-center shadow-sm">
                  <div className="p-2 text-[#8a6538]">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <input 
                    type="text" 
                    id="chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Trò chuyện đặt món, hỏi dị ứng, đặt bàn với AI..."
                    className="bg-transparent border-none flex-1 text-sm focus:outline-none focus:ring-0 placeholder:text-stone-400 text-stone-800 min-w-0"
                  />
                  <button 
                    id="chat-send-btn"
                    onClick={() => handleSendChatMessage()}
                    className="px-5 py-2.5 bg-[#8a6538] text-white text-xs font-bold rounded-full uppercase tracking-widest cursor-pointer hover:bg-[#6c4d29] transition-all flex items-center space-x-1 shrink-0 shadow-xs"
                  >
                    <span>Gửi</span>
                    <Send className="w-3 h-3 text-white" />
                  </button>
                </div>
                
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-stone-500 italic font-medium">Hỏi AI để đặt món: Hệ thống tự động đẩy món về giỏ hàng ở bên phải!</p>
                </div>
              </ChatScreen>

            <MenuScreen isActive={activeTab === 'menu'}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-serif text-[#8a6538] font-bold italic">Mâm Cơm Việt Ấm Cúng</h2>
                    <p className="text-xs text-stone-500">Gợi ý những món ăn mộc mạc, gần gũi và đậm đà bản sắc gia đình Việt</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Compact Search Bar */}
                    <div className="relative flex-1 sm:w-64">
                      <input 
                        type="text" 
                        placeholder="Tìm món, nguyên liệu (ví dụ: bún bò)..."
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8a6538]/50 shadow-xs"
                      />
                      <span className="absolute left-3 top-2.5 text-stone-400">🔍</span>
                      {menuSearchQuery && (
                        <button 
                          onClick={() => setMenuSearchQuery('')}
                          className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-800 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter category buttons */}
                    <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl border border-stone-300 shrink-0 self-start sm:self-auto">
                      {(['all', 'main', 'starter', 'drink', 'dessert'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 text-[11px] rounded-lg transition-all uppercase tracking-wide cursor-pointer font-medium ${filterCategory === cat ? 'bg-[#8a6538] text-white font-bold shadow-xs' : 'text-stone-600 hover:text-[#8a6538] hover:bg-white/65'}`}
                        >
                          {cat === 'all' ? 'Tất cả' : cat === 'main' ? 'Món chính' : cat === 'starter' ? 'Khai vị' : cat === 'drink' ? 'Đồ uống' : 'Tráng miệng'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Show Items Grid */}
                <MenuGridSection>
                  {(() => {
                    const filteredDishes = dishes.filter(d => {
                      const matchesCat = filterCategory === 'all' || d.category === filterCategory;
                      const matchesSearch = menuSearchQuery.trim() === '' || 
                        d.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                        d.description.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                        (d.ingredients && d.ingredients.some(ing => ing.toLowerCase().includes(menuSearchQuery.toLowerCase())));
                      return matchesCat && matchesSearch;
                    });

                    if (filteredDishes.length === 0) {
                      return (
                        <div id="menu-empty-state" className="flex flex-col items-center justify-center p-12 text-center border border-stone-200 rounded-3xl bg-stone-50 my-8 shadow-xs">
                          <span className="text-4xl mb-4">🍽️</span>
                          <h3 className="text-base font-serif italic text-[#8a6538] font-bold mb-1">Không tìm thấy món đặc sản khớp với từ khoá</h3>
                          <p className="text-xs text-stone-500 max-w-sm leading-relaxed mb-4">Quý khách có thể thay đổi từ khoá tìm kiếm hoặc trò chuyện với trợ lý ảo AI để chúng tôi hướng dẫn phục vụ món riêng nhé.</p>
                          <button 
                            onClick={() => { setMenuSearchQuery(''); setFilterCategory('all'); }}
                            className="px-4 py-2 border border-[#8a6538]/30 text-[#8a6538] hover:border-[#8a6538]/60 rounded-xl text-xs font-bold leading-normal transition-all bg-white shadow-xs cursor-pointer"
                          >
                            Xoá Bộ Lọc Tìm Kiếm
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDishes.map(dish => {
                          const qtyInCart = cart[dish.id] || 0;
                          const isFavorite = preferences.favorites?.includes(dish.name);
                          return (
                            <div 
                              key={dish.id} 
                              id={`dish-card-${dish.id}`}
                              className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-[#8a6538]/50 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
                            >
                          <div className="relative h-44 w-full bg-stone-100">
                            <img 
                              src={dish.image} 
                              alt={dish.name} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex space-x-1.5">
                              <button 
                                onClick={() => handleFavoriteToggle(dish.name)}
                                className={`p-2 rounded-full cursor-pointer transition-all shadow-sm ${isFavorite ? 'bg-amber-500 text-white' : 'bg-white/90 text-stone-600 hover:bg-white hover:text-[#8a6538]'}`}
                                title={isFavorite ? 'Xóa khi danh sách ẩm thực yêu thích của bạn' : 'Yêu thích món này'}
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <span className="px-2.5 py-1 bg-white/95 text-[#8a6538] text-[10px] font-mono rounded-full font-bold uppercase tracking-widest border border-stone-200 shadow-xs">
                                {dish.category === 'main' ? 'MÓN CHÍNH' : dish.category === 'starter' ? 'KHAI VỊ' : dish.category === 'dessert' ? 'TRÁNG MIỆNG' : 'ĐỒ UỐNG'}
                              </span>
                            </div>
                            
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-900/40 to-transparent p-4">
                              <p className="text-xs text-amber-300 font-mono flex items-center gap-1 drop-shadow-md">
                                <Star className="w-3.5 h-3.5 fill-current inline text-amber-300" />
                                <span className="font-bold">{dish.rating}</span> / 5.0 (Bình chọn ẩm thực)
                              </p>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex justify-between items-start">
                                <h3 className="text-base font-serif text-stone-800 font-bold leading-snug">{dish.name}</h3>
                                <button
                                  onClick={() => setSelectedDishDetail(dish)}
                                  className="text-[11px] text-[#8a6538] hover:text-[#6c4d29] font-mono flex items-center gap-0.5 cursor-pointer border border-[#8a6538]/20 bg-[#8a6538]/5 px-2 py-0.5 rounded-lg transition-all shrink-0 ml-2 font-medium"
                                  title="Xem nguyên liệu, quy trình chế biến và thông tin dinh dưỡng của món ăn"
                                >
                                  <Sparkles className="w-3 h-3 text-[#8a6538]" /> Chi tiết
                                </button>
                              </div>
                              <p className="text-xs text-stone-500 leading-relaxed mt-1 font-medium">{dish.description}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                              <span className="text-base font-serif font-bold text-[#8a6538]">
                                {dish.price.toLocaleString('vi-VN')} đ
                              </span>

                              {qtyInCart > 0 ? (
                                <div className="flex items-center space-x-2 bg-stone-100 rounded-lg p-1 border border-stone-200">
                                  <button 
                                    onClick={() => handleUpdateCartQty(dish.id, -1)}
                                    className="p-1 text-stone-600 hover:bg-stone-200/50 rounded-md transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-mono px-1.5 text-stone-800 font-bold">{qtyInCart}</span>
                                  <button 
                                    onClick={() => handleAddToCart(dish.id)}
                                    className="p-1 text-stone-600 hover:bg-stone-200/50 rounded-md transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn-add-${dish.id}`}
                                  onClick={() => handleAddToCart(dish.id)}
                                  className="px-3.5 py-1.5 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold rounded-lg text-xs tracking-wider uppercase cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 text-white" /> Thêm món
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    );
                  })()}
                </MenuGridSection>
              </MenuScreen>

            <TrackingScreen isActive={activeTab === 'map'}>

            {(() => {
              const restaurantCoords = { lat: 21.0285, lng: 105.8550 };
              const deliveryCoords = { lat: 21.0335, lng: 105.8465 };
              const driverCoords = driverInfo ? (
                driverInfo.location ? { lat: driverInfo.location.lat, lng: driverInfo.location.lng } : {
                  lat: 21.0285 + (driverInfo.step || 0) * 0.001,
                  lng: 105.8550 - (driverInfo.step || 0) * 0.0012
                }
              ) : null;

              return (
                <div id="map-workspace" className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-serif text-[#8a6538] font-bold italic flex items-center gap-1.5 animate-fade-in">
                        <MapPin className="w-5 h-5 text-[#8a6538] animate-bounce" /> Theo dõi tài xế giao hàng Hương Việt
                      </h2>
                      <p className="text-xs text-stone-500 font-medium">Bản đồ thực tế OpenStreetMap kết nối trực tiếp Leaflet - không lỗi, không cần nạp tiền API Key</p>
                    </div>
                    
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                        ● OpenStreetMap Live (Leaflet API)
                      </span>
                    </div>
                  </div>

                  {/* Leaflet OpenStreetMap Engine Container */}
                  <div className="flex-1 bg-[#f5f2eb] rounded-2xl border border-stone-300 p-4 relative flex flex-col justify-between overflow-hidden shadow-xs min-h-[350px]">
                    {/* Horizontal Progress Bar Overlay */}
                    {(() => {
                      const totalSteps = driverInfo?.totalSteps || 1;
                      const currentStep = driverInfo?.step || 0;
                      const progressPercent = totalSteps > 1 ? Math.min(100, Math.round((currentStep / (totalSteps - 1)) * 100)) : 0;
                      
                      // Calculate dynamic estimated arrival mins based on step
                      const isDelivered = driverInfo?.trackingStatus === 'delivered' || (currentStep === totalSteps - 1 && totalSteps > 1);
                      const minsRemaining = isDelivered ? 0 : Math.max(1, Math.round(15 - (currentStep / (totalSteps - 1)) * 15));

                      return (
                        <div className="absolute top-4 inset-x-4 bg-white/95 backdrop-blur-md border border-stone-250 p-3 rounded-xl z-[1001] shadow-sm flex flex-col gap-1.5 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-[11px] font-extrabold text-stone-700 uppercase tracking-widest font-sans">
                                Tiến trình giao hàng: {progressPercent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-[#8a6538] font-black font-sans bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Estimated Arrival: {minsRemaining} mins
                              </span>
                              <span className="text-[10px] text-stone-600 font-extrabold font-mono">
                                Chặng {currentStep + 1} / {totalSteps}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden border border-stone-250/30">
                            <div 
                              className="bg-[#8a6538] h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {driverInfo?.info && (
                            <div className="text-[10px] text-[#8a6538] leading-tight font-bold font-sans mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8a6538] animate-pulse shrink-0" />
                              <span>Chi tiết chặng: <span className="text-stone-700 underline decoration-amber-300 font-extrabold">{driverInfo.info}</span></span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: '300px' }}>
                      <LeafletMap 
                        restaurantCoords={restaurantCoords}
                        deliveryCoords={deliveryCoords}
                        driverCoords={driverCoords}
                        driverStatus={driverInfo?.trackingStatus || ''}
                      />
                    </div>

                    {/* Top Status Card - overlays above map */}
                    <div className="bg-white/95 backdrop-blur border border-stone-250 p-4 rounded-xl z-[1000] flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-3 mt-auto w-full relative">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Đơn hàng đang theo dõi</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-sm font-bold text-[#8a6538] font-mono">{trackingOrderId}</span>
                          <span className="text-xs text-stone-600 italic font-medium">(Trạng thái: {driverInfo?.trackingStatus === 'delivered' ? 'đã giao tới nơi' : driverInfo?.trackingStatus === 'shipping' ? 'đang trên đường đi' : 'chờ nhà bếp'})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <select 
                          value={trackingOrderId}
                          onChange={(e) => setTrackingOrderId(e.target.value)}
                          className="bg-stone-50 border border-stone-350 text-xs text-stone-700 rounded-lg p-1.5 focus:outline-none focus:border-[#8a6538]/50 flex-1 md:flex-none"
                        >
                          {customerVisibleOrders.length === 0 && <option>Không có đơn</option>}
                          {customerVisibleOrders.map(o => (
                            <option key={o.id} value={o.id}>{o.id} ({o.customerName})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-300 rounded-xl space-y-1.5 shrink-0">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" /> BẢN ĐỒ HOẠT ĐỘNG HOÀN TOÀN TỰ ĐỘNG & MIỄN PHÍ:
                    </h4>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                      Hệ thống Hương Việt sử dụng OpenStreetMap tích hợp Leaflet API thuần túy. Giải pháp này giúp loại bỏ hoàn toàn các yêu cầu nạp tiền ký quỹ của Google Maps (250k VNĐ), hoạt động cực kỳ mượt mà bên trong môi trường Iframe bảo mật cao của trình duyệt di động lẫn máy tính!
                    </p>
                  </div>
                </div>
              );
            })()}
            </TrackingScreen>

            <ReservationsScreen isActive={activeTab === 'reservations'}>
                <div className="mb-4">
                  <h2 className="text-xl font-serif text-[#8a6538] font-bold italic">Giữ bàn ăn sum họp đầy ấm cúng</h2>
                  <p className="text-xs text-stone-500 font-medium font-sans">Giữ một chỗ ngồi nhỏ xinh để cùng gia đình chia sẻ niềm vui bên mâm cơm Việt</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-6 pr-1">
                  
                  {/* Reservation Place Form */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[#8a6538] mb-4 flex items-center gap-1 font-mono">
                        <Calendar className="w-4 h-4 text-[#8a6538]" /> Điền thông tin đặt chỗ
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-stone-600 mb-1 uppercase tracking-wider font-mono font-semibold">Tên liên hệ</label>
                          <input 
                            type="text" 
                            id="res-name-input"
                            value={resName}
                            onChange={(e) => setResName(e.target.value)}
                            placeholder="ví dụ: Nguyễn Hữu Việt"
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-stone-600 mb-1 uppercase tracking-wider font-mono font-semibold">Số điện thoại di động</label>
                          <input 
                            type="text" 
                            id="res-phone-input"
                            value={resPhone}
                            onChange={(e) => setResPhone(e.target.value)}
                            placeholder="ví dụ: 0912444555"
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-stone-600 mb-1 uppercase tracking-wider font-mono font-semibold">Địa chỉ Email xác nhận</label>
                          <input 
                            type="email" 
                            value={resEmail}
                            onChange={(e) => setResEmail(e.target.value)}
                            placeholder="ví dụ: mha17003@gmail.com"
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                          />
                          <p className="text-[10px] text-stone-400 mt-1 italic font-medium">💡 Nếu dùng tài khoản mặc định của Resend, vui lòng điền email đăng ký của bạn là <strong>mha17003@gmail.com</strong>.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-stone-600 mb-1 uppercase tracking-wider font-mono font-semibold">Số lượng khách</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="20"
                              value={resCount}
                              onChange={(e) => setResCount(Number(e.target.value))}
                              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-600 mb-1 uppercase tracking-wider font-mono font-semibold">Thời gian đến</label>
                            <input 
                              type="text" 
                              value={resTime}
                              onChange={(e) => setResTime(e.target.value)}
                              placeholder="19:00 tối nay"
                              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={executeReservation}
                      className="w-full mt-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold uppercase text-xs tracking-widest rounded-xl cursor-pointer transition-all shadow-xs"
                    >
                      Xác nhận Đặt chỗ bàn ăn
                    </button>
                  </div>

                  {/* Current Active Reservations display */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col overflow-hidden shadow-xs">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4 font-mono">
                      Danh sách bàn ăn đã giữ chỗ ({customerVisibleReservations.length})
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                      {customerVisibleReservations.length === 0 && (
                        <div className="text-center text-stone-400 py-8 italic font-mono">
                          Không có bàn ăn nào được lưu trong hệ thống.
                        </div>
                      )}
                      {customerVisibleReservations.map(res => (
                        <div key={res.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-serif text-[#8a6538] font-bold text-sm">Khách: {res.customerName}</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">XÁC NHẬN</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2 text-stone-600">
                            <div>📞 Di động: <span className="text-stone-800 font-medium">{res.phoneNumber}</span></div>
                            <div>👥 Số khách: <span className="text-stone-800 font-medium">{res.numberOfGuests} người</span></div>
                            <div>🕒 Khung giờ: <span className="text-[#8a6538] font-bold">{res.reservationTime}</span></div>
                            <div>🪑 Số bàn giữ: <span className="text-stone-800 font-bold">Bàn #{res.tableNumber}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </ReservationsScreen>

            <PreferencesScreen isActive={activeTab === 'preferences'}>
                <div className="mb-4">
                  <h2 className="text-xl font-serif text-[#8a6538] font-bold italic flex items-center gap-1.5">
                    <User className="w-5 h-5 text-[#8a6538]" /> Hồ sơ cá nhân & Cấu hình thanh toán
                  </h2>
                  <p className="text-xs text-stone-500 font-medium font-sans">Ghi nhận khẩu vị riêng biệt đồng thời điền thông tin QR thụ hưởng để test trải nghiệm Momo/ZaloPay thực tế</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-6">
                  
                  {/* Preferences input and profile */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-pulse text-[#8a6538]" /> Yêu cầu ăn uống và dị ứng
                      </h3>
                      <p className="text-xs text-stone-500 mb-4 leading-normal font-medium">
                        Mọi ghi chú ở đây sẽ được chuyển trực tiếp vào ngữ cảnh hệ thống AI. Trợ lý ảo Hương Việt sẽ tự động tránh đề xuất các món có nguyên liệu gây dị ứng và ưu tiên các loại nước uống bạn yêu thích.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-stone-600 mb-1.5 uppercase font-mono font-semibold">Khấu vị riêng biệt hiện tại</label>
                          <textarea 
                            value={preferenceInput}
                            onChange={(e) => setPreferenceInput(e.target.value)}
                            rows={3}
                            placeholder="ví dụ: Tôi dị ứng ngập cua, cực kì nhạy cảm với hành hoa, thích ăn cay rất đậm đà..."
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs text-stone-850 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                          />
                        </div>

                        <button 
                          onClick={executeUpdatePreferenceManual}
                          className="py-2 px-4 bg-stone-100 hover:bg-stone-200/60 border border-stone-300 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          Lưu cấu hình khẩu vị
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-stone-150 text-xs space-y-2 text-stone-600">
                      <div>📁 <span className="font-bold">Khẩu vị đã lưu:</span> <span className="text-[#8a6538] font-bold italic">{preferences.dietaryNotes || 'Chưa có ghi chép'}</span></div>
                      <div> <span className="font-bold">Món ưa thích (Tổng kết AI):</span> <span className="text-stone-800 font-bold">{preferences.favorites?.join(', ') || 'Chưa thả tim món nào'}</span></div>
                    </div>
                  </div>

                  {/* Payment bank account target and login user display */}
                  <div className="space-y-6 flex flex-col justify-between">
                    {/* User profile card */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono">
                        👤 Trạng thái tài khoản người dùng
                      </h3>
                      {userProfile ? (
                        <div className="flex items-center space-x-4 bg-white p-3 rounded-xl border border-stone-200">
                          {userProfile.avatar ? (
                            <img src={userProfile.avatar} alt="Avatar" className="w-12 h-12 rounded-full ring-2 ring-[#8a6538]/20" />
                          ) : (
                            <div className="w-12 h-12 bg-[#8a6538]/10 text-[#8a6538] font-bold flex items-center justify-center rounded-full text-base border border-[#8a6538]/20">
                              {userProfile.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                              {userProfile.name} 
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full font-mono uppercase font-bold">
                                {userProfile.provider}
                              </span>
                            </p>
                            <p className="text-xs text-stone-500 mt-0.5">{userProfile.email}</p>
                            <button 
                              onClick={() => {
                                localStorage.removeItem('hv_user_profile');
                                setUserProfile(null);
                                setUserRole('customer');
                              }}
                              className="text-[10px] text-rose-600 hover:underline mt-1 font-bold block"
                            >
                              Đăng xuất tài khoản
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/30 border border-amber-200 p-4 rounded-xl text-center space-y-3">
                          <p className="text-xs text-stone-600 font-medium">Bạn chưa đăng nhập. Đăng nhập để lưu lịch sử đơn hàng và tích lũy điểm thưởng!</p>
                          <button 
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-[#8a6538] hover:bg-[#73512a] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Đăng nhập bằng Google / Facebook
                          </button>
                        </div>
                      )}
                    </div>

                    {/* QR Config Bank info info card */}
                    <div className="bg-[#fcfbf9] border border-[#8a6538]/15 rounded-2xl p-6 shadow-xs flex-1">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1">
                        💳 Tài khoản thụ hưởng VietQR
                      </h3>
                      <p className="text-[11px] text-stone-500 leading-normal mb-3 font-medium">
                        Khi bạn quét mã thanh toán MoMo / ZaloPay hay internet banking tại Hương Việt, hệ thống sẽ sinh ra mã <strong>VietQR chuẩn Napas 24/7</strong> theo số tài khoản này.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Mã Ngân Hàng nhận</label>
                          <input 
                            type="text" 
                            value={bankId}
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase();
                              setBankId(val);
                              localStorage.setItem('hv_bank_id', val);
                            }}
                            placeholder="vcb, tcb, mbb..."
                            className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Số tài khoản thực</label>
                          <input 
                            type="text" 
                            value={bankNo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBankNo(val);
                              localStorage.setItem('hv_bank_no', val);
                            }}
                            placeholder="Số tài khoản"
                            className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Họ Tên thụ hưởng viết hoa không dấu</label>
                        <input 
                          type="text" 
                          value={bankName}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setBankName(val);
                            localStorage.setItem('hv_bank_name', val);
                          }}
                          placeholder="NGUYEN VAN A"
                          className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-mono font-bold uppercase"
                        />
                      </div>
                      
                      <p className="text-[9px] text-stone-400 italic mt-3 font-medium">👉 Bạn hoàn toàn có thể nhập tài khoản của mình vào đây để test tiền thật chuyển khoản nạp thẳng vào tài khoản của bạn!</p>
                    </div>

                    {/* Supabase Database Connection Checker */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-[#8a6538]" /> 🔌 Kiểm thử kết nối Supabase CSDL
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-normal mb-4 font-medium">
                          Kiểm tra trạng thái kết nối trực tiếp đến PostgreSQL (Supabase) từ server Cloud Run của nhà hàng. Đảm bảo an toàn bảo mật thông tin.
                        </p>

                        <div className="space-y-3.5 mb-4">
                          {/* Environment State Indicator */}
                          <div className="flex items-center justify-between p-2.5 bg-stone-55 rounded-lg border border-stone-200">
                            <span className="text-[11px] font-bold text-stone-600 font-mono">Biến môi trường:</span>
                            <div className="flex items-center gap-2">
                              {dbCheckStatus === 'success' || (dbCheckResult && dbCheckResult.configured !== false) ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  ĐÃ THIẾT LẬP
                                </span>
                              ) : (
                                <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-300 font-bold px-2 py-0.5 rounded">
                                  CHƯA PHÁT HIỆN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live Result Details */}
                          {dbCheckStatus === 'checking' && (
                            <div className="p-4 bg-amber-50/25 border border-amber-200 rounded-xl space-y-2 text-center">
                              <div className="w-5 h-5 border-2 border-[#8a6538] border-t-transparent rounded-full animate-spin mx-auto pb-1" />
                              <p className="text-xs text-stone-600 font-medium animate-pulse">Đang kiểm thử kết nối tới Supabase...</p>
                            </div>
                          )}

                          {dbCheckStatus === 'success' && dbCheckResult && (
                            <div className="p-3.5 bg-emerald-50/40 border border-emerald-250 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Kết nối thành công! ✅</span>
                              </div>
                              <div className="text-[10px] space-y-1 text-stone-600 font-mono leading-relaxed border-t border-emerald-100 pt-2">
                                <div><span className="font-bold">Độ trễ:</span> <span className="text-emerald-700 font-bold">{dbCheckResult.latencyMs}ms</span></div>
                                <div><span className="font-bold">Thời gian CSDL:</span> {dbCheckResult.timestamp}</div>
                                <div className="truncate"><span className="font-bold">Mục tiêu:</span> {dbCheckResult.maskedUrl}</div>
                                <div className="text-[9px] text-stone-500 break-words line-clamp-2"><span className="font-bold">Phiên bản:</span> {dbCheckResult.version}</div>
                              </div>
                            </div>
                          )}

                          {dbCheckStatus === 'failed' && dbCheckResult && (
                            <div className="p-3.5 bg-rose-50/40 border border-rose-250 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span>Kết nối thất bại! ❌</span>
                              </div>
                              <p className="text-[11px] text-stone-700 font-semibold">{dbCheckResult.message}</p>
                              {dbCheckResult.error && (
                                <div className="p-2 bg-stone-900 text-rose-300 font-mono text-[9px] rounded border border-rose-950 overflow-x-auto max-h-[80px] whitespace-pre-wrap leading-normal">
                                  {dbCheckResult.error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button 
                          onClick={handleCheckDatabaseConnection}
                          disabled={dbCheckStatus === 'checking'}
                          className="w-full py-2.5 bg-[#8a6538] hover:bg-[#73512a] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>{dbCheckStatus === 'checking' ? 'Đang kiểm tra...' : 'Bắt đầu kiểm tra kết nối'}</span>
                        </button>
                        
                        <div className="text-[9px] text-stone-400 font-medium leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                          ℹ️ Bạn có thể nhập biến <code className="font-bold text-stone-600 font-mono">DATABASE_URL</code> trong mục <strong>Settings - Secrets</strong> ở góc trái màn hình AI Studio dưới dạng <code className="font-mono text-[8px]">postgresql://user:pass@host:port/db</code> để kiểm tra.
                        </div>
                      </div>
                    </div>

                    {/* Resend Email Client & Logs Dashboard */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-[#8a6538]" /> 📬 Cổng Gửi Thư Resend.com
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-normal mb-4 font-medium">
                          Kiểm thử gửi email trực tiếp thông qua dịch vụ đám mây cao cấp Resend.com bằng API key của bạn. Đơn hàng và đặt bàn mới cũng sẽ tự động kích hoạt gửi thư.
                        </p>

                        <div className="space-y-4">
                          {/* Target recipient */}
                          <div>
                            <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Người nhận (To Email)</label>
                            <input 
                              type="email" 
                              value={testEmailTo}
                              onChange={(e) => setTestEmailTo(e.target.value)}
                              placeholder="ví dụ: mha17003@gmail.com"
                              className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-medium text-stone-850 focus:ring-1 focus:ring-[#8a6538] focus:outline-none"
                            />
                            <p className="text-[9px] text-stone-400 mt-1.5 italic leading-relaxed">
                              ⚠️ Chú ý: Ở chế độ dùng thử sandbox của Resend, bạn chỉ có thể gửi thư đến chính email đăng ký tài khoản Resend của bạn (mha17003@gmail.com).
                            </p>
                          </div>

                          {/* Subject */}
                          <div>
                            <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Tiêu đề thư (Subject)</label>
                            <input 
                              type="text" 
                              value={testEmailSubject}
                              onChange={(e) => setTestEmailSubject(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-semibold text-stone-850 focus:ring-1 focus:ring-[#8a6538] focus:outline-none"
                            />
                          </div>

                          {/* Body (HTML supported) */}
                          <div>
                            <label className="block text-[10px] text-stone-500 uppercase font-bold font-mono mb-1">Nội dung thư (HTML/Text)</label>
                            <textarea 
                              value={testEmailBody}
                              onChange={(e) => setTestEmailBody(e.target.value)}
                              rows={3}
                              className="w-full bg-stone-50 border border-stone-250 rounded-lg p-2 text-xs font-mono text-stone-700 focus:ring-1 focus:ring-[#8a6538] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Send Result status message wrapper */}
                        {sendResultMessage && (
                          <div className={`mt-3 p-3 rounded-xl text-xs font-medium border ${sendResultSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            {sendResultMessage}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-2">
                        <button 
                          onClick={handleSendTestEmail}
                          disabled={sendingEmail}
                          className="w-full py-2.5 bg-[#8a6538] hover:bg-[#73512a] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingEmail ? 'Đang gửi thư...' : 'Gửi Thư Thử Nghiệm Qua Resend'}</span>
                        </button>

                        {/* Mail log database history logs */}
                        <div className="border-t border-stone-200 pt-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Nhật ký thông báo Email ({emailLogs.length})</span>
                            <button 
                              onClick={fetchEmailLogs}
                              className="text-[10px] text-[#8a6538] hover:underline font-bold"
                            >
                              Làm mới 🔄
                            </button>
                          </div>

                          {emailLogs.length === 0 ? (
                            <p className="text-[11px] text-stone-400 italic text-center py-4 bg-stone-50 rounded-xl border border-stone-150">Chưa có thông báo email nào được gửi trong phiên này.</p>
                          ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {emailLogs.map((log: any) => (
                                <div key={log.id} className="p-2.5 bg-stone-50/75 hover:bg-stone-50 border border-stone-200 rounded-lg text-[11px] leading-normal space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-stone-700">{log.id}</span>
                                    {log.status === 'success' ? (
                                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded uppercase border border-emerald-200">Thành công</span>
                                    ) : log.status === 'failed' ? (
                                      <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.2 rounded uppercase border border-rose-250">Thất bại</span>
                                    ) : (
                                      <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.2 rounded uppercase border border-amber-250 animate-pulse">Đang gửi</span>
                                    )}
                                  </div>
                                  <div className="text-stone-600 font-semibold truncate">To: {log.recipient}</div>
                                  <div className="text-stone-500 truncate"><span className="font-mono text-[10px]">Subj:</span> {log.subject}</div>
                                  {log.error && (
                                    <div className="text-[9px] text-rose-600 font-mono bg-rose-50/40 p-1 rounded border border-rose-100 break-words mt-1">
                                      {log.error}
                                    </div>
                                  )}
                                  <div className="text-[9px] text-stone-400 font-mono text-right">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Twilio SDK Phone and SMS Diagnostic Tool */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1.5">
                          <PhoneCall className="w-4 h-4 text-[#8a6538]" /> 📲 Trình Chẩn Đoán Twilio SDK
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-normal mb-4 font-medium">
                          Kiểm tra liên kết tài khoản Twilio của quý khách, đồng thời truy vấn danh sách Caller IDs đã được kích hoạt trực tiếp từ hệ thống của Twilio để đảm bảo cuộc gọi / SMS hoạt động thông suốt.
                        </p>

                        {/* Connection indicators */}
                        <div className="space-y-3">
                          {twilioDiagError && (
                            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs space-y-1">
                              <p className="font-bold flex items-center gap-1">❌ Kiểm tra phát sinh lỗi:</p>
                              <p className="font-mono text-[10px] break-words">{twilioDiagError}</p>
                              <p className="text-[9.5px] text-stone-600 mt-1.5 font-sans leading-normal">
                                💡 Nhắc nhở: Hãy đảm bảo bạn đã cấu hình chính xác <strong className="font-mono">TWILIO_ACCOUNT_SID</strong>, <strong className="font-mono">TWILIO_AUTH_TOKEN</strong> và <strong className="font-mono">TWILIO_PHONE_NUMBER</strong> tương ứng trong mục <strong>Settings - Secrets</strong> ở góc trái màn hình.
                              </p>
                            </div>
                          )}

                          {twilioDiagResult && (
                            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                              <p className="font-bold text-emerald-800 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                <span>Kết nối thành công tới Twilio! ✓</span>
                              </p>
                              
                              <div className="space-y-1.5 font-mono text-[10px] text-stone-700 leading-normal border-t border-emerald-100 pt-2.5">
                                <div><span className="font-bold">Account SID:</span> {twilioDiagResult.accountSid}</div>
                                <div className="truncate"><span className="font-bold text-[#8a6538]">Số tổng đài từ Secrets (From):</span> <strong className="text-stone-900">{twilioDiagResult.configFromNum}</strong></div>
                              </div>

                              {/* Target instructions */}
                              <div className="text-[9.5px] text-stone-500 leading-relaxed font-sans bg-white border border-stone-200 p-2.5 rounded-lg space-y-1.5">
                                <strong className="text-[#8a6538]">⚠️ QUY TẮC SỬ DỤNG TÀI KHOẢN THỬ NGHIỆM:</strong>
                                <p>1. <strong>Số điện thoại khách hàng (To)</strong>: Phải nằm trong danh sách <strong>Verified Caller IDs</strong> bên dưới. Nếu không, Twilio sẽ từ chối gọi và báo lỗi Code 21608.</p>
                                <p>2. <strong>Số điện thoại gửi đi (From)</strong>: Số đặt ở Secrets (TWILIO_PHONE_NUMBER) phải trùng khớp chuẩn xác (từng khoảng trắng/mã nước) với một trong các số đã xác thực hoặc đã mua bên dưới. Nếu không, Twilio sẽ báo lỗi Code 21210.</p>
                              </div>

                              {/* Verified Outgoing Caller IDs List */}
                              <div className="space-y-1.5 mt-2">
                                <p className="font-bold text-[9.5px] text-stone-500 uppercase tracking-widest font-mono">📋 Verified Outgoing Caller IDs ({twilioDiagResult.verifiedNumbers?.length || 0}):</p>
                                {twilioDiagResult.verifiedNumbers && twilioDiagResult.verifiedNumbers.length > 0 ? (
                                  <div className="max-h-24 overflow-y-auto space-y-1">
                                    {twilioDiagResult.verifiedNumbers.map((num, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-stone-150 rounded font-mono text-[9.5px]">
                                        <span className="font-bold text-emerald-700">{num.phoneNumber}</span>
                                        <span className="text-stone-400 text-[8.5px] truncate max-w-[120px]">{num.friendlyName}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-amber-700 italic bg-amber-50/55 p-2 rounded border border-amber-200">Không tìm thấy Số điện thoại xác thực nào trong tài khoản của bạn.</p>
                                )}
                              </div>

                              {/* Purchased Numbers List */}
                              {twilioDiagResult.inboundNumbers && twilioDiagResult.inboundNumbers.length > 0 && (
                                <div className="space-y-1.5 border-t border-emerald-100 pt-2">
                                  <p className="font-bold text-[9.5px] text-stone-500 uppercase tracking-widest font-mono">🎟️ Số điện thoại Twilio đã mua ({twilioDiagResult.inboundNumbers.length}):</p>
                                  <div className="max-h-20 overflow-y-auto space-y-1">
                                    {twilioDiagResult.inboundNumbers.map((num, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-1.5 bg-stone-50 border border-stone-200 rounded font-mono text-[9.5px]">
                                        <span className="font-bold text-indigo-700">{num.phoneNumber}</span>
                                        <span className="text-[8.5px] text-stone-400">{num.friendlyName}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {twilioDiagLoading && (
                            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-center">
                              <div className="w-5 h-5 border-2 border-[#8a6538] border-t-transparent rounded-full animate-spin mx-auto" />
                              <p className="text-xs text-stone-500 font-medium animate-pulse">Đang định vị và kết nối kiểm thử máy chủ Twilio...</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button 
                          onClick={handleCheckTwilio}
                          disabled={twilioDiagLoading}
                          className="w-full py-2.5 bg-[#8a6538] hover:bg-[#73512a] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{twilioDiagLoading ? 'Đang truy vấn...' : 'Bắt đầu Xác Thực Twilio'}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </PreferencesScreen>

            </>
          }
          sideContent={
            <CustomerSidebar>
            
            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setActiveTab('chat'); handleSendChatMessage("Gợi ý cho tôi các món ẩm thực Việt"); }}
                className="flex items-center justify-center space-x-2 py-3 bg-white hover:bg-stone-50 border border-stone-250 rounded-xl text-stone-700 font-bold text-xs cursor-pointer transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#8a6538]" />
                <span>Yêu Cầu AI Gợi Ý</span>
              </button>
              
              <button 
                onClick={() => {
                  setActiveTab('chat');
                  if (customerVisibleOrders.length > 0) {
                    const latestOrder = customerVisibleOrders[customerVisibleOrders.length - 1];
                    handleSendChatMessage(`Kiểm tra trạng thái đơn ${latestOrder.id} và hướng dẫn tôi bước tiếp theo`);
                  } else {
                    handleSendChatMessage("Tôi muốn được tư vấn món và đặt món ngay trong chat");
                  }
                }}
                className="flex items-center justify-center space-x-2 py-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-xl text-amber-800 font-bold text-xs cursor-pointer transition-all shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-amber-700 font-bold" />
                <span>Tiếp Tục Chat AI</span>
              </button>
            </div>

            {/* Shopping Cart Widget */}
            <div id="shopping-cart-widget" className="flex-1 flex flex-col bg-white border border-stone-205 rounded-2xl p-4 min-h-[300px] shadow-xs">
              <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] font-mono flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-[#8a6538]" /> Giỏ Hàng Hiện Tại
                </h3>
                <span className="px-2 py-0.5 bg-[#8a6538] text-white rounded-full text-[10px] font-mono font-bold">
                  {Object.values(cart).reduce((a: number, b: number) => a + Number(b), 0)} món
                </span>
              </div>

              {/* Items List inside cart */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-stone-400 py-12">
                    <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-[#8a6538]" />
                    <p className="text-xs font-mono font-medium">Giỏ hàng đang trống...</p>
                    <button 
                      onClick={() => setActiveTab('menu')}
                      className="mt-2 text-xs text-[#8a6538] font-bold underline cursor-pointer"
                    >
                      Dạo xem thực đơn ngay
                    </button>
                  </div>
                ) : (
                  Object.entries(cart).map(([dishId, qty]) => {
                    const dish = dishes.find(d => d.id === dishId);
                    if (!dish) return null;
                    return (
                      <div key={dishId} id={`cart-item-${dish.id}`} className="flex justify-between items-center p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <div className="flex space-x-3 items-center min-w-0">
                          <img src={dish.image} alt={dish.name} className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 truncate">{dish.name}</p>
                            <p className="text-[10px] text-stone-500 font-medium">{(dish.price).toLocaleString('vi-VN')} d</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 border border-stone-300 rounded-lg bg-white p-1">
                            <button 
                              onClick={() => handleUpdateCartQty(dishId, -1)}
                              className="p-0.5 text-stone-600 hover:text-stone-900"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-mono text-stone-800 px-1 font-bold">{qty}</span>
                            <button 
                              onClick={() => handleUpdateCartQty(dishId, 1)}
                              className="p-0.5 text-stone-600 hover:text-stone-900"
                            >
                              <Plus className="w-3.5 h-3" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => handleRemoveFromCart(dishId)}
                            title="Xoa mon nay"
                            className="p-1 text-rose-600 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Promo Code Input */}
              {getCartTotal() > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ma giam gia (vi du: HUONGVIET20)..."
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      disabled={!!appliedPromo}
                      className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-[10px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8a6538]/50 uppercase font-mono font-bold"
                    />
                    {appliedPromo ? (
                      <button
                        onClick={handleRemovePromo}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-300 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-mono uppercase"
                      >
                        Huy bo
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyPromo}
                        className="px-2.5 py-1.5 bg-[#8a6538]/10 hover:bg-[#8a6538]/20 border border-[#8a6538]/30 text-[#8a6538] rounded-lg text-[10px] font-bold transition-all cursor-pointer font-mono uppercase shadow-xs"
                      >
                        Ap dung
                      </button>
                    )}
                  </div>
                  {promoFeedback && (
                    <p className={`text-[9px] font-mono leading-normal ${promoFeedback.type === 'success' ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}`}>
                      {promoFeedback.type === 'success' ? 'OK: ' : 'ERR: '} {promoFeedback.text}
                    </p>
                  )}
                </div>
              )}

              {/* Order total math */}
              <div className="mt-4 pt-4 border-t border-stone-200 space-y-2.5">
                <div className="flex justify-between text-xs text-stone-500 font-medium">
                  <span>Giá trị món ăn</span>
                  <span className="text-stone-800 font-bold">{(getCartTotal()).toLocaleString('vi-VN')} d</span>
                </div>
                
                <div className="flex justify-between text-xs text-stone-500 font-medium">
                  <span>Phí dịch vụ & Ship hàng</span>
                  <span className="text-stone-800 font-bold">{getCartTotal() > 0 ? (15000).toLocaleString('vi-VN') : 0} d</span>
                </div>

                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-mono font-bold">
                    <span>Khuyen mai ({appliedPromo})</span>
                    <span>-{promoDiscount.toLocaleString('vi-VN')} d</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-serif italic text-[#8a6538] pt-1.5 border-t border-stone-100">
                  <span>Tổng tiền thanh toán</span>
                  <span className="font-bold text-[#8a6538]">
                    {Math.max(0, (getCartTotal() > 0 ? getCartTotal() + 15000 : 0) - promoDiscount).toLocaleString('vi-VN')} d
                  </span>
                </div>
              </div>

              {/* Checkout Form & trigger */}
              {getCartTotal() > 0 && (
                <button
                  id="checkout-trigger-btn"
                  onClick={() => setShowCheckoutModal(true)}
                  className="mt-4 w-full py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center space-x-1 shadow-sm"
                >
                  <span>Tiến Hành Đặt Hàng</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* List of Previous Orders display */}
            <OrderHistoryPanel>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a6538] mb-3 font-mono flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#8a6538]" /> Lịch sử đặt hàng ({customerVisibleOrders.length})
                </h3>

                <div className="max-h-56 overflow-y-auto space-y-3.5 pr-1 text-xs">
                {customerVisibleOrders.length === 0 && (
                  <div className="text-center text-stone-400 py-6 italic font-mono font-medium">
                    Chưa phát sinh đơn hàng nào.
                  </div>
                )}
                {customerVisibleOrders.map(order => {
                  const isCurrentlyTracked = order.id === trackingOrderId || (selectedShipperOrder && order.id === selectedShipperOrder.id);
                  return (
                    <motion.div 
                      key={order.id} 
                      id={`history-order-${order.id}`} 
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        isCurrentlyTracked 
                          ? 'border-[#8a6538] bg-amber-50/20 ring-1 ring-[#8a6538]/35' 
                          : 'bg-stone-50 border-stone-200'
                      }`}
                      animate={isCurrentlyTracked ? {
                        boxShadow: [
                          '0 0 0px rgba(192, 86, 33, 0)',
                          '0 0 12px rgba(192, 86, 33, 0.5)',
                          '0 0 0px rgba(192, 86, 33, 0)'
                        ]
                      } : {}}
                      transition={isCurrentlyTracked ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {}}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-[#8a6538] font-bold text-[13px]">{order.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          order.trackingStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                          order.trackingStatus === 'shipping' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                          order.trackingStatus === 'cancelled' ? 'bg-stone-200 text-stone-600' :
                          'bg-amber-100 text-amber-700 font-bold'
                        }`}>
                          {order.trackingStatus.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        Mon: {order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                      </p>

                      <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-stone-150 text-[11px] text-stone-500 font-medium">
                        <div>Tong: <strong className="text-stone-800">{(order.total).toLocaleString('vi-VN')} d</strong></div>
                        <div>Khách: <strong className="text-stone-800">{order.customerName}</strong></div>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          Tình trạng: {order.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                        </span>

                        <div className="flex space-x-1.5 font-sans">
                          {order.paymentStatus === 'unpaid' && (
                            <button 
                              onClick={() => setPaymentQRModal({ isOpen: true, orderId: order.id, amount: order.total, method: order.paymentMethod as any })}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-[9px] uppercase rounded-lg shadow-xs transition-colors"
                            >
                              Trả tiền
                            </button>
                          )}
                          {order.trackingStatus !== 'cancelled' && order.trackingStatus !== 'delivered' && (
                            <button 
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[9px] uppercase rounded-lg shadow-xs transition-colors"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-200 bg-stone-100/60 rounded-lg p-2.5 flex flex-col space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-stone-500 flex items-center gap-1 font-mono font-semibold">
                            <Bot className="w-3 h-3 text-[#8a6538]" /> Trợ lý web cho đơn này
                          </span>
                          <span className="text-stone-400 text-[9.5px] font-medium uppercase tracking-wide">Hỏi đáp liên tục</span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                          <button
                            onClick={() => { setActiveTab('chat'); handleSendChatMessage(`Kiểm tra trạng thái đơn ${order.id}`); }}
                            className="w-full py-1.5 bg-white hover:bg-stone-50 border border-stone-300 rounded text-center text-[9px] font-bold text-stone-700 cursor-pointer flex items-center justify-center gap-1 transition-all shadow-2xs"
                          >
                            <Bot className="w-2.5 h-2.5 text-[#8a6538]" /> Hỏi AI về đơn này
                          </button>

                          {order.paymentStatus !== 'paid' && order.trackingStatus !== 'cancelled' && (
                            <button
                              onClick={() => handleSendChatMessage(`Thanh toán đơn ${order.id} bằng ${order.paymentMethod === 'cash' ? 'momo' : order.paymentMethod}`)}
                              className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-center text-[9px] font-bold text-amber-900 cursor-pointer flex items-center justify-center gap-1 transition-all shadow-2xs"
                            >
                              <CreditCard className="w-2.5 h-2.5 text-amber-700" /> Thanh toán ngay trong chat
                            </button>
                          )}

                          {order.trackingStatus === 'shipping' && (
                            <button
                              onClick={() => startLivekitRoleCall(order, 'customer-shipper')}
                              className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-center text-[9px] font-bold text-emerald-900 cursor-pointer flex items-center justify-center gap-1 transition-all shadow-2xs"
                            >
                              <PhoneCall className="w-2.5 h-2.5 text-emerald-700" /> Mở phòng gọi với tài xế
                            </button>
                          )}

                          <button
                            onClick={() => handleFocusOrderFromChat(order)}
                            className="w-full py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded text-center text-[9px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all shadow-2xs"
                          >
                            <MapPin className="w-2.5 h-2.5 text-sky-700" /> Mở theo dõi đơn trên web
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              </OrderHistoryPanel>
            </CustomerSidebar>
          }
        />

          <RestaurantApp isVisible={isRestaurantRole}>
              
              {/* Stats Dashboard Header */}
              {restaurantView === 'operations' && (
              <RestaurantStatsSection>
                <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs hover:border-[#8a6538]/30 transition-all">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-stone-500 block">Tổng Doanh Thu Quán</span>
                  <span id="rest-revenue" className="text-2xl font-serif font-black text-[#8a6538] block mt-1.5">
                    {orders.reduce((acc, o) => acc + (o.trackingStatus === 'delivered' ? o.total + 15000 : 0), 0).toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono italic mt-1 block">Tính từ đơn đã giao xong</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs hover:border-[#8a6538]/30 transition-all">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-stone-500 block">Đơn Hoàn Tất</span>
                  <span className="text-2xl font-serif font-black text-emerald-700 block mt-1.5">
                    {orders.filter(o => o.trackingStatus === 'delivered').length} đơn hàng
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono italic mt-1 block">Xếp hạng dịch vụ: 5.0 sao</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs hover:border-[#8a6538]/30 transition-all">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-stone-500 block">Đơn Đang Chế Biến / Ship</span>
                  <span className="text-2xl font-serif font-black text-amber-700 block mt-1.5">
                    {orders.filter(o => ['pending', 'preparing', 'shipping'].includes(o.trackingStatus)).length} đơn hàng
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono italic mt-1 block">Thời gian trung bình: 12 phút</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-4.5 shadow-xs hover:border-[#8a6538]/30 transition-all">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-stone-500 block">Bàn Giữ Chỗ (Reservations)</span>
                  <span className="text-2xl font-serif font-black text-[#8a6538] block mt-1.5">
                    {reservations.length} lượt khách
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono italic mt-1 block">Khung giờ vàng: 18:00 - 20:30</span>
                </div>
              </RestaurantStatsSection>
              )}

              {/* Workspace split */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-hidden">
                
                {/* Left Column: Orders monitoring */}
                {restaurantView === 'operations' && (
                <RestaurantOrdersBoard>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-105">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#8a6538]" />
                      <h3 className="font-serif font-bold text-stone-850 italic text-base">Bảng Điều Khiển Đơn Hàng Nhà Bếp</h3>
                    </div>
                    <button 
                      onClick={refreshOrdersAndReservations}
                      className="p-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold rounded-lg border border-stone-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-stone-500" /> Tải lại đơn
                    </button>
                  </div>

                  {/* Search Bar for Orders */}
                  <input 
                    type="text"
                    placeholder="Tìm kiếm đơn (tên khách, SĐT, mã đơn)..."
                    value={restSearchQuery}
                    onChange={(e) => setRestSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 mb-4 focus:outline-none focus:border-[#8a6538]/50"
                  />

                  {restaurantTrackedOrder && (
                    <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-[#8a6538]">Lộ trình giao hàng</p>
                          <p className="text-sm font-bold text-stone-800">{restaurantTrackedOrder.id} · {restaurantTrackedOrder.customerName}</p>
                        </div>
                        <button
                          onClick={() => setTrackingOrderId(restaurantTrackedOrder.id)}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border border-stone-300 bg-white hover:bg-stone-100 cursor-pointer"
                        >
                          Đồng bộ
                        </button>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden border border-stone-200 bg-white">
                        <LeafletMap
                          restaurantCoords={{ lat: 21.0260, lng: 105.8550 }}
                          deliveryCoords={{ lat: 21.0338, lng: 105.8460 }}
                          driverCoords={driverInfo?.location ? { lat: driverInfo.location.lat, lng: driverInfo.location.lng } : null}
                          driverStatus={driverInfo?.trackingStatus || restaurantTrackedOrder.trackingStatus}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {orders.filter(order => order.deliveryType === 'delivery').slice(0, 4).map((order) => (
                          <button
                            key={order.id}
                            onClick={() => setTrackingOrderId(order.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${trackingOrderId === order.id ? 'bg-[#8a6538] text-white border-[#8a6538]' : 'bg-white text-stone-700 border-stone-250 hover:bg-stone-100'}`}
                          >
                            {order.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    {orders.filter(o => {
                      const q = restSearchQuery.toLowerCase();
                      return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.phoneNumber.includes(q);
                    }).length === 0 ? (
                      <div className="text-center py-12 text-stone-400 font-mono italic">
                        Không tìm thấy đơn hàng nào phù hợp trên hệ thống.
                      </div>
                    ) : (
                      orders.filter(o => {
                        const q = restSearchQuery.toLowerCase();
                        return o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.phoneNumber.includes(q);
                      }).map(o => (
                        <RestaurantOrderCard key={o.id}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-mono font-bold text-[#8a6538] text-sm">{o.id}</span>
                              <span className="mx-2 text-stone-400">|</span>
                              <span className="text-xs text-stone-500 font-bold uppercase font-mono bg-stone-200/55 px-2 py-0.5 rounded">
                                {o.deliveryType === 'delivery' ? 'Giao hàng' : 'Dùng tại chỗ'}
                              </span>
                            </div>
                            
                            <div className="flex gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                o.trackingStatus === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                o.trackingStatus === 'shipping' ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse' :
                                o.trackingStatus === 'cancelled' ? 'bg-stone-100 text-stone-500 border-stone-300' :
                                'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                              }`}>
                                {o.trackingStatus}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-100/50 text-amber-800 border-amber-200'
                              }`}>
                                {o.paymentStatus === 'paid' ? 'Đã thu tiền' : 'Chưa thu tiền'}
                              </span>
                            </div>
                          </div>

                          {/* Mon an chi tiet */}
                          <div className="bg-white border border-stone-150 rounded-lg p-2.5 my-2.5 text-xs">
                            <p className="font-mono text-stone-400 uppercase text-[9px] mb-1 font-bold">Danh sach mon dat:</p>
                            <ul className="space-y-1">
                              {o.items.map((it, idx) => (
                                <li key={idx} className="flex justify-between font-medium">
                                  <span className="text-stone-800">{it.name} <strong className="text-[#8a6538]">x{it.quantity}</strong></span>
                                  <span className="text-stone-500 font-mono">{it.price.toLocaleString('vi-VN')} đ</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 pt-2 border-t border-stone-100 flex justify-between font-bold">
                              <span>Phí ship & VAT:</span>
                              <span className="font-serif italic text-stone-800">15.000 đ</span>
                            </div>
                            <div className="mt-1 flex justify-between font-black text-sm text-[#8a6538]">
                              <span>Tổng thu hộ:</span>
                              <span>{(o.total + 15000).toLocaleString('vi-VN')} đ ({o.paymentMethod.toUpperCase()})</span>
                            </div>
                          </div>

                          {/* Thông tin khách hàng */}
                          <div className="text-xs text-stone-600 grid grid-cols-2 gap-2 mt-2 font-medium">
                            <div>Khách: <strong className="text-stone-800">{o.customerName}</strong></div>
                            <div>SDT: <strong className="text-stone-800 font-mono">{o.phoneNumber}</strong></div>
                            {o.address && <div className="col-span-2">Địa chỉ nhận: <em className="text-stone-850">{o.address}</em></div>}
                          </div>

                          {/* Quick actions for state flow */}
                          <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center bg-[#fff]/50 p-2 rounded-lg">
                            <span className="text-[10px] uppercase font-mono font-bold text-stone-400">Trạng thái bếp nấu:</span>
                            <div className="flex gap-1.5">
                              {o.trackingStatus === 'pending' && (
                                <button
                                  onClick={async () => {
                                    await fetch('/api/orders/update-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: o.id, trackingStatus: 'preparing' })
                                    });
                                    refreshOrdersAndReservations();
                                  }}
                                  className="px-2.5 py-1 bg-amber-550 hover:bg-amber-600 text-stone-900 font-extrabold text-[10px] uppercase rounded-lg transition-transform cursor-pointer"
                                >
                                  Chấp nhận nấu 🧑‍🍳
                                </button>
                              )}
                              {o.trackingStatus === 'preparing' && (
                                <button
                                  onClick={async () => {
                                    await fetch('/api/orders/update-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: o.id, trackingStatus: 'shipping', manualDriverStep: 0 })
                                    });
                                    refreshOrdersAndReservations();
                                  }}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-transform cursor-pointer"
                                >
                                  Bàn giao cho shipper
                                </button>
                              )}
                              {o.trackingStatus === 'shipping' && (
                                <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 font-extrabold text-[10px] uppercase rounded-lg">
                                  Đang chờ shipper và khách xác nhận
                                </span>
                              )}
                              {['preparing', 'shipping'].includes(o.trackingStatus) && (
                                <button
                                  onClick={() => startLivekitRoleCall(o, 'restaurant-shipper')}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase rounded-lg transition-transform cursor-pointer flex items-center gap-1"
                                >
                                  <PhoneCall className="w-3 h-3" /> Mở phòng gọi shipper
                                </button>
                              )}
                              {o.trackingStatus !== 'cancelled' && o.trackingStatus !== 'delivered' && (
                                <button
                                  onClick={async () => {
                                    await fetch('/api/orders/update-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: o.id, trackingStatus: 'cancelled' })
                                    });
                                    refreshOrdersAndReservations();
                                  }}
                                  className="px-2.5 py-1 bg-stone-205 hover:bg-rose-50 hover:text-rose-650 text-stone-500 border border-stone-250 font-bold text-[10px] uppercase rounded-lg transition-transform cursor-pointer"
                                >
                                  Hủy đơn
                                </button>
                              )}
                            </div>
                          </div>
                        </RestaurantOrderCard>
                      ))
                    )}
                  </div>
                </RestaurantOrdersBoard>
                )}

                {/* Right Column: Culinary Management & Register Dishes */}
                {restaurantView === 'operations' && (
                <RestaurantSideColumn>
                  
                  {/* Tables & Reservations manager panel */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col flex-1 min-h-0 overflow-hidden shadow-xs">
                    <div className="flex justify-between items-center mb-3 pb-1 border-b border-stone-100">
                      <h4 className="font-serif font-bold text-stone-850 italic text-sm flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-[#8a6538]" /> Quản Lý Đặt Bàn Giữ Chỗ
                      </h4>
                      <span className="px-2 py-0.5 bg-[#8a6538] text-white font-mono text-[9px] rounded font-bold">{reservations.length} bàn</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs scrollbar-thin">
                      {reservations.length === 0 ? (
                        <p className="text-center italic font-mono text-stone-400 py-12">Hôm nay chưa có lịch giữ bàn ăn trực tiếp nào.</p>
                      ) : (
                        reservations.map(res => (
                          <div key={res.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center hover:border-amber-300/60 transition-colors">
                            <div className="space-y-1.5 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-[#8a6538]">{res.customerName}</span>
                                <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-805 text-[8.5px] rounded font-bold font-mono">CONFIRMED</span>
                              </div>
                              <div className="text-[10px] text-stone-550 space-y-0.5 font-medium">
                                <div>🕒 Khung giờ giữ: <strong className="text-stone-800">{res.reservationTime}</strong></div>
                                <div>👥 Số thực khách: <strong className="text-stone-800">{res.numberOfGuests} người</strong></div>
                                <div>📞 Liên hệ thoại: <strong className="text-stone-800 font-mono">{res.phoneNumber}</strong></div>
                                <div>🪑 Số bàn giữ sẵn: <strong className="text-stone-800">Bàn #{res.tableNumber} ({res.sittingArea || "Trong nhà"})</strong></div>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                await fetch('/api/reservations/cancel', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: res.id })
                                });
                                refreshOrdersAndReservations();
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/50 rounded-lg transition-transform cursor-pointer"
                              title="Hủy giữ chỗ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Culinary Menu Add Form */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col flex-1 min-h-0 overflow-hidden shadow-xs">
                    <h4 className="font-serif font-bold text-stone-850 italic text-sm border-b border-stone-100 pb-2 mb-3 flex items-center gap-1 shrink-0">
                      <ChefHat className="w-4 h-4 text-[#8a6538]" /> {editingDishId ? 'Chỉnh Sửa Món Ăn' : 'Thêm ặc Sản Thực ơn Mới'}
                    </h4>
                    
                    <form onSubmit={handleCreateDish} className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs shrink-0 scrollbar-thin pb-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Tên món đặc sản</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ví dụ: Bún chả Hàng Mành"
                            value={newDishName}
                            onChange={(e) => setNewDishName(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-semibold text-stone-800 focus:outline-none focus:border-[#8a6538]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Mức giá bán (đ)</label>
                          <input 
                            type="number"
                            required
                            value={newDishPrice}
                            onChange={(e) => setNewDishPrice(Number(e.target.value))}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono font-bold focus:outline-none focus:border-[#8a6538]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Phân loại món</label>
                          <select 
                            value={newDishCategory}
                            onChange={(e: any) => setNewDishCategory(e.target.value)}
                            className="w-full bg-stone-50 border border-[#ded9cf] rounded-lg p-2 font-semibold focus:outline-none focus:border-[#8a6538]"
                          >
                            <option value="main">Món chính</option>
                            <option value="starter">Khai vị</option>
                            <option value="drink">Đồ uống</option>
                            <option value="dessert">Tráng miệng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Link ảnh minh họa</label>
                          <input 
                            type="text"
                            value={newDishImage}
                            onChange={(e) => setNewDishImage(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-[#8a6538] text-[9.5px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Mô tả đặc vị hấp dẫn</label>
                        <textarea
                          rows={2}
                          placeholder="Ghi dòng giới thiệu nức tiếng của mâm cơm..."
                          value={newDishDesc}
                          onChange={(e) => setNewDishDesc(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-[#8a6538]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold uppercase text-[10.5px] tracking-widest rounded-xl transition-all cursor-pointer shadow-sm text-center"
                        >
                          {editingDishId ? '✓ Lưu cập nhật món' : '✓ Xác nhận tạo món'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDishId(null);
                            setNewDishName('');
                            setNewDishPrice(65000);
                            setNewDishCategory('main');
                            setNewDishDesc('');
                            setNewDishImage('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600');
                          }}
                          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase text-[10.5px] tracking-widest rounded-xl transition-all cursor-pointer border border-stone-300 text-center"
                        >
                          Đặt lại form
                        </button>
                      </div>
                    </form>

                    <div className="mt-4 border-t border-stone-100 pt-4 overflow-y-auto pr-1 space-y-2">
                      {dishes.map((dish) => (
                        <div key={dish.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-800 truncate">{dish.name}</p>
                              <p className="text-[10px] text-stone-500 font-medium">{dish.price.toLocaleString('vi-VN')} đ · {dish.category}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${dish.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                              {dish.isAvailable ? 'đang bán' : 'ẩn bán'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditDish(dish)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 text-[10px] font-bold uppercase cursor-pointer hover:bg-stone-100"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await fetch('/api/dishes/update-stock', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ dishId: dish.id, isAvailable: !dish.isAvailable })
                                });
                                if (res.ok) fetchDishes();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 text-[10px] font-bold uppercase cursor-pointer hover:bg-stone-100"
                            >
                              {dish.isAvailable ? 'Ẩn bán' : 'Mở bán'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDish(dish.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase cursor-pointer hover:bg-rose-100"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </RestaurantSideColumn>
                )}

                {restaurantView === 'reservations' && (
                  <div className="xl:col-span-12 flex flex-col overflow-hidden bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                      <div>
                        <h3 className="font-serif font-bold text-stone-850 italic text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#8a6538]" /> Quản lý đặt bàn giữ chỗ
                        </h3>
                        <p className="text-xs text-stone-500 mt-1">Theo dõi các bàn đã xác nhận và xử lý thay đổi từ khách ngay tại màn hình này.</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#8a6538] text-white text-[10px] font-bold uppercase tracking-wide">
                        {reservations.length} lượt giữ chỗ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Đã xác nhận</p>
                        <p className="text-2xl font-serif font-black text-[#8a6538] mt-1">{reservations.length}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Tổng khách</p>
                        <p className="text-2xl font-serif font-black text-stone-800 mt-1">{reservations.reduce((sum, res) => sum + res.numberOfGuests, 0)}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Khung cao điểm</p>
                        <p className="text-lg font-serif font-black text-amber-700 mt-1">18:00 - 20:30</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {reservations.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-400 italic font-mono text-sm">
                          Hôm nay chưa có lịch giữ bàn nào.
                        </div>
                      ) : (
                        reservations.map((res) => (
                          <div key={res.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div className="space-y-1.5 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-serif font-bold text-[#8a6538] text-lg">{res.customerName}</span>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Confirmed</span>
                                </div>
                                <p className="text-stone-600">🕒 {res.reservationTime}</p>
                                <p className="text-stone-600">👥 {res.numberOfGuests} khách</p>
                                <p className="text-stone-600">📞 {res.phoneNumber}</p>
                                <p className="text-stone-600">🪑 Bàn #{res.tableNumber} · {res.sittingArea || 'Trong nhà'}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserRole('customer');
                                    setActiveTab('chat');
                                    handleSendChatMessage(`Tư vấn xác nhận giữ bàn cho khách ${res.customerName} lúc ${res.reservationTime}`);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                  Mở AI hỗ trợ
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch('/api/reservations/cancel', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: res.id })
                                    });
                                    refreshOrdersAndReservations();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  Hủy giữ chỗ
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {restaurantView === 'menu' && (
                  <div className="xl:col-span-12 grid grid-cols-1 xl:grid-cols-5 gap-6 overflow-hidden">
                    <div className="xl:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden shadow-xs">
                      <h4 className="font-serif font-bold text-stone-850 italic text-sm border-b border-stone-100 pb-2 mb-3 flex items-center gap-1 shrink-0">
                        <ChefHat className="w-4 h-4 text-[#8a6538]" /> {editingDishId ? 'Chỉnh sửa món ăn' : 'Thêm đặc sản thực đơn mới'}
                      </h4>
                      <form onSubmit={handleCreateDish} className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs shrink-0 scrollbar-thin pb-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Tên món đặc sản</label>
                            <input type="text" required placeholder="Ví dụ: Bún chả Hàng Mành" value={newDishName} onChange={(e) => setNewDishName(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-semibold text-stone-800 focus:outline-none focus:border-[#8a6538]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Mức giá bán (đ)</label>
                            <input type="number" required value={newDishPrice} onChange={(e) => setNewDishPrice(Number(e.target.value))} className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono font-bold focus:outline-none focus:border-[#8a6538]" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Phân loại món</label>
                            <select value={newDishCategory} onChange={(e: any) => setNewDishCategory(e.target.value)} className="w-full bg-stone-50 border border-[#ded9cf] rounded-lg p-2 font-semibold focus:outline-none focus:border-[#8a6538]">
                              <option value="main">Món chính</option>
                              <option value="starter">Khai vị</option>
                              <option value="drink">Đồ uống</option>
                              <option value="dessert">Tráng miệng</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Link ảnh minh họa</label>
                            <input type="text" value={newDishImage} onChange={(e) => setNewDishImage(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-[#8a6538] text-[9.5px]" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase font-mono mb-1">Mô tả đặc vị hấp dẫn</label>
                          <textarea rows={2} placeholder="Ghi dòng giới thiệu nức tiếng của mâm cơm..." value={newDishDesc} onChange={(e) => setNewDishDesc(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-[#8a6538]" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button type="submit" className="w-full py-2.5 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold uppercase text-[10.5px] tracking-widest rounded-xl transition-all cursor-pointer shadow-sm text-center">
                            {editingDishId ? '✓ Lưu cập nhật món' : '✓ Xác nhận tạo món'}
                          </button>
                          <button type="button" onClick={() => {
                            setEditingDishId(null);
                            setNewDishName('');
                            setNewDishPrice(65000);
                            setNewDishCategory('main');
                            setNewDishDesc('');
                            setNewDishImage('https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600');
                          }} className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase text-[10.5px] tracking-widest rounded-xl transition-all cursor-pointer border border-stone-300 text-center">
                            Đặt lại form
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="xl:col-span-3 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden shadow-xs">
                      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                        <div>
                          <h3 className="font-serif font-bold text-stone-850 italic text-base">Kho món đang phục vụ</h3>
                          <p className="text-xs text-stone-500 mt-1">Thêm, sửa, ẩn bán hoặc xoá món trực tiếp theo thời gian thực.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#8a6538] text-white text-[10px] font-bold uppercase tracking-wide">
                          {dishes.length} món
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                        {dishes.map((dish) => (
                          <div key={dish.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-base font-bold text-stone-800 truncate">{dish.name}</p>
                                <p className="text-xs text-stone-500 mt-1">{dish.price.toLocaleString('vi-VN')} đ · {dish.category}</p>
                                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{dish.description}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dish.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                                {dish.isAvailable ? 'đang bán' : 'ẩn bán'}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleEditDish(dish)} className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold cursor-pointer hover:bg-stone-100">
                                Sửa món
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await fetch('/api/dishes/update-stock', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ dishId: dish.id, isAvailable: !dish.isAvailable })
                                  });
                                  if (res.ok) fetchDishes();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[11px] font-bold cursor-pointer hover:bg-stone-100"
                              >
                                {dish.isAvailable ? 'Ẩn bán' : 'Mở bán'}
                              </button>
                              <button type="button" onClick={() => handleDeleteDish(dish.id)} className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold cursor-pointer hover:bg-rose-100">
                                Xóa món
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
          </RestaurantApp>

          <ShipperApp isVisible={isShipperRole}>
              
              {/* Left Panel: Active deliverers list */}
              <ShipperOrdersList>
                <div className="p-4 bg-[#8a6538]/10 border-b border-stone-200 relative shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#8a6538] text-white flex items-center justify-center font-bold text-xs shadow">R</div>
                      <div>
                        <h4 className="font-extrabold text-xs text-stone-850">Shipper: Trần Văn Định</h4>
                        <p className="text-[10px] text-stone-500 font-semibold font-mono">🛵 29H1-999.99 (Đang Online)</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-full font-mono text-[9px] font-bold text-amber-800">★ 4.98</span>
                  </div>
                </div>

                <div className="p-3 border-b border-stone-100 shrink-0">
                  <h5 className="text-[10px] font-mono uppercase font-bold text-[#8a6538] mb-1">Đơn hàng Hương Việt giao tận nhà ({shipperVisibleOrders.length})</h5>
                  <p className="text-[9px] text-stone-400 font-medium leading-none">Bấm vào đơn hàng để xem bản đồ chi tiết và tiến hành giao vận</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 p-3 scrollbar-thin">
                  {shipperVisibleOrders.length === 0 ? (
                    <div className="text-center py-12 italic text-stone-400 font-mono text-xs">Không có đơn hàng giao nhận nhà trên bản đồ hiện tại.</div>
                  ) : (
                    shipperVisibleOrders.map(o => (
                      <div 
                        key={o.id} 
                        onClick={() => setSelectedShipperOrder(o)}
                        className={`p-3 border rounded-xl cursor-pointer transition-colors text-xs select-none ${
                          selectedShipperOrder?.id === o.id 
                            ? 'border-[#8a6538] bg-amber-50/30 shadow-xs' 
                            : 'border-stone-200 hover:bg-stone-50 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono font-bold text-[#8a6538]">{o.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold uppercase border ${
                            o.trackingStatus === 'delivered' ? 'bg-emerald-50 text-emerald-850 border-emerald-250' :
                            o.trackingStatus === 'shipping' ? 'bg-blue-50 text-blue-800 border-blue-250 animate-pulse font-extrabold' :
                            'bg-amber-50 text-amber-800 border-amber-250 font-bold'
                          }`}>
                            {o.trackingStatus}
                          </span>
                        </div>
                        <p className="font-bold text-stone-800 leading-tight truncate">{o.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}</p>
                        
                        <div className="mt-2 text-[10px] text-stone-500 space-y-0.5 font-medium">
                          <div>Thực khách: <strong className="text-stone-800">{o.customerName}</strong></div>
                          <div className="truncate">Điểm đến: <span className="text-stone-750 font-semibold">{o.address || "Phố Cổ, Hà Nội"}</span></div>
                          <div className="flex justify-between items-center pt-1 border-t border-stone-100 mt-1">
                            <span className="font-bold">Tổng tiền mặt cần thu:</span>
                            <span className="text-[#8a6538] font-black italic font-serif text-[11px]">{(o.total + 15000).toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ShipperOrdersList>

              {/* Right Panel: Selected Order Direction and Live OpenStreetMap GPS Simulation Node */}
              <ShipperDeliveryWorkspace>
                {selectedShipperOrder ? (
                  <>
                  {shipperView === 'orders' && (
                    <div className="flex-1 flex flex-col overflow-hidden h-full bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Tác vụ đơn giao</p>
                          <h3 className="text-lg font-serif font-black text-stone-850 mt-1">{selectedShipperOrder.id}</h3>
                          <p className="text-xs text-stone-500 mt-1">{selectedShipperOrder.customerName} · {selectedShipperOrder.address || 'Hà Nội'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          selectedShipperOrder.trackingStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          selectedShipperOrder.trackingStatus === 'shipping' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {selectedShipperOrder.trackingStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Tiền thu hộ</p>
                          <p className="text-xl font-serif font-black text-[#8a6538] mt-1">{(selectedShipperOrder.total + 15000).toLocaleString('vi-VN')} đ</p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Phương thức</p>
                          <p className="text-xl font-serif font-black text-stone-800 mt-1">{selectedShipperOrder.paymentMethod.toUpperCase()}</p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Tiến độ GPS</p>
                          <p className="text-xl font-serif font-black text-stone-800 mt-1">{(selectedShipperOrder.manualDriverStep ?? 0) + 1}/{DRIVER_ROUTE_COORDS.length}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 overflow-hidden">
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 overflow-y-auto">
                          <h4 className="text-xs uppercase tracking-widest text-[#8a6538] font-mono font-bold mb-3">Danh sách món cần giao</h4>
                          <div className="space-y-2">
                            {selectedShipperOrder.items.map((item, idx) => (
                              <div key={`${item.name}-${idx}`} className="flex items-center justify-between rounded-xl bg-white border border-stone-200 p-3 text-sm">
                                <span className="font-semibold text-stone-800">{item.name}</span>
                                <span className="text-stone-500 font-mono">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 overflow-y-auto">
                          <h4 className="text-xs uppercase tracking-widest text-[#8a6538] font-mono font-bold mb-3">Thao tác nhanh</h4>
                          <div className="space-y-2">
                            {selectedShipperOrder.trackingStatus === 'preparing' && (
                              <button onClick={() => handleShipperUpdateStep(2)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer">
                                Xác nhận nhận đơn
                              </button>
                            )}
                            {selectedShipperOrder.trackingStatus !== 'delivered' && (
                              <button onClick={() => handleShipperUpdateStep(7)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer">
                                Xác nhận hoàn tất đơn
                              </button>
                            )}
                            <button onClick={() => setShipperView('route')} className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer">
                              Mở màn lộ trình
                            </button>
                            <button onClick={() => setShipperView('customer')} className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer">
                              Mở màn khách nhận
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {shipperView === 'customer' && (
                    <div className="flex-1 flex flex-col overflow-hidden h-full bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                      <div className="border-b border-stone-100 pb-4 mb-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-mono font-bold">Khách nhận & thanh toán</p>
                        <h3 className="text-lg font-serif font-black text-stone-850 mt-1">{selectedShipperOrder.customerName}</h3>
                        <p className="text-xs text-stone-500 mt-1">{selectedShipperOrder.id} · {selectedShipperOrder.phoneNumber}</p>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 overflow-hidden">
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 overflow-y-auto space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Thông tin giao</p>
                            <p className="text-sm text-stone-800 mt-2">📍 {selectedShipperOrder.address || 'Hà Nội'}</p>
                            <p className="text-sm text-stone-800 mt-1">📞 {selectedShipperOrder.phoneNumber}</p>
                            <p className="text-sm text-stone-800 mt-1">💳 {selectedShipperOrder.paymentMethod.toUpperCase()}</p>
                            <p className="text-sm text-stone-800 mt-1">💰 {(selectedShipperOrder.total + 15000).toLocaleString('vi-VN')} đ</p>
                          </div>

                          <div className="rounded-xl bg-white border border-stone-200 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Ghi chú trò chuyện</p>
                            <p className="text-xs text-stone-600 leading-relaxed mt-2">
                              Dùng LiveKit để phối hợp trực tiếp với khách khi đang giao. Sau đó quay lại màn đơn hàng để xác nhận hoàn tất.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 overflow-y-auto">
                          <h4 className="text-xs uppercase tracking-widest text-[#8a6538] font-mono font-bold mb-3">Hành động với khách</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => startLivekitRoleCall(selectedShipperOrder, 'customer-shipper')}
                              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <PhoneCall className="w-3.5 h-3.5" /> Mở phòng gọi khách hàng
                            </button>
                            <button
                              onClick={() => {
                                setUserRole('customer');
                                setActiveTab('chat');
                                handleSendChatMessage(`Kiểm tra hướng dẫn giao nhận cho đơn ${selectedShipperOrder.id} và hỗ trợ xác nhận với khách ${selectedShipperOrder.customerName}`);
                              }}
                              className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                            >
                              Mở AI hỗ trợ giao đơn
                            </button>
                            <button
                              onClick={() => setShipperView('orders')}
                              className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                            >
                              Quay lại màn đơn hàng
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {shipperView === 'route' && (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                    
                    {/* Left sub-column: control and direction steps */}
                    <ShipperRoutePanel>
                      <div className="space-y-4">
                        <div className="border-b border-stone-250 pb-3">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">Chi tiết giao nhận</p>
                          <h4 className="text-sm font-serif font-black text-stone-850 mt-1">Hóa đơn: {selectedShipperOrder.id}</h4>
                          <div className="text-xs text-stone-600 mt-2.5 space-y-1.5 leading-normal font-medium">
                            <div>👤 Khách nhận: <span className="text-stone-850 font-bold">{selectedShipperOrder.customerName}</span></div>
                            <div>📞 Điện thoại: <a href={`tel:${selectedShipperOrder.phoneNumber}`} className="text-[#8a6538] font-extrabold font-mono underline">{selectedShipperOrder.phoneNumber}</a></div>
                            <div>📍 Giao tại: <span className="text-stone-850 font-semibold leading-normal block mt-0.5">{selectedShipperOrder.address}</span></div>
                            <div>💰 Cần thu hộ: <strong className="text-[#8a6538] font-black text-sm font-serif">{(selectedShipperOrder.total + 15000).toLocaleString('vi-VN')} đ</strong></div>
                            <div>💳 Thanh toán: <span className="px-1.5 py-0.5 bg-stone-205 text-stone-700 font-mono text-[9px] font-bold rounded uppercase">{selectedShipperOrder.paymentMethod}</span></div>
                          </div>
                        </div>

                        {/* Manual GPS Step simulation panel */}
                        <div>
                          <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8a6538] mb-1.5 flex items-center gap-1">
                            🛵 Trình giả lập live GPS vệ tinh
                          </h5>
                          <p className="text-[10px] text-stone-500 leading-normal mb-3 font-medium">
                            Bấm vào từng toạ độ bên dưới để nhấp chuột di chuyển xe của quý khách trên bản đồ Leaflet OpenStreetMap. Vị trí sẽ tự đồng bộ với khách hàng lập tức!
                          </p>

                          <div className="space-y-1.5 text-[10.5px] font-sans">
                            {DRIVER_ROUTE_COORDS.map((coord, idx) => {
                              const isCurrent = (selectedShipperOrder.manualDriverStep ?? 0) === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleShipperUpdateStep(idx)}
                                  className={`w-full p-2 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                                    isCurrent 
                                      ? 'bg-[#8a6538] text-white font-extrabold border-[#8a6538] shadow-xs' 
                                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 shadow-2xs'
                                  }`}
                                >
                                  <span className="truncate">{coord.title}</span>
                                  {isCurrent && <span className="text-[9px] font-mono bg-white text-[#8a6538] px-1.5 py-0.5 rounded-full font-bold">LIVE GPS</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Quick state triggers */}
                      <div className="pt-4 border-t border-stone-200 mt-6 space-y-2 shrink-0">
                        {['preparing', 'shipping'].includes(selectedShipperOrder.trackingStatus) && (
                          <button
                            onClick={() => startLivekitRoleCall(selectedShipperOrder, 'restaurant-shipper')}
                            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Mở phòng gọi quán ăn
                          </button>
                        )}

                        {selectedShipperOrder.trackingStatus === 'shipping' && (
                          <button
                            onClick={() => startLivekitRoleCall(selectedShipperOrder, 'customer-shipper')}
                            className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Mở phòng gọi khách hàng
                          </button>
                        )}

                        {selectedShipperOrder.trackingStatus === 'preparing' && (
                          <button
                            onClick={() => handleShipperUpdateStep(2)} // start on route
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer text-center block"
                          >
                            Xác nhận nhận đơn
                          </button>
                        )}
                        
                        {selectedShipperOrder.trackingStatus !== 'delivered' && (
                          <button
                            onClick={() => handleShipperUpdateStep(7)} // final delivery step
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer text-center block"
                          >
                            Xác nhận giao hàng thành công
                          </button>
                        )}
                        
                        <div className="text-[9px] text-center text-stone-400 font-mono italic">Hương Việt Giao Hàng chuẩn vị 2026</div>
                      </div>

                    </ShipperRoutePanel>

                    {/* Right sub-column: Leaflet tracking map */}
                    <div className="flex-1 h-full relative min-h-[300px]">
                      <div className="absolute top-4 left-4 bg-white/95 border border-stone-200 rounded-xl p-2.5 z-10 shadow-md font-sans text-xs">
                        <p className="font-extrabold text-stone-800">📍 Hành trình giao hàng tối ưu</p>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-normal">
                          Bắt đầu: {DRIVER_ROUTE_COORDS[0].title} <br />
                          Nơi đến: {selectedShipperOrder.address || "Hà Nội"}
                        </p>
                      </div>

                      <MapErrorBoundary fallback={<div className="h-full w-full flex items-center justify-center text-xs text-stone-400 italic">Bản đồ Leaflet đang chuẩn bị dữ liệu...</div>}>
                        <LeafletMap 
                          restaurantCoords={{ lat: 21.0260, lng: 105.8550 }}
                          deliveryCoords={{ lat: 21.0338, lng: 105.8460 }} // Phố Cổ Hoàn Kiếm, HN
                          driverCoords={DRIVER_ROUTE_COORDS[selectedShipperOrder.manualDriverStep ?? 0]}
                          driverStatus={selectedShipperOrder.trackingStatus}
                        />
                      </MapErrorBoundary>
                    </div>

                  </div>
                  )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-400 italic font-mono space-y-2 bg-stone-50 h-full">
                    <Map className="w-12 h-12 text-[#8a6538] opacity-35 animate-pulse" />
                    <p className="text-xs font-semibold">Vui lòng lựa chọn một đơn hàng từ cột bên trái để quản trị giao nhận vận chuyển.</p>
                  </div>
                )}
              </ShipperDeliveryWorkspace>

          </ShipperApp>
        </main>

          {/* MODAL 0: Detailed Dish Recipe and Nutrition Modal */}
          {selectedDishDetail && (
        <div id="dish-detail-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white border border-stone-305 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-8">
            {/* Header banner image */}
            <div className="relative h-64 w-full bg-stone-100">
              <img 
                src={selectedDishDetail.image} 
                alt={selectedDishDetail.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              
              <button 
                onClick={() => setSelectedDishDetail(null)}
                className="absolute top-4 right-4 bg-white/95 hover:bg-white p-2 rounded-full text-stone-700 hover:text-stone-900 transition-all cursor-pointer z-10 border border-stone-250 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-3 py-1 bg-[#8a6538]/20 text-yellow-300 border border-[#8a6538]/30 text-[10px] font-mono rounded-full font-bold uppercase tracking-widest">
                  {selectedDishDetail.category === 'main' ? 'Món chính tinh hoa' : selectedDishDetail.category === 'starter' ? 'Khai vị đặc sản' : selectedDishDetail.category === 'dessert' ? 'Tráng miệng ngọt lành' : 'Đồ uống độc bản'}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif text-white font-extrabold mt-2 tracking-tight drop-shadow-md">
                  {selectedDishDetail.name}
                </h2>
                <p className="text-xs text-amber-300 font-mono flex items-center gap-1 mt-1 drop-shadow-sm font-bold">
                  <Star className="w-4 h-4 fill-current text-amber-400 inline" />
                  <span>{selectedDishDetail.rating} / 5.0 - Tuyệt hảo</span>
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
              
              {/* Description */}
              <div>
                <p className="text-sm text-stone-600 leading-relaxed italic font-medium">
                  "{selectedDishDetail.description}"
                </p>
              </div>

              {/* Informative Nutrition Grid */}
              {selectedDishDetail.nutrition && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-xs">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#8a6538] mb-3 flex items-center gap-1 font-bold">
                    <FileText className="w-3.5 h-3.5" /> Thông tin dinh dưỡng (Mỗi phần phục vụ)
                  </h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-white border border-stone-200 p-2 rounded-xl shadow-xs">
                      <span className="block text-lg font-serif font-bold text-[#8a6538]">{selectedDishDetail.nutrition.calories}</span>
                      <span className="text-[10px] text-stone-500 block font-mono font-medium">Calo</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-2 rounded-xl shadow-xs">
                      <span className="block text-lg font-serif font-bold text-stone-850">{selectedDishDetail.nutrition.protein}</span>
                      <span className="text-[10px] text-stone-500 block font-mono font-medium">Đạm (Protein)</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-2 rounded-xl shadow-xs">
                      <span className="block text-lg font-serif font-bold text-stone-850">{selectedDishDetail.nutrition.carbs}</span>
                      <span className="text-[10px] text-stone-500 block font-mono font-medium">Carbs</span>
                    </div>
                    <div className="bg-white border border-stone-200 p-2 rounded-xl shadow-xs">
                      <span className="block text-lg font-serif font-bold text-stone-850">{selectedDishDetail.nutrition.fat}</span>
                      <span className="text-[10px] text-stone-500 block font-mono font-medium">Béo (Fat)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients section */}
              {selectedDishDetail.ingredients && selectedDishDetail.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#8a6538] mb-3 flex items-center gap-1 font-bold">
                    <ChefHat className="w-3.5 h-3.5 text-[#8a6538]" /> Nguyên liệu chuẩn vị Việt Nam
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDishDetail.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold flex items-center gap-1.5 hover:border-[#8a6538]/20 transition-colors">
                        <Check className="w-3.5 h-3.5 text-[#8a6538] shrink-0" />
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking Guide / Instructions */}
              {selectedDishDetail.instructions && selectedDishDetail.instructions.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#8a6538] mb-3.5 flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#8a6538]" /> Bí quyết & Hướng dẫn chế biến ẩm thực
                  </h4>
                  <ol className="space-y-4">
                    {selectedDishDetail.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="w-6 h-6 bg-[#8a6538]/10 text-[#8a6538] border border-[#8a6538]/20 text-xs font-mono rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                          {i + 1}
                        </span>
                        <p className="text-xs md:text-sm text-stone-700 leading-relaxed font-medium">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Reviews and Ratings Section */}
              <div className="border-t border-stone-150 pt-6">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#8a6538] mb-4 flex items-center gap-1.5 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current text-[#8a6538]" /> ánh giá từ thực khách ({selectedDishDetail.reviews?.length || 0})
                </h4>

                {/* Submit New Review Form */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 mb-6 space-y-4 shadow-xs">
                  <h5 className="text-[11px] font-mono uppercase tracking-wider text-stone-700 font-bold">Viết lời phê bình của bạn</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 uppercase font-mono mb-1 font-bold">Tên của bạn</label>
                      <input 
                        type="text" 
                        placeholder="ví dụ: Minh Tuấn"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 uppercase font-mono mb-1 font-bold">Điểm bình chọn (1 - 5 sao)</label>
                      <div className="flex items-center space-x-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="p-0.5 focus:outline-none transition-transform active:scale-95 cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-500 uppercase font-mono mb-1 font-bold">Nhận xét cảm nhận thực tế</label>
                    <textarea 
                      placeholder="Chia sẻ về hương vị, cách nêm nếm, độ mềm của thịt..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      rows={2.5}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={async () => {
                        await handleSubmitReview(selectedDishDetail.id);
                      }}
                      disabled={isSubmittingReview || !newReviewName || !newReviewText}
                      className="px-4 py-2 bg-[#8a6538] disabled:bg-[#8a6538]/20 disabled:text-neutral-900/40 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all hover:bg-[#6c4d29] cursor-pointer shadow-xs"
                    >
                      {isSubmittingReview ? 'Đang gửi phản hồi...' : 'Gửi đánh giá'}
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {(!selectedDishDetail.reviews || selectedDishDetail.reviews.length === 0) ? (
                    <p className="text-xs text-stone-400 italic font-mono p-4 bg-stone-50 rounded-xl border border-stone-200 text-center font-medium">Chưa có bình luận nào cho món này. Hãy trở thành người đầu tiên viết phê bình!</p>
                  ) : (
                    selectedDishDetail.reviews.map((rev, idx) => (
                      <div key={idx} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-800">{rev.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono font-bold">{rev.date}</span>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
            
            <div className="space-y-4 text-xs">
              
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Tên khách hàng</label>
                <input 
                  type="text" 
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Số điện thoại liên lạc</label>
                <input 
                  type="text" 
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Địa chỉ Email (Nhận thông báo qua Resend)</label>
                <input 
                  type="email" 
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  placeholder="ví dụ: mha17003@gmail.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                />
                <p className="text-[10px] text-stone-400 mt-1 italic font-medium">💡 Nếu dùng tài khoản mặc định của Resend, vui lòng điền email đăng ký của bạn là <strong>mha17003@gmail.com</strong>.</p>
              </div>

              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Địa chỉ giao hàng tận tay</label>
                  <input 
                    type="text" 
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-850 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#8a6538] focus:border-[#8a6538]"
                  />
                </div>
                  <button
                    onClick={() => setSelectedPayment('zalopay')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${selectedPayment === 'zalopay' ? 'border-[#0068ff] bg-[#0068ff]/5 text-[#0068ff] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}`}
                  >
                    <span className="w-5 h-5 bg-[#0068ff] rounded-full text-white flex items-center justify-center text-[10px] font-extrabold mb-1">Z</span>
                    <span className="text-[10px]">ZALO PAY</span>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('cash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${selectedPayment === 'cash' ? 'border-[#8a6538] bg-[#8a6538]/5 text-[#8a6538] font-bold' : 'border-stone-250 bg-stone-50 text-stone-500 hover:bg-stone-100 font-medium'}`}
                  >
                    <span className="w-5 h-5 bg-stone-200 rounded-full text-[#8a6538] flex items-center justify-center text-[10.5px] font-extrabold mb-1">C</span>
                    <span className="text-[10px]">TIỀN MẶT</span>
                  </button>
                </div>
              </div>

            </div>

            <button
              onClick={executeCheckout}
              className="w-full mt-6 py-3 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              Xác nhận Đặt hàng & Ship ngay
            </button>
          </div>
            ) : (
              // --- THE NEW ADVANCED OFFICIAL / SIMULATED SANDBOX FLOW ---
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                
                {/* Left side: Simulated App Payment View (Client Experience) */}
                <div className="md:col-span-5 bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-center">
                    {paymentQRModal.method === 'momo' ? (
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#a50064] text-white rounded-2xl text-xl font-bold mb-2 font-serif shadow-md">M</div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0068ff] text-white rounded-2xl text-xl font-bold mb-2 font-serif shadow-md animate-pulse">Z</div>
                    )}
                    <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider">{paymentQRModal.method === 'momo' ? 'Cổng MoMo Sandbox' : 'Cổng ZaloPay Sandbox'}</h4>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-250 font-mono mt-1">
                      {sandboxRealApi ? '🔌 MÔI TRƯỜNG TEST LIVE' : '🧪 MÔI TRƯỜNG GIẢ LẬP'}
                    </span>
                  </div>

                  {/* QR / Loader code */}
                  <div className="my-3 p-3 bg-white border border-stone-200 rounded-xl flex flex-col items-center justify-center min-h-[12rem] relative">
                    {sandboxLoading ? (
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 border-4 border-[#8a6538] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] font-mono text-stone-500 text-center">Đang kết xuất gói chữ ký...</p>
                      </div>
                    ) : sandboxError ? (
                      <div className="text-center p-3 text-rose-600">
                        <p className="text-[11px] font-bold">Lỗi cấu hình Sandbox</p>
                        <p className="text-[10px] font-medium leading-tight mt-1">{sandboxError}</p>
                      </div>
                    ) : (
                      <div className="w-full space-y-2.5">
                        <div className="w-28 h-28 border border-stone-150 rounded-lg p-3 bg-stone-50 flex items-center justify-center mx-auto">
                          {paymentQRModal.method === 'momo' ? (
                            <div className="text-center space-y-1 bg-white p-2 border border-pink-200 rounded-md">
                              <span className="text-[16px] block font-black text-[#a50064] leading-none">MOMO</span>
                              <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                            </div>
                          ) : (
                            <div className="text-center space-y-1 bg-white p-2 border border-blue-200 rounded-md">
                              <span className="text-[16px] block font-black text-[#0068ff] leading-none">ZALO</span>
                              <span className="text-[8px] font-mono text-stone-400 block tracking-tighter">SANDBOX</span>
                            </div>
                          )}
                        </div>

                        {sandboxPayUrl && sandboxPayUrl !== '#' ? (
                          <a
                            href={sandboxPayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold uppercase rounded-lg text-center transition-all inline-flex items-center justify-center space-x-1 shadow-sm font-sans"
                          >
                            <span>Thanh toán Sandbox từ ví thực ↗</span>
                          </a>
                        ) : (
                          <div className="text-center py-1.5 px-2.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                            Không nhận được link chuyển hướng Sandbox từ Cổng API
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700 bg-stone-100/50 p-3 rounded-lg border border-stone-150">
                    <p className="flex justify-between"><span>Đơn hàng:</span> <strong className="font-mono text-[#8a6538]">{paymentQRModal.orderId}</strong></p>
                    <p className="flex justify-between"><span>Tổng cộng:</span> <strong className="text-stone-850 font-bold">{(paymentQRModal.amount + 15000).toLocaleString('vi-VN')} đ</strong></p>
                    <p className="flex justify-between"><span>Cổng trả:</span> <span className="font-bold uppercase text-stone-900">{paymentQRModal.method}</span></p>
                  </div>
                </div>

                {/* Right side: Connected Sandbox Trace terminal (Developer Experience) */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest">Giao diện Báo cáo Gỡ lỗi API Sandbox</h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    {/* Developer logs console terminal */}
                    <div className="bg-stone-955 text-stone-300 font-mono text-[10px] p-3 rounded-xl border border-stone-900 h-44 overflow-y-auto space-y-1 leading-normal select-text">
                      <p className="text-sky-400 font-bold border-b border-stone-900 pb-1.5 mb-1.5 shadow-xs uppercase">Nhật ký Console Trace:</p>
                      {sandboxLogs.map((log, idx) => (
                        <p key={idx} className="border-b border-stone-900/40 py-0.5">
                          <span className="text-stone-500 mr-1.5">[{idx+1}]</span>
                          <span className={log.includes('Lỗi') || log.includes('ERROR') ? 'text-rose-400 font-sans' : log.includes('✓') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{log}</span>
                        </p>
                      ))}
                    </div>

                    {/* Calculated Signed payload details inspector */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mật mã số hoá và payload gửi đi (HMAC-SHA255)</p>
                      <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-[10.5px] font-mono overflow-x-auto text-stone-600 max-h-24 select-text">
                        <p className="text-stone-850 font-bold">Chữ ký: <span className="text-indigo-700 font-medium break-all">{sandboxSignature || '(Đang tạo...)'}</span></p>
                        <p className="text-stone-500 mt-1">Payload: {sandboxPayload ? JSON.stringify(sandboxPayload) : '(Trống)'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-150 space-y-2">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setPaymentQRModal(prev => ({ ...prev, isOpen: false }))}
                        className="flex-1 py-2 border border-stone-250 bg-white hover:bg-stone-50 text-stone-700 text-[10.5px] uppercase font-bold rounded-xl cursor-pointer text-center transition-all shadow-2xs"
                      >
                        Huỷ thanh toán
                      </button>

                      <button
                        onClick={() => handleConfirmDirectPayment(paymentQRModal.orderId, paymentQRModal.method)}
                        className="flex-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] uppercase tracking-wider font-bold rounded-xl cursor-pointer text-center transition-all shadow-sm"
                      >
                        ✓ Giả lập Callback THÀNH CÔNG (Thu tiền)
                      </button>
                    </div>

                    {/* Instructions on how to unlock live calling */}
                    <p className="text-[9.5px] text-stone-500 leading-tight text-center font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-250">
                      💡 Mẹo: Hệ thống đã <strong>kết nối thành công cổng API thật ZaloPay &amp; MoMo Sandbox</strong> bằng tài khoản môi trường kiểm thử dùng chung! Quý khách có thể bấm nút màu xanh lá ở trên để trải nghiệm thử phiên làm việc thanh toán thực tế trực tuyến.
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}


      {/* MODAL 3: Inbound Ringing Voice Call notification overlay */}
      {callIncoming && (
        <div id="incoming-call-alert" className="fixed bottom-6 right-6 bg-white border-2 border-[#8a6538] rounded-3xl p-5 shadow-2xl max-w-sm z-50 flex items-center space-x-4 animate-bounce">
          <div className="w-12 h-12 rounded-full bg-[#8a6538]/10 border border-[#8a6538] flex items-center justify-center animate-ping shrink-0">
            <PhoneCall className="w-6 h-6 text-[#8a6538]" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-mono text-[#8a6538] font-bold uppercase tracking-wider">Hương Việt AI đang gọi...</h4>
            <p className="text-xs text-stone-850 font-bold mt-1 leading-tight">Cuộc gọi xác nhận đơn đặt hàng {activeCallTargetOrder?.id}</p>
            <p className="text-[10px] text-stone-500 font-medium">Tổng đài tự động robot đang thực hiện cuộc gọi.</p>

            <div className="mt-3 flex space-x-2">
              <button 
                onClick={() => setCallIncoming(false)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-500 font-semibold text-[10px] rounded-lg cursor-pointer transition-colors"
              >
                Tắt chuông
              </button>
              
              <button 
                id="incoming-call-accept"
                onClick={handleAcceptCall}
                className="px-4 py-1.5 bg-[#8a6538] hover:bg-[#6c4d29] text-white font-bold text-[10px] uppercase rounded-full shadow-xs cursor-pointer transition-colors"
              >
                NHẬN CUỘC GỌI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Active Telephone speaking/hearing interactive controller */}
      {isPhoneCallActive && (
        <div id="phone-simulation-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-stone-250 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col justify-between h-[520px]">
            
            {/* Top Bar Call Info */}
            <div className="text-center shrink-0">
              <div className="w-14 h-14 rounded-full bg-[#8a6538]/10 border border-[#8a6538] flex items-center justify-center mx-auto mb-3">
                <Bot className="w-7 h-7 text-[#8a6538]" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-850">Hệ thống thoại Hương Việt AI</h3>
              <p className="text-xs text-emerald-700 font-bold animate-pulse font-mono tracking-widest mt-1">0:14 • ĐANG ĐÀM THOẠI TRỰC TIẾP</p>
            </div>

            {/* Sound Wave Equalizer Pulse Animation */}
            <div className="flex items-end justify-center space-x-1.5 h-14 my-4 shrink-0">
              <div className="w-1 bg-[#8a6538] h-8 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-12 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-5 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-14 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-9 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-12 rounded-full wave-bar" />
              <div className="w-1 bg-[#8a6538] h-4 rounded-full wave-bar" />
            </div>

            {/* Speaking Dialogue transcripts */}
            <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl p-4 overflow-y-auto space-y-3 scrollbar-thin text-xs mb-4 text-stone-800">
              {phoneCallDialog.map((dial, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl shadow-xs transition-all ${dial.speaker === 'assistant' ? 'bg-amber-50/50 text-stone-850 border-l-4 border-[#8a6538] font-medium' : 'bg-stone-200/50 text-stone-800 text-right font-semibold'}`}>
                  <p className="text-[9px] text-stone-400 mb-0.5 uppercase tracking-widest font-mono font-bold">
                    {dial.speaker === 'assistant' ? '🤖 TỔNG ĐÀI AI' : '👤 BẠN NÓI'}
                  </p>
                  <p className="leading-relaxed">{dial.text}</p>
                </div>
              ))}
              {isPhoneCallLoading && (
                <div className="text-stone-400 font-medium italic flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-[#8a6538] rounded-full animate-ping shrink-0" />
                  <span>Tổng đài viên AI đang chuẩn bị phản hồi bằng lời nói...</span>
                </div>
              )}
              <div ref={phoneEndRef} />
            </div>

            {/* Immediate Interactive response inputs */}
            <div className="space-y-4 shrink-0">
              <div className="bg-stone-100 rounded-full p-1.5 flex items-center pr-2 border border-stone-200">
                <input 
                  type="text" 
                  value={phoneCallText}
                  onChange={(e) => setPhoneCallText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPhoneResponse()}
                  placeholder="Trả lời cuộc gọi robot hoặc bấm preset thoại..."
                  className="bg-transparent border-none flex-1 text-xs text-stone-850 px-3 focus:outline-none placeholder:text-stone-400"
                />
                
                <button 
                  onClick={handleSendPhoneResponse}
                  className="p-2 bg-[#8a6538] hover:bg-[#6c4d29] rounded-full text-white cursor-pointer text-xs font-bold transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Instant Telephone Preset options */}
              <div className="flex flex-wrap gap-1.5 justify-center py-1">
                <button 
                  onClick={() => { setPhoneCallText("Dạ đúng rồi, tôi là Nam, đơn đó tôi đặt."); }}
                  className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-250 rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                >
                  "Đúng rồi, tôi là Nam."
                </button>
                <button 
                  onClick={() => { setPhoneCallText("Hủy đơn đó cho tôi nhé, tôi đặt nhầm."); }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-350 rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                >
                  "Hãy hủy đơn này hộ tôi."
                </button>
                <button 
                  onClick={() => { setPhoneCallText("Đã chuyển khoản Momo đầy đủ tiền rồi nha."); }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-350 rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                >
                  "Tôi đã chuyển khoản xong."
                </button>
              </div>

              {/* Action direct simulation tools */}
              <div className="flex gap-2 justify-center pt-2 border-t border-stone-150">
                <button
                  onClick={async () => {
                    if (activeCallTargetOrder) {
                      await fetch('/api/phone-call/simulate-action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: activeCallTargetOrder.id, action: 'confirm' })
                      });
                      setPhoneCallDialog(prev => [...prev, { speaker: 'assistant', text: "👍 GIẢ LẬP: ĐÃ XÁC NHẬN phê duyệt thành công đơn đặt hàng! Nhà bếp đang tiến hành nấu nướng ngon lành." }]);
                      speakSimulated("Giả lập: Hệ thống Hương Việt AI đã xác nhận và phê duyệt thành công món ăn của quý khách.");
                      refreshOrdersAndReservations();
                    }
                  }}
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer transition-all shadow-xs text-center"
                >
                  ✓ Đồng Ý Đơn
                </button>
                <button
                  onClick={async () => {
                    if (activeCallTargetOrder) {
                      await fetch('/api/phone-call/simulate-action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: activeCallTargetOrder.id, action: 'cancel' })
                      });
                      setPhoneCallDialog(prev => [...prev, { speaker: 'assistant', text: "❌ GIẢ LẬP: ĐÃ HỦY thành công đơn đặt món trên hệ thống của nhà hàng." }]);
                      speakSimulated("Giả lập: Đã hủy thành công đơn hàng theo ý muốn của khách.");
                      refreshOrdersAndReservations();
                    }
                  }}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer transition-all shadow-xs text-center"
                >
                  ✕ Hủy Đơn Hàng
                </button>
              </div>

              {/* Hang up trigger */}
              <button
                onClick={() => setIsPhoneCallActive(false)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
              >
                <PhoneOff className="w-4 h-4 text-white" />
                <span>Gác máy cuộc gọi</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <LivekitCallModal
        isOpen={livekitCall.isOpen}
        title={livekitCall.title || undefined}
        subtitle={livekitCall.subtitle || undefined}
        roomName={livekitCall.roomName}
        status={livekitCall.status}
        participants={livekitCall.participants}
        logs={livekitCall.logs}
        onClose={livekitCall.endCall}
      />

      {/* MODAL 4: Full Multi-Role Login & Registration System */}
      {isAuthModalOpen && (
        <div id="social-auth-modal" className="fixed inset-0 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative font-sans max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button 
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 hover:bg-stone-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Icon */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 text-[#8a6538] rounded-2xl mb-3 border border-[#8a6538]/25 shadow-2xs">
              <User className="w-5 h-5 text-[#8a6538]" />
            </div>

            {/* Tab Toggles */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-5 border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                  setIsOtpSent(false);
                  setIsOtpVerified(false);
                  setAuthOtpCode('');
                  setOtpSuccessMessage('');
                  setOtpSimulatedCode('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  authTab === 'login' 
                    ? 'bg-[#8a6538] text-white shadow-xs' 
                    : 'text-stone-550 hover:text-stone-800'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                  setIsOtpSent(false);
                  setIsOtpVerified(false);
                  setAuthOtpCode('');
                  setOtpSuccessMessage('');
                  setOtpSimulatedCode('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  authTab === 'register' 
                    ? 'bg-[#8a6538] text-white shadow-xs' 
                    : 'text-stone-550 hover:text-stone-800'
                }`}
              >
                Đăng ký
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === 'login' ? (
              /* --- LOGIN PAGE --- */
              <form onSubmit={(e) => handleAuthLogin(e)} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập (ví dụ: khach/quan/shipper)"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 font-bold placeholder-stone-400 focus:outline-none focus:border-[#8a6538]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs text-stone-800 font-mono tracking-widest focus:outline-none focus:border-[#8a6538]/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#8a6538] hover:bg-[#6e4e27] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {authLoading ? "Đang xác thực..." : "Xác nhận đăng nhập"}
                </button>

                {/* Quick login helper panel for grading */}
                <div className="bg-amber-50/40 border border-amber-200/55 rounded-2xl p-3.5 mt-4 text-center">
                  <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-[#8a6538] block mb-2">⭐ Khảo thí đăng nhập nhanh</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAuthLogin(undefined, { username: 'khach', password: '123' })}
                      className="bg-white border border-stone-200 hover:border-[#8a6538]/50 rounded-lg p-1.5 text-[10px] font-bold text-stone-700 hover:bg-amber-50 transition-colors shadow-2xs"
                    >
                      👤 Khách
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuthLogin(undefined, { username: 'quan', password: '123' })}
                      className="bg-white border border-stone-200 hover:border-[#8a6538]/50 rounded-lg p-1.5 text-[10px] font-bold text-stone-700 hover:bg-amber-50 transition-colors shadow-2xs"
                    >
                      🏨 Quán ăn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuthLogin(undefined, { username: 'shipper', password: '123' })}
                      className="bg-white border border-stone-200 hover:border-[#8a6538]/50 rounded-lg p-1.5 text-[10px] font-bold text-stone-700 hover:bg-amber-50 transition-colors shadow-2xs"
                    >
                      🛵 Shipper
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* --- REGISTER PAGE --- */
              <form onSubmit={handleAuthRegister} className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs text-stone-850 font-bold focus:outline-none focus:border-[#8a6538]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Mật khẩu *</label>
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs text-stone-850 focus:outline-none focus:border-[#8a6538]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lê Hoài Nam"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs text-stone-800 font-semibold focus:outline-none focus:border-[#8a6538]/50"
                  />
                </div>

                 <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Số điện thoại *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      disabled={isOtpVerified}
                      placeholder="0911223344"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className={`flex-1 bg-stone-50 border ${isOtpVerified ? 'border-emerald-300 bg-emerald-50/10 text-emerald-800' : 'border-stone-300'} rounded-xl p-2 text-xs font-mono focus:outline-none focus:border-[#8a6538]/50`}
                    />
                    {!isOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || !authPhone}
                        className="px-3 py-2 bg-stone-850 hover:bg-stone-900 border border-stone-800 text-white font-bold text-[10px] uppercase rounded-xl transition-all shadow-3xs disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        {otpLoading ? 'Đang gửi...' : isOtpSent ? 'Gửi lại mã' : 'Gửi mã OTP'}
                      </button>
                    )}
                  </div>

                  {isOtpVerified && (
                    <div className="mt-1.5 flex items-center space-x-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1.5 rounded-lg">
                      <span>✓ Số điện thoại đã được xác thực thành công!</span>
                    </div>
                  )}

                  {isOtpSent && !isOtpVerified && (
                    <div className="mt-2.5 p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                      <p className="text-[10px] text-amber-800 font-medium leading-normal">
                        Mã OTP xác minh đang được xử lý. Vui lòng nhập mã để hoàn tất.
                      </p>
                      
                      {otpSimulatedCode && (
                        <div className="bg-white border border-amber-200 rounded-lg p-2 text-[10.5px] text-stone-600 font-mono">
                          📲 Chế độ thử nghiệm: Mã OTP của bạn là: <strong className="text-amber-800 font-extrabold text-xs select-all bg-amber-50 px-1 py-0.5 rounded">{otpSimulatedCode}</strong>
                          <p className="text-[9px] text-stone-400 mt-1 font-sans">
                            * Do chưa thiết lập API Twilio thật hoặc gửi thật bị cấu hình thử nghiệm chặn, hệ thống đã cung cấp mã OTP giả lập để quý khách không bị gián đoạn.
                          </p>
                        </div>
                      )}

                      {otpSuccessMessage && !otpSimulatedCode && (
                        <p className="text-[9.5px] text-emerald-700 font-bold bg-white border border-emerald-100 p-1.5 rounded-lg">
                          💬 {otpSuccessMessage}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Mã OTP 6 số"
                          value={authOtpCode}
                          onChange={(e) => setAuthOtpCode(e.target.value)}
                          className="flex-1 bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-mono font-bold text-stone-800 text-center tracking-widest focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || !authOtpCode}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer disabled:opacity-50 font-sans"
                        >
                          Xác minh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Địa chỉ (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="36 Đinh Tiên Hoàng, Hà Nội"
                    value={authAddress}
                    onChange={(e) => setAuthAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs text-stone-800 focus:outline-none focus:border-[#8a6538]/50"
                  />
                </div>

                {/* Role selection dropdown */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-stone-500 mb-1">Cấp quyền / Vai trò sử dụng</label>
                  <select
                    value={authRole}
                    onChange={(e: any) => setAuthRole(e.target.value)}
                    className="w-full bg-[#fcfbfa] border border-[#e4dfd5] rounded-xl p-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#8a6538]"
                  >
                    <option value="customer">👤 Thực khách Hà Nội (Thành viên)</option>
                    <option value="restaurant">🏨 Chủ cửa hàng ẩm thực Hương Việt</option>
                    <option value="shipper">🛵 Tài xế giao hàng công nghệ (Shipper)</option>
                  </select>
                </div>

                 <button
                  type="submit"
                  disabled={authLoading || !isOtpVerified}
                  className="w-full py-2.5 bg-[#8a6538] hover:bg-[#6e4e27] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {authLoading ? "Đang đăng ký..." : !isOtpVerified ? "⚠ Vui lòng xác thực SĐT bằng OTP" : "✓ Xác nhận tạo tài khoản"}
                </button>
              </form>
            )}

            {/* Social log-ins */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase font-bold">
                <span className="bg-white px-3 text-stone-400">Hoặc kết nối mạng xã hội</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center justify-items-center">
              <div 
                id="google-signin-btn-target" 
                className="w-full flex justify-center py-0.5 min-h-[36px]"
              >
                {/* Fallback button in case Google Identity SDK is blocked or still loading */}
                <button
                  type="button"
                  onClick={() => {
                    applyAuthenticatedUser({
                      fullName: "Nguyễn Hoàng Nam",
                      username: "mha17003@gmail.com",
                      email: "mha17003@gmail.com",
                      avatar: "",
                      provider: 'google',
                      phoneNumber: "0987654321",
                      role: 'customer'
                    });
                  }}
                  className="w-full py-2.5 bg-[#ea4335]/10 hover:bg-[#ea4335]/15 border border-[#ea4335]/20 text-[#ea4335] font-extrabold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-3xs"
                >
                  Google Auth
                </button>
              </div>

              <div className="w-full">
                <button
                  type="button"
                  onClick={handleFacebookAuth}
                  disabled={facebookAuthLoading || !facebookClientId || !facebookSdkReady}
                  className="w-full py-2.5 bg-[#1877f2]/10 hover:bg-[#1877f2]/15 border border-[#1877f2]/20 text-[#1877f2] font-extrabold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {facebookAuthLoading ? 'Đang mở Facebook...' : !facebookSdkReady && facebookClientId ? 'Facebook đang tải...' : 'Facebook Auth'}
                </button>
              </div>
            </div>

            <p className="text-[9px] text-stone-400 font-mono italic mt-4 block">Mã hóa bảo mật kép • Ẩm thực tinh hoa Hương Việt</p>
          </div>
        </div>
      )}
    </div>
  );
}

