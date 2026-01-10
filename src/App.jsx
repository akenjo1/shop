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
  History, Clock, X, QrCode, Copy, ChevronDown, ChevronUp, Package
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

let app, auth, db, googleProvider;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Lỗi:", error);
}

const appId = 'shop-9d1ae'; 
const SUPER_ADMIN_EMAIL = "admin@shop.com"; 

// --- TIỆN ÍCH ---
const AUTO_IMAGES = {
  netflix: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&q=80',
  youtube: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80',
  steam: 'https://images.unsplash.com/photo-1612287230217-969e090e8f77?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'
};
const getSmartImage = (title) => {
  const lower = (title || "").toLowerCase();
  for (const [key, url] of Object.entries(AUTO_IMAGES)) if (lower.includes(key)) return url;
  return AUTO_IMAGES.default;
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

// --- COMPONENT CHI TIẾT ĐƠN HÀNG (Item Lịch sử) ---
const HistoryItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Xử lý dữ liệu cũ (string) và mới (array)
  const accounts = Array.isArray(item.data) ? item.data : [item.data];

  return (
    <div className="bg-black/50 border border-white/5 rounded-xl overflow-hidden transition hover:border-violet-500/30">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-[#121214] hover:bg-[#1a1a1d]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <div className="flex items-center gap-2">
             <h4 className="font-bold text-white text-sm">{item.title}</h4>
             <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
               x{accounts.length}
             </span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">Mã đơn: #{item.id.slice(0, 8).toUpperCase()}</div>
          <div className="text-[10px] text-gray-500">{new Date(item.purchasedAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
           <div className="text-emerald-400 font-bold text-sm">{formatVND(item.totalPrice || item.price)}</div>
           {isOpen ? <ChevronUp size={16} className="ml-auto text-gray-500"/> : <ChevronDown size={16} className="ml-auto text-gray-500"/>}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-[#09090b] border-t border-white/10 space-y-3">
          {accounts.map((accLine, idx) => {
            // Tách User|Pass (Nếu có dấu |)
            const parts = accLine.includes('|') ? accLine.split('|') : [accLine, ''];
            const user = parts[0].trim();
            const pass = parts.slice(1).join('|').trim(); // Ghép lại phần sau nếu pass có dấu |

            return (
              <div key={idx} className="bg-[#18181b] p-3 rounded border border-white/5 flex justify-between items-center group">
                <div className="flex-1 min-w-0 pr-4">
                   <div className="mb-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Tài khoản</p>
                      <p className="text-sm text-white font-mono truncate select-all">{user}</p>
                   </div>
                   {pass && (
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Mật khẩu</p>
                        <p className="text-sm text-yellow-400 font-mono truncate select-all">{pass}</p>
                     </div>
                   )}
                </div>
                <button 
                  onClick={() => handleCopy(accLine, idx)}
                  className={`p-2 rounded transition ${copiedIndex === idx ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white'}`}
                >
                  {copiedIndex === idx ? <CheckCircle size={18}/> : <Copy size={18}/>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT LỊCH SỬ ---
const HistoryModal = ({ user, onClose }) => {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'purchases'), orderBy('purchasedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const now = new Date();
      snapshot.docs.forEach(async (docSnap) => {
        const item = docSnap.data();
        const diffDays = Math.ceil(Math.abs(now - new Date(item.purchasedAt)) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) await deleteDoc(docSnap.ref);
      });
      setHistory(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/10 flex justify-between bg-[#09090b]">
          <h3 className="font-bold flex gap-2 text-violet-400"><History/> LỊCH SỬ (Xóa sau 30 ngày)</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
          {history.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có đơn hàng nào.</p>}
          {history.map(item => <HistoryItem key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
};

// --- MODAL MUA HÀNG (SỐ LƯỢNG) ---
const BuyModal = ({ product, user, balance, onClose, onConfirm }) => {
  const [qty, setQty] = useState(1);
  const maxStock = product.stock ? product.stock.length : 0;
  
  // Xử lý nút tăng giảm
  const changeQty = (val) => {
    let newQty = qty + val;
    if (newQty < 1) newQty = 1;
    if (newQty > maxStock) newQty = maxStock;
    setQty(newQty);
  };

  const totalPrice = product.price * qty;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-[#18181b] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-1">{product.title}</h3>
          <p className="text-xs text-gray-500 mb-4">Đơn giá: {formatVND(product.price)}</p>
          
          <div className="mb-6">
             <label className="text-sm text-gray-400 mb-2 block">Số lượng mua (Còn {maxStock}):</label>
             <div className="flex items-center justify-between bg-black rounded-lg border border-gray-700 p-2">
                <button onClick={() => changeQty(-1)} className="p-2 hover:bg-white/10 rounded text-white disabled:opacity-30" disabled={qty <= 1}>-</button>
                <span className="font-bold text-xl w-10 text-center">{qty}</span>
                <button onClick={() => changeQty(1)} className="p-2 hover:bg-white/10 rounded text-white disabled:opacity-30" disabled={qty >= maxStock}>+</button>
             </div>
          </div>

          <div className="flex justify-between items-center mb-6 py-3 border-t border-b border-white/10">
             <span className="text-gray-400">Tổng thanh toán:</span>
             <span className="text-emerald-400 font-bold text-xl">{formatVND(totalPrice)}</span>
          </div>

          <div className="flex gap-3">
             <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700">Hủy</button>
             <button onClick={() => onConfirm(product, qty, totalPrice)} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 shadow-lg shadow-violet-900/30">Xác Nhận Mua</button>
          </div>
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
  const [selectedProduct, setSelectedProduct] = useState(null); // Sản phẩm đang chọn mua
  
  // STATE NẠP TIỀN
  const [depositStep, setDepositStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [transCode, setTransCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'products')), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
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

  // Xử lý mua hàng (Số lượng)
  const handleConfirmBuy = async (prod, qty, total) => {
    setSelectedProduct(null); // Đóng modal
    if (!user) return showToast("Vui lòng đăng nhập!", "error");
    if ((userData?.balance || 0) < total) return showToast("Số dư không đủ!", "error");

    try {
      const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', prod.id);
      
      // Transaction để đảm bảo không bị mua trùng
      // Ở đây dùng logic đơn giản cho demo: Lấy mảng stock, cắt ra qty phần tử
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) return showToast("Hết hàng!", "error");
      
      const currentStock = prodSnap.data().stock || []; // Mảng chứa các dòng tk|mk
      if (currentStock.length < qty) return showToast("Không đủ số lượng trong kho!", "error");

      // Lấy ra n phần tử đầu tiên
      const itemsToBuy = currentStock.slice(0, qty);
      const remainingStock = currentStock.slice(qty);

      // 1. Trừ tiền
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { balance: userData.balance - total });
      
      // 2. Lưu lịch sử (Lưu mảng itemsToBuy)
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'purchases'), { 
        title: prod.title,
        price: prod.price,
        totalPrice: total,
        data: itemsToBuy, // Lưu cả mảng
        purchasedAt: new Date().toISOString() 
      });

      // 3. Cập nhật kho hàng (Chỉ còn lại số dư)
      await updateDoc(prodRef, { stock: remainingStock });
      
      alert(`🎉 MUA THÀNH CÔNG ${qty} TÀI KHOẢN!\n(Đã lưu vào Lịch sử mua hàng)`);
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
      
      {/* Modal Mua Hàng */}
      {selectedProduct && (
        <BuyModal 
          product={selectedProduct} 
          user={user} 
          balance={userData?.balance || 0}
          onClose={() => setSelectedProduct(null)}
          onConfirm={handleConfirmBuy}
        />
      )}

      <nav className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur border-b border-white/10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="font-bold text-xl text-violet-500 flex gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Gamepad2/> CYBERSHOP
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div onClick={() => setActiveTab('deposit')} className="cursor-pointer hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-emerald-500 transition">
                  <span className="text-emerald-400 font-bold text-sm">{formatVND(userData?.balance || 0)}</span>
                  <Plus size={14} className="text-gray-500"/>
                </div>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded"><Menu size={24}/></button>
                  {showMenu && (
                    <div className="absolute right-0 top-12 w-56 bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 bg-[#09090b] border-b border-white/5">
                        <p className="text-sm font-bold truncate">{user.email}</p>
                        <p className="text-xs text-emerald-400 font-mono">{formatVND(userData?.balance || 0)}</p>
                      </div>
                      <button onClick={() => { setActiveTab('deposit'); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex gap-2"><Wallet size={16}/> Nạp tiền</button>
                      <button onClick={() => { setShowHistory(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex gap-2"><History size={16}/> Lịch sử mua</button>
                      <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-rose-500 hover:bg-white/5 flex gap-2"><LogOut size={16}/> Đăng xuất</button>
                    </div>
                  )}
                </div>
              </>
            ) : <button onClick={onLogin} className="bg-white text-black px-4 py-1.5 rounded-lg font-bold text-sm">Đăng Nhập</button>}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 space-y-8">
        {activeTab === 'home' ? (
          <>
            <div className="bg-gradient-to-r from-violet-900 to-black p-8 rounded-2xl border border-white/10 relative overflow-hidden">
               <h2 className="text-3xl font-black mb-2 relative z-10">KHO TÀI KHOẢN TỰ ĐỘNG</h2>
               <p className="text-gray-400 mb-4 relative z-10">Hệ thống xử lý đơn hàng trong 1 giây.</p>
               <div className="absolute right-0 top-0 opacity-20"><Zap size={150}/></div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2"><Tag/> SẢN PHẨM MỚI NHẤT</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map(p => {
                  const stockCount = p.stock ? p.stock.length : 0;
                  return (
                    <div key={p.id} className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden hover:border-violet-500 transition group">
                      <div className="h-40 relative">
                        <img src={getSmartImage(p.title)} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                        <span className="absolute bottom-2 right-2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                           KHO: {stockCount}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold truncate text-white">{p.title}</h3>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-emerald-400 font-bold">{formatVND(p.price)}</span>
                          <button 
                            onClick={() => stockCount > 0 ? setSelectedProduct(p) : showToast('Hết hàng!', 'error')} 
                            className={`px-3 py-1 rounded text-xs font-bold transition ${stockCount > 0 ? 'bg-white text-black hover:bg-violet-500 hover:text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                          >
                            {stockCount > 0 ? 'MUA' : 'HẾT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl">
             <button onClick={() => { setActiveTab('home'); setDepositStep(1); }} className="mb-4 text-xs text-gray-500 hover:text-white flex items-center gap-1">← Hủy bỏ</button>
             {depositStep === 1 ? (
               <>
                 <h2 className="text-xl font-bold mb-6 text-center text-emerald-400">NHẬP SỐ TIỀN CẦN NẠP</h2>
                 <input type="number" className="bg-black border border-gray-700 p-4 text-white rounded-xl w-full text-2xl font-bold text-center outline-none focus:border-emerald-500 mb-4" placeholder="0" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)}/>
                 <button onClick={startDeposit} className="bg-emerald-600 w-full py-4 rounded-xl font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">TIẾP TỤC →</button>
               </>
             ) : (
               <div className="text-center animate-fade-in">
                 <h2 className="text-xl font-bold mb-2 text-white">QUÉT MÃ QR ĐỂ THANH TOÁN</h2>
                 <p className="text-xs text-rose-400 mb-4 flex justify-center gap-1 items-center"><Clock size={12}/> Hết hạn sau: {formatTime(timeLeft)}</p>
                 <div className="bg-white p-4 rounded-xl mb-4 inline-block shadow-xl">
                    <img src={`https://img.vietqr.io/image/MB-999988886666-compact.png?amount=${depositAmount}&addInfo=${transCode}`} alt="QR" className="w-48 h-48 object-contain"/>
                 </div>
                 <div className="bg-[#09090b] border border-white/10 p-4 rounded-xl mb-4 text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">Số tiền:</span>
                      <span className="text-emerald-400 font-bold">{formatVND(depositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">Nội dung (Bắt buộc):</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-yellow-400 font-bold font-mono text-sm break-all">{transCode}</span>
                        <button onClick={() => { navigator.clipboard.writeText(transCode); showToast("Đã copy mã!", "success"); }} className="p-1 hover:text-white text-gray-500"><Copy size={14}/></button>
                      </div>
                    </div>
                 </div>
                 <button onClick={confirmDeposit} className="bg-emerald-600 w-full py-3 rounded-xl font-bold text-white hover:bg-emerald-500 mb-2">ĐÃ CHUYỂN KHOẢN XONG</button>
                 <p className="text-[10px] text-gray-500">Hệ thống sẽ tự động cộng tiền ngay khi Admin duyệt.</p>
               </div>
             )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-8 py-8 text-center bg-[#09090b]">
        <button onClick={() => setView('admin-login')} className="text-[10px] text-gray-700 hover:text-white flex items-center justify-center gap-1 mx-auto"><Lock size={10}/> ADMIN</button>
      </footer>
    </div>
  );
};

// --- GIAO DIỆN ADMIN ---
const AdminPanel = ({ user, onLogout, setView, showToast }) => {
  const [products, setProducts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  // DATA MỚI: dataTextarea dùng để nhập nhiều dòng
  const [newProd, setNewProd] = useState({ title: '', price: '', tag: 'VIP', desc: '', dataTextarea: '', image: '' });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), s => setDeposits(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    // Chuyển text area thành mảng (Mỗi dòng 1 nick)
    const stockList = newProd.dataTextarea.split('\n').filter(line => line.trim() !== '');
    
    if (stockList.length === 0) return showToast("Vui lòng nhập ít nhất 1 tài khoản!", "error");

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { 
        ...newProd, 
        stock: stockList, // Lưu mảng stock
        price: Number(newProd.price) 
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
      showToast("Đã duyệt! Tiền về ví khách ngay lập tức.", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono text-sm p-4 pb-20">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-black z-50">
        <div className="text-rose-500 font-bold flex gap-2"><Terminal/> ADMIN DASHBOARD</div>
        <button onClick={() => { onLogout(); setView('shop'); }} className="text-gray-400 hover:text-white">EXIT</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111] border-2 border-emerald-500/50 p-6 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)]">
           <h3 className="text-emerald-400 font-bold mb-4 text-lg flex gap-2"><Database/> ĐĂNG BÁN (Live)</h3>
           <form onSubmit={handleAdd} className="space-y-3">
             <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Tên sản phẩm" value={newProd.title} onChange={e=>setNewProd({...newProd, title:e.target.value})} required/>
             <div className="grid grid-cols-2 gap-2">
                <input type="number" className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Giá (1 acc)" value={newProd.price} onChange={e=>setNewProd({...newProd, price:e.target.value})} required/>
                <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Tag" value={newProd.tag} onChange={e=>setNewProd({...newProd, tag:e.target.value})} />
             </div>
             
             <div>
               <label className="text-xs text-gray-500 block mb-1">DANH SÁCH ACC (Mỗi dòng 1 nick - Định dạng: User|Pass)</label>
               <textarea 
                 className="w-full bg-black border border-rose-900 p-2 text-emerald-400 h-32 outline-none focus:border-rose-500 font-mono text-xs whitespace-pre" 
                 placeholder={`user1|pass1\nuser2|pass2\nuser3|pass3`} 
                 value={newProd.dataTextarea} 
                 onChange={e=>setNewProd({...newProd, dataTextarea:e.target.value})} 
                 required
               />
               <p className="text-[10px] text-gray-500 mt-1">Hệ thống sẽ tự đếm số dòng làm số lượng tồn kho.</p>
             </div>

             <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-3 font-bold mt-2 rounded">ĐĂNG BÁN NGAY</button>
           </form>
        </div>

        <div className="space-y-6">
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
  const [view, setView] = useState('shop');
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast({msg:'',type:''}), 3000); };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const unsubUser = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            if (docSnap.data().email === SUPER_ADMIN_EMAIL && view === 'admin-login') setView('admin-panel');
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
                 <button type="button" onClick={()=>setView('shop')} className="w-full text-gray-600 text-[10px] mt-2 hover:text-white">BACK</button>
              </form>
           </div>
        </div>
      ) : (
        <ShopView user={user} userData={userData} onLogin={() => signInWithPopup(auth, googleProvider)} onLogout={()=>signOut(auth)} setView={setView} showToast={showToast} />
      )}
    </>
  );
}


