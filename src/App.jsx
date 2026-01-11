import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp, 
  setDoc, 
  getDoc,
  orderBy
} from 'firebase/firestore';
import { 
  ShoppingCart, ShieldCheck, User, LogOut, 
  Plus, Trash2, CheckCircle, XCircle, Search, 
  LayoutDashboard, Wallet, Gamepad2, Zap, Star, 
  Lock, Terminal, Image as ImageIcon, CreditCard,
  AlertTriangle, ArrowRight, Tag, Database, Menu, 
  History, Clock, X, QrCode, Copy, ChevronDown, ChevronUp, 
  Eye, EyeOff, Package, Globe, Settings
} from 'lucide-react';

// ==========================================
// 1. CẤU HÌNH FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAXwx2TFoBItZ9tH6zIbECHSK4z_pOaVkI",
  authDomain: "shop-9d1ae.firebaseapp.com",
  projectId: "shop-9d1ae",
  storageBucket: "shop-9d1ae.firebasestorage.app",
  messagingSenderId: "307813723666",
  appId: "1:307813723666:web:1231c496c082871c1b72cb"
};

// --- KHỞI TẠO AN TOÀN ---
let app, auth, db, googleProvider;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Lỗi khởi tạo Firebase:", error);
}

const appId = 'shop-9d1ae'; 
const SUPER_ADMIN_EMAIL = "admin@shop.com"; 

// Cấu hình ngân hàng mặc định (Tránh lỗi nếu chưa cài đặt)
const DEFAULT_BANK = {
  BANK_ID: "MB",
  ACCOUNT_NO: "0000000000",
  ACCOUNT_NAME: "ADMIN",
  QR_URL: ""
};

// ==========================================
// 2. KHO LOGO & TIỆN ÍCH
// ==========================================
const getGoogleLogo = (domain) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;

const DOMAIN_MAP = {
  'netflix': 'netflix.com', 'youtube': 'youtube.com', 'spotify': 'spotify.com',
  'facebook': 'facebook.com', 'tiktok': 'tiktok.com', 'adobe': 'adobe.com',
  'canva': 'canva.com', 'office': 'office.com', 'windows': 'microsoft.com',
  'chatgpt': 'openai.com', 'gemini': 'deepmind.google', 'blackbox': 'blackbox.ai',
  'steam': 'steampowered.com', 'roblox': 'roblox.com', 'valorant': 'playvalorant.com',
  'ugphone': 'ugphone.com', '1.1.1.1': 'cloudflare.com'
};

const SmartLogo = ({ title, manualUrl, className }) => {
  const [src, setSrc] = useState('');
  
  useEffect(() => {
    if (manualUrl && manualUrl.length > 5) { setSrc(manualUrl); return; }
    const lower = (title || "").toLowerCase();
    let found = null;
    for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
      if (lower.includes(key)) { found = domain; break; }
    }
    // Fallback icon mặc định nếu không tìm thấy
    setSrc(found ? getGoogleLogo(found) : 'https://cdn-icons-png.flaticon.com/512/3649/3649281.png');
  }, [title, manualUrl]);

  return <img src={src} alt={title} className={className} onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/3649/3649281.png'} />;
};

const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bg = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
  return (
    <div className={`fixed top-6 right-6 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] flex items-center gap-3 animate-slide-in border border-white/10`}>
      <span className="font-bold">{message}</span>
      <button onClick={onClose}><X size={18}/></button>
    </div>
  );
};

// --- COMPONENTS CON ---
const AccountRow = ({ accLine }) => {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(null);
  const parts = accLine.includes('|') ? accLine.split('|') : [accLine, ''];
  const username = parts[0].trim();
  const password = parts.slice(1).join('|').trim();

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-[#18181b] p-3 rounded-lg border border-white/5 space-y-2 hover:border-violet-500/30 transition">
      <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><User size={10}/> Tài khoản</p>
          <p className="text-sm text-white font-mono truncate select-all">{username}</p>
        </div>
        <button onClick={() => handleCopy(username, 'user')} className={`p-2 rounded-md transition ${copied === 'user' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}>
          {copied === 'user' ? <CheckCircle size={16}/> : <Copy size={16}/>}
        </button>
      </div>
      {password && (
        <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><Lock size={10}/> Mật khẩu</p>
            <div className="flex items-center gap-2">
               <p className="text-sm text-yellow-400 font-mono truncate select-all">{showPass ? password : '••••••••••••'}</p>
               <button onClick={() => setShowPass(!showPass)} className="text-gray-500 hover:text-white transition">{showPass ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
            </div>
          </div>
          <button onClick={() => handleCopy(password, 'pass')} className={`p-2 rounded-md transition ${copied === 'pass' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}>
            {copied === 'pass' ? <CheckCircle size={16}/> : <Copy size={16}/>}
          </button>
        </div>
      )}
    </div>
  );
};

const HistoryItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const accounts = Array.isArray(item.data) ? item.data : [item.data];
  return (
    <div className="bg-black/50 border border-white/5 rounded-xl overflow-hidden transition hover:border-violet-500/50">
      <div className="p-4 flex justify-between items-center cursor-pointer bg-[#121214] hover:bg-[#1a1a1d]" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400"><Package size={20}/></div>
          <div>
             <h4 className="font-bold text-white text-sm">{item.title}</h4>
             <div className="flex gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
               <span>#{item.id.slice(0, 6).toUpperCase()}</span> • <span>{new Date(item.purchasedAt).toLocaleDateString()}</span>
             </div>
          </div>
        </div>
        <div className="text-right">
           <div className="text-emerald-400 font-bold text-sm">{formatVND(item.totalPrice || item.price)}</div>
           {isOpen ? <ChevronUp size={16} className="ml-auto text-gray-500"/> : <ChevronDown size={16} className="ml-auto text-gray-500"/>}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 bg-[#09090b] border-t border-white/10 space-y-3 animate-fade-in">
          {accounts.map((accLine, idx) => <AccountRow key={idx} accLine={accLine} />)}
        </div>
      )}
    </div>
  );
};

const HistoryModal = ({ user, onClose }) => {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'purchases'), orderBy('purchasedAt', 'desc')), (snapshot) => {
      const now = new Date();
      snapshot.docs.forEach(async (docSnap) => {
        const item = docSnap.data();
        if (Math.ceil(Math.abs(now - new Date(item.purchasedAt)) / (86400000)) > 30) await deleteDoc(docSnap.ref);
      });
      setHistory(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/10 flex justify-between bg-[#09090b] items-center">
          <h3 className="font-bold flex gap-2 text-violet-400 items-center"><History size={20}/> LỊCH SỬ GIAO DỊCH</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X/></button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3 bg-[#0c0c0e]">
          {history.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có đơn hàng nào.</p>}
          {history.map(item => <HistoryItem key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
};

const BuyModal = ({ product, user, balance, onClose, onConfirm }) => {
  const [qty, setQty] = useState(1);
  const maxStock = product.stock ? product.stock.length : 0;
  const changeQty = (val) => {
    let newQty = qty + val;
    if (newQty < 1) newQty = 1;
    if (newQty > maxStock) newQty = maxStock;
    setQty(newQty);
  };
  const totalPrice = product.price * qty;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-[#18181b] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
          <div className="flex gap-4 mb-6">
             <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 p-2">
                <SmartLogo title={product.title} manualUrl={product.image} className="w-full h-full object-contain" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white line-clamp-2">{product.title}</h3>
                <p className="text-emerald-400 font-mono text-sm">{formatVND(product.price)} / 1 acc</p>
             </div>
          </div>
          <div className="bg-black/40 p-4 rounded-xl mb-6 border border-white/5">
             <div className="flex justify-between mb-2 text-sm text-gray-400"><span>Số lượng (Còn {maxStock}):</span></div>
             <div className="flex items-center justify-between bg-[#09090b] rounded-lg border border-gray-700 p-1">
                <button onClick={() => changeQty(-1)} className="w-10 h-10 hover:bg-white/10 rounded-md text-white font-bold disabled:opacity-30 flex items-center justify-center" disabled={qty <= 1}>-</button>
                <span className="font-bold text-xl w-12 text-center text-white">{qty}</span>
                <button onClick={() => changeQty(1)} className="w-10 h-10 hover:bg-white/10 rounded-md text-white font-bold disabled:opacity-30 flex items-center justify-center" disabled={qty >= maxStock}>+</button>
             </div>
          </div>
          <div className="flex justify-between items-center mb-6 py-3 border-t border-b border-white/10">
             <span className="text-gray-400 text-sm">Tổng thanh toán:</span>
             <span className="text-emerald-400 font-bold text-2xl">{formatVND(totalPrice)}</span>
          </div>
          <button onClick={() => onConfirm(product, qty, totalPrice)} className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 shadow-lg shadow-violet-900/30 transition transform active:scale-95">XÁC NHẬN MUA NGAY</button>
       </div>
    </div>
  );
};

// --- GIAO DIỆN KHÁCH HÀNG ---
const ShopView = ({ user, userData, onLogin, onLogout, setView, showToast }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const menuRef = useRef(null);
  
  // Bank Config
  const [bankConfig, setBankConfig] = useState(DEFAULT_BANK);

  // Deposit State
  const [depositStep, setDepositStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [transCode, setTransCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    // 1. Get Products
    const unsubProd = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'products')), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // 2. Get Bank Config (FIXED PATH: Sử dụng path 6 phần để trỏ vào Document thay vì 5 phần Collection)
    // Đường dẫn đúng: artifacts(col) -> appId(doc) -> public(col) -> data(doc) -> settings(col) -> bank(doc)
    const bankDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'bank');
    const unsubBank = onSnapshot(bankDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBankConfig(docSnap.data());
      }
    });

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
        unsubProd();
        unsubBank();
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (depositStep === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setDepositStep(1);
      showToast("Mã giao dịch đã hết hạn!", "error");
    }
    return () => clearInterval(timer);
  }, [depositStep, timeLeft]);

  const handleConfirmBuy = async (prod, qty, total) => {
    setSelectedProduct(null); 
    if (!user) return showToast("Vui lòng đăng nhập!", "error");
    if ((userData?.balance || 0) < total) return showToast("Số dư không đủ!", "error");

    try {
      const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', prod.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) return showToast("Hết hàng!", "error");
      
      const currentStock = prodSnap.data().stock || [];
      if (currentStock.length < qty) return showToast("Không đủ số lượng trong kho!", "error");

      const itemsToBuy = currentStock.slice(0, qty);
      const remainingStock = currentStock.slice(qty);

      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { balance: userData.balance - total });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'purchases'), { 
        title: prod.title, price: prod.price, totalPrice: total, data: itemsToBuy, purchasedAt: new Date().toISOString() 
      });
      await updateDoc(prodRef, { stock: remainingStock });
      
      alert(`🎉 MUA THÀNH CÔNG!\n(Đã lưu vào Lịch sử mua hàng)`);
      setShowHistory(true);
    } catch (e) { showToast(e.message, "error"); }
  };

  const startDeposit = () => {
    if (!depositAmount || depositAmount < 10000) return showToast("Tối thiểu 10,000đ", "error");
    const safeName = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000000000); 
    const code = `NAP${safeName}${randomNum}`;
    setTransCode(code);
    setTimeLeft(600);
    setDepositStep(2);
  };

  const confirmDeposit = async () => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), {
      userId: user.uid, userEmail: user.email, amount: Number(depositAmount), 
      note: transCode, status: 'pending', createdAt: new Date().toISOString()
    });
    showToast("Đã gửi yêu cầu! Admin sẽ duyệt ngay.", "success");
    setDepositStep(1);
    setDepositAmount('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans pb-20 relative">
      {showHistory && <HistoryModal user={user} onClose={() => setShowHistory(false)} />}
      
      {selectedProduct && (
        <BuyModal 
          product={selectedProduct} user={user} balance={userData?.balance || 0}
          onClose={() => setSelectedProduct(null)} onConfirm={handleConfirmBuy}
        />
      )}

      <nav className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur border-b border-white/10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="font-bold text-xl text-violet-500 flex gap-2 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
            <Gamepad2/> CYBERSHOP
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div onClick={() => setActiveTab('deposit')} className="cursor-pointer hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-emerald-500 transition group">
                  <span className="text-emerald-400 font-bold text-sm group-hover:scale-105 transition">{formatVND(userData?.balance || 0)}</span>
                  <Plus size={14} className="text-gray-500"/>
                </div>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded transition"><Menu size={24}/></button>
                  {showMenu && (
                    <div className="absolute right-0 top-12 w-64 bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                      <div className="p-4 bg-[#09090b] border-b border-white/5">
                        <p className="text-sm font-bold truncate text-white">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><p className="text-xs text-emerald-400 font-mono">{formatVND(userData?.balance || 0)}</p></div>
                      </div>
                      <div className="p-2 space-y-1">
                        <button onClick={() => { setActiveTab('deposit'); setShowMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition"><Wallet size={16} className="text-emerald-500"/> Nạp tiền</button>
                        <button onClick={() => { setShowHistory(true); setShowMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg flex items-center gap-3 transition"><History size={16} className="text-blue-500"/> Lịch sử mua hàng</button>
                        <div className="h-px bg-white/5 my-1"></div>
                        <button onClick={onLogout} className="w-full text-left px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-3 transition"><LogOut size={16}/> Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : <button onClick={onLogin} className="bg-white text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:scale-105 transition">Đăng Nhập</button>}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 space-y-8">
        {activeTab === 'home' ? (
          <>
            <div className="bg-gradient-to-r from-violet-900 via-[#0a0a0a] to-black p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
               <h2 className="text-3xl md:text-5xl font-black mb-2 relative z-10 text-white">KHO TÀI KHOẢN <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">TỰ ĐỘNG 24/7</span></h2>
               <p className="text-gray-400 mb-4 relative z-10 max-w-lg">Uy tín số 1 Việt Nam. Bảo hành trọn đời.</p>
               <div className="absolute right-0 top-0 opacity-20 group-hover:scale-110 transition duration-1000"><Zap size={200}/></div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6"><div className="w-1 h-6 bg-emerald-500 rounded-full"></div><h2 className="text-xl font-bold text-white">SẢN PHẨM MỚI NHẤT</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.length === 0 && <div className="col-span-full text-center py-12 border border-dashed border-gray-800 rounded-xl"><Search size={32} className="mx-auto mb-2 opacity-30"/><p className="text-gray-500">Kho hàng đang được cập nhật...</p></div>}
                {products.map(p => {
                  const stockCount = p.stock ? p.stock.length : 0;
                  return (
                    <div key={p.id} className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-violet-500 transition group hover:-translate-y-1 shadow-lg flex flex-col">
                      <div className="h-40 relative bg-white/5 flex items-center justify-center p-4">
                        <SmartLogo title={p.title} manualUrl={p.image} className="w-full h-full object-contain drop-shadow-2xl" />
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">KHO: <span className={stockCount > 0 ? "text-emerald-400" : "text-rose-500"}>{stockCount}</span></span>
                        {p.tag && <span className="absolute top-2 left-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">{p.tag}</span>}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold truncate text-white mb-1" title={p.title}>{p.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{p.desc || 'Tài khoản chất lượng cao'}</p>
                        <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/5">
                          <span className="text-emerald-400 font-bold font-mono">{formatVND(p.price)}</span>
                          <button onClick={() => stockCount > 0 ? setSelectedProduct(p) : showToast('Hết hàng!', 'error')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${stockCount > 0 ? 'bg-white text-black hover:bg-violet-500 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>{stockCount > 0 ? 'MUA' : 'HẾT HÀNG'}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in">
             <button onClick={() => { setActiveTab('home'); setDepositStep(1); }} className="mb-4 text-xs text-gray-500 hover:text-white flex items-center gap-1">← Hủy bỏ</button>
             {depositStep === 1 ? (
               <>
                 <h2 className="text-xl font-bold mb-6 text-center text-emerald-400">NHẬP SỐ TIỀN CẦN NẠP</h2>
                 <input type="number" className="bg-black border border-gray-700 p-4 text-white rounded-xl w-full text-2xl font-bold text-center outline-none focus:border-emerald-500 mb-4 transition" placeholder="0" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)}/>
                 <button onClick={startDeposit} className="bg-emerald-600 w-full py-4 rounded-xl font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition">TIẾP TỤC →</button>
               </>
             ) : (
               <div className="text-center animate-fade-in">
                 <h2 className="text-xl font-bold mb-2 text-white">QUÉT MÃ QR ĐỂ THANH TOÁN</h2>
                 <p className="text-xs text-rose-400 mb-4 flex justify-center gap-1 items-center bg-rose-500/10 py-1 rounded border border-rose-500/20"><Clock size={12}/> Hết hạn sau: {formatTime(timeLeft)}</p>
                 <div className="bg-white p-4 rounded-xl mb-4 inline-block shadow-xl">
                    {/* QR Code Mới: Ưu tiên link ảnh riêng (nếu có), không thì dùng VietQR */}
                    {bankConfig.QR_URL ? (
                       <img src={bankConfig.QR_URL} alt="QR Custom" className="w-48 h-48 object-contain"/>
                    ) : (
                       <img src={`https://img.vietqr.io/image/${bankConfig.BANK_ID}-${bankConfig.ACCOUNT_NO}-compact.png?amount=${depositAmount}&addInfo=${transCode}&accountName=${encodeURIComponent(bankConfig.ACCOUNT_NAME)}`} alt="QR Auto" className="w-48 h-48 object-contain"/>
                    )}
                 </div>
                 <div className="bg-[#09090b] border border-white/10 p-4 rounded-xl mb-4 text-left space-y-3">
                    {bankConfig.BANK_ID && <div className="flex justify-between"><span className="text-gray-500 text-xs">Ngân hàng:</span><span className="text-white font-bold">{bankConfig.BANK_ID}</span></div>}
                    {bankConfig.ACCOUNT_NO && <div className="flex justify-between"><span className="text-gray-500 text-xs">Số TK:</span><span className="text-white font-bold">{bankConfig.ACCOUNT_NO}</span></div>}
                    {bankConfig.ACCOUNT_NAME && <div className="flex justify-between"><span className="text-gray-500 text-xs">Chủ TK:</span><span className="text-white font-bold">{bankConfig.ACCOUNT_NAME}</span></div>}
                    <div className="h-px bg-white/10 my-1"></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Số tiền:</span><span className="text-emerald-400 font-bold">{formatVND(depositAmount)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500 text-xs">Nội dung (Bắt buộc):</span><div className="flex gap-2 items-center"><span className="text-yellow-400 font-bold font-mono text-sm break-all">{transCode}</span><button onClick={() => { navigator.clipboard.writeText(transCode); showToast("Đã copy mã!", "success"); }} className="p-1 hover:text-white text-gray-500"><Copy size={14}/></button></div></div>
                 </div>
                 <button onClick={confirmDeposit} className="bg-emerald-600 w-full py-3 rounded-xl font-bold text-white hover:bg-emerald-500 mb-2 transition">ĐÃ CHUYỂN KHOẢN XONG</button>
                 <p className="text-[10px] text-gray-500">Hệ thống sẽ tự động cộng tiền ngay khi Admin duyệt.</p>
               </div>
             )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-8 py-8 text-center bg-[#09090b]"></footer>
    </div>
  );
};

const AdminPanel = ({ user, onLogout, setView, showToast }) => {
  const [products, setProducts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [newProd, setNewProd] = useState({ title: '', price: '', tag: 'VIP', desc: '', dataTextarea: '', image: '' });
  
  // STATE BANK CONFIG (Mới)
  const [bankSettings, setBankSettings] = useState(DEFAULT_BANK);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), s => setDeposits(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    // Load config (Sửa lại path đúng để không bị crash)
    // Đường dẫn: artifacts(col)/appId(doc)/public(col)/data(doc)/settings(col)/bank(doc)
    const bankDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'bank');
    getDoc(bankDocRef).then(snap => {
      if(snap.exists()) setBankSettings(snap.data());
    });

    return () => { u1(); u2(); };
  }, []);

  const handleUpdateBank = async (e) => {
    e.preventDefault();
    try {
      // Lưu vào đường dẫn chuẩn
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'bank'), bankSettings);
      showToast("Cập nhật ngân hàng thành công!", "success");
    } catch (e) { showToast("Lỗi lưu cấu hình", "error"); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const stockList = newProd.dataTextarea.split('\n').filter(line => line.trim() !== '');
    if (stockList.length === 0) return showToast("Vui lòng nhập ít nhất 1 tài khoản!", "error");

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { 
        ...newProd, stock: stockList, price: Number(newProd.price) 
      });
      showToast(`Đã thêm ${stockList.length} tài khoản vào kho!`, "success");
      setNewProd({ title: '', price: '', tag: 'VIP', desc: '', dataTextarea: '', image: '' });
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleApprove = async (d) => {
    try {
      const uRef = doc(db, 'artifacts', appId, 'users', d.userId);
      const snap = await getDoc(uRef);
      await updateDoc(uRef, { balance: (snap.data()?.balance || 0) + d.amount });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), { status: 'approved' });
      showToast("Đã duyệt!", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono text-sm p-4 pb-20">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-black z-50">
        <div className="text-rose-500 font-bold flex gap-2"><Terminal/> ADMIN DASHBOARD</div>
        <button onClick={() => { onLogout(); setView('shop'); }} className="text-gray-400 hover:text-white">EXIT</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT 1: CẤU HÌNH NGÂN HÀNG + ĐĂNG BÁN */}
        <div className="space-y-6">
           
           {/* BANK CONFIG FORM */}
           <div className="bg-[#111] border border-blue-900/50 p-5 rounded-lg shadow-lg">
              <h3 className="text-blue-400 font-bold mb-4 text-sm flex gap-2 items-center"><Settings size={16}/> CẤU HÌNH NGÂN HÀNG</h3>
              <form onSubmit={handleUpdateBank} className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Mã NH (MB, VCB...)</label>
                  <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-blue-500" 
                    value={bankSettings.BANK_ID} onChange={e => setBankSettings({...bankSettings, BANK_ID: e.target.value})} placeholder="Không bắt buộc"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                     <label className="text-[10px] text-gray-500 uppercase">Số TK</label>
                     <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-blue-500" 
                       value={bankSettings.ACCOUNT_NO} onChange={e => setBankSettings({...bankSettings, ACCOUNT_NO: e.target.value})} placeholder="Không bắt buộc"/>
                   </div>
                   <div>
                     <label className="text-[10px] text-gray-500 uppercase">Tên Chủ TK</label>
                     <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-blue-500" 
                       value={bankSettings.ACCOUNT_NAME} onChange={e => setBankSettings({...bankSettings, ACCOUNT_NAME: e.target.value})} placeholder="Không bắt buộc"/>
                   </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Link Ảnh QR (Tùy chọn)</label>
                  <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-blue-500 placeholder-gray-700" 
                    placeholder="https://... (Nếu điền sẽ dùng ảnh này)"
                    value={bankSettings.QR_URL} onChange={e => setBankSettings({...bankSettings, QR_URL: e.target.value})} />
                </div>
                <button className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 font-bold rounded text-xs">LƯU CẤU HÌNH BANK</button>
              </form>
           </div>

           {/* ADD PRODUCT FORM */}
           <div className="bg-[#111] border-2 border-emerald-500/50 p-5 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <h3 className="text-emerald-400 font-bold mb-4 text-sm flex gap-2"><Database size={16}/> ĐĂNG BÁN (Live)</h3>
              <form onSubmit={handleAdd} className="space-y-3">
                <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Tên sản phẩm" value={newProd.title} onChange={e=>setNewProd({...newProd, title:e.target.value})} required/>
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Giá (1 acc)" value={newProd.price} onChange={e=>setNewProd({...newProd, price:e.target.value})} required/>
                    <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Tag" value={newProd.tag} onChange={e=>setNewProd({...newProd, tag:e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">DANH SÁCH ACC (Mỗi dòng 1 nick)</label>
                  <textarea className="w-full bg-black border border-rose-900 p-2 text-emerald-400 h-24 outline-none focus:border-rose-500 font-mono text-xs whitespace-pre" placeholder={`user1|pass1\nuser2|pass2`} value={newProd.dataTextarea} onChange={e=>setNewProd({...newProd, dataTextarea:e.target.value})} required/>
                  <p className="text-[10px] text-gray-500 mt-1">Hệ thống sẽ tự đếm số dòng.</p>
                </div>
                <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 font-bold mt-2 rounded">ĐĂNG BÁN NGAY</button>
              </form>
           </div>
        </div>

        {/* CỘT 2: DANH SÁCH & DUYỆT TIỀN */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#111] border border-gray-800 p-6 rounded-lg">
              <h3 className="text-yellow-500 font-bold mb-4 flex gap-2"><Wallet/> DUYỆT TIỀN</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {deposits.filter(d => d.status === 'pending').map(d => (
                  <div key={d.id} className="bg-black p-3 border-l-4 border-yellow-500 flex justify-between items-center animate-fade-in">
                     <div>
                       <div className="font-bold">{d.userEmail}</div>
                       <div className="text-xs text-yellow-400 font-mono">CODE: {d.note}</div>
                       <div className="text-xs text-gray-500">{d.amount.toLocaleString()} đ</div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={()=>handleApprove(d)} className="text-emerald-500 font-bold border border-emerald-500 px-2 py-1 text-xs hover:bg-emerald-500 hover:text-black transition">DUYỆT</button>
                        <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), {status:'rejected'})} className="text-rose-500 font-bold border border-rose-500 px-2 py-1 text-xs">HỦY</button>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-[#111] border border-gray-800 p-6 rounded-lg">
              <h3 className="text-blue-500 font-bold mb-4 flex gap-2"><Lock/> KHO HÀNG ({products.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                 {products.map(p => (
                    <div key={p.id} className="flex gap-2 bg-black p-2 border border-gray-800 items-center">
                       <div className="flex-1 truncate text-xs">{p.title}</div>
                       <div className="text-emerald-500 font-bold text-xs">{p.price.toLocaleString()}</div>
                       <div className="text-gray-500 text-[10px] px-2 border border-gray-800 rounded">Kho: {p.stock ? p.stock.length : 0}</div>
                       <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id))} className="text-rose-500 hover:text-white px-2"><Trash2 size={14}/></button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('panel') === 'admin' ? 'admin-login' : 'shop';
  });
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast({msg:'',type:''}), 3000); };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const unsubUser = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            if (view === 'admin-login') setView('admin-panel');
          } else {
            setDoc(doc(db, 'artifacts', appId, 'users', u.uid), { email: u.email, balance: 0, role: 'user', createdAt: serverTimestamp() });
          }
        });
        return () => unsubUser();
      }
    });
    return () => unsub();
  }, [view]);

  const handleAdminAuth = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setView('admin-panel');
    } catch (e) { showToast("Sai tài khoản hoặc mật khẩu", "error"); }
  };

  return (
    <>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      {view === 'admin-panel' ? (
        <AdminPanel user={user} onLogout={()=>signOut(auth)} setView={setView} showToast={showToast} />
      ) : view === 'admin-login' ? (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono">
           <div className="w-full max-w-sm p-8 border border-rose-900/30 bg-[#0a0a0a] shadow-lg">
              <h2 className="text-rose-600 font-bold mb-6 flex items-center gap-2"><Lock size={16}/> SECURE LOGIN</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleAdminAuth(e.target.email.value, e.target.password.value); }} className="space-y-4">
                 <input name="email" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600" placeholder="Email Admin" />
                 <input type="password" name="password" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600" placeholder="Mật khẩu" />
                 <button className="w-full bg-rose-700 text-white py-2 font-bold text-xs mt-4">LOGIN</button>
              </form>
           </div>
        </div>
      ) : (
        <ShopView user={user} userData={userData} onLogin={() => signInWithPopup(auth, googleProvider)} onLogout={()=>signOut(auth)} setView={setView} showToast={showToast} />
      )}
    </>
  );
}
