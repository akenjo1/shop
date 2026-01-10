import React, { useState, useEffect } from 'react';
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
  getDoc 
} from 'firebase/firestore';
import { 
  ShoppingCart, ShieldCheck, User, LogOut, 
  Plus, Trash2, CheckCircle, XCircle, Search, 
  LayoutDashboard, Wallet, Gamepad2, Zap, Star, 
  Lock, Terminal, Image as ImageIcon, CreditCard,
  AlertTriangle, ArrowRight, Tag, FileText
} from 'lucide-react';

// ==========================================
// 🔴 CẤU HÌNH FIREBASE (DÁN MÃ CỦA BẠN VÀO ĐÂY)
// ==========================================
const firebaseConfig = {
  apiKey: "DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY",
  authDomain: "DÁN_AUTH_DOMAIN_VÀO_ĐÂY",
  projectId: "DÁN_PROJECT_ID_VÀO_ĐÂY",
  storageBucket: "DÁN_STORAGE_BUCKET_VÀO_ĐÂY",
  messagingSenderId: "DÁN_SENDER_ID_VÀO_ĐÂY",
  appId: "DÁN_APP_ID_VÀO_ĐÂY"
};

// --- KHỞI TẠO HỆ THỐNG ---
let app, auth, db, googleProvider;
let firebaseError = null;

try {
  if (firebaseConfig.apiKey.includes("DÁN_API_KEY") || firebaseConfig.apiKey === "") {
    throw new Error("CHƯA NHẬP API KEY! Vui lòng mở file src/App.jsx để điền.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Lỗi Firebase:", error);
  firebaseError = error.message;
}

const appId = 'cybershop-v2'; // ID định danh cho Database
const SUPER_ADMIN_EMAIL = "admin@shop.com"; // Email Admin

// --- DỮ LIỆU & HÀM HỖ TRỢ ---
const AUTO_IMAGES = {
  netflix: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&q=80',
  youtube: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'
};

const getSmartImage = (title, manualUrl) => {
  if (manualUrl && manualUrl.length > 5) return manualUrl;
  const lower = (title || "").toLowerCase();
  for (const [key, url] of Object.entries(AUTO_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return AUTO_IMAGES.default;
};

const SHOWCASE_PRODUCTS = [
  { id: 'demo1', title: 'Netflix Premium 4K', price: 69000, desc: 'Xem phim 4K HDR', tag: 'VIP' },
  { id: 'demo2', title: 'Spotify Premium 1 Năm', price: 299000, desc: 'Nghe nhạc không quảng cáo', tag: 'Music' },
];

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';
  return (
    <div className={`fixed top-6 right-6 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] flex items-center gap-3 animate-slide-in border border-white/10`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><XCircle size={18}/></button>
    </div>
  );
};

// --- GIAO DIỆN KHÁCH HÀNG ---
const ShopView = ({ user, userData, onLogin, onLogout, setView, showToast }) => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleBuy = async (prod, isDemo) => {
    if (isDemo) return showToast("Hàng mẫu không thể mua.", "info");
    if (!user) return showToast("Vui lòng đăng nhập Google!", "error");
    if ((userData?.balance || 0) < prod.price) return showToast("Số dư không đủ. Hãy nạp thêm!", "error");

    try {
      const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', prod.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) return showToast("Sản phẩm này đã hết hàng!", "error");
      
      const fullData = prodSnap.data();
      
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        balance: userData.balance - prod.price
      });
      await deleteDoc(prodRef); // Mua xong xóa luôn (Cơ chế 1 sản phẩm 1 người mua)

      alert(`🎉 MUA THÀNH CÔNG!\n\n📦 THÔNG TIN TÀI KHOẢN:\n${fullData.data}\n\n(Hãy lưu lại ngay)`);
      showToast("Giao dịch thành công!", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (depositAmount < 10000) return showToast("Nạp tối thiểu 10,000đ", "error");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), {
      userId: user.uid, userEmail: user.email, amount: Number(depositAmount), 
      note: depositNote, status: 'pending', createdAt: new Date().toISOString()
    });
    setDepositAmount(''); setDepositNote('');
    showToast("Đã gửi yêu cầu nạp!", "success");
  };

  const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans pb-20">
      
      {/* NAVBAR: SỬA LỖI LOGO VỀ TRANG CHỦ */}
      <nav className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* BẤM VÀO LOGO LÀ VỀ HOME */}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
            <Gamepad2 className="text-violet-500" /> 
            <span className="font-bold text-xl">CYBER<span className="text-violet-500">SHOP</span></span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div onClick={() => setActiveTab('deposit')} className="cursor-pointer flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-emerald-500 transition">
                  <Wallet size={14} className="text-emerald-400"/>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatVND(userData?.balance || 0)}</span>
                  <Plus size={14} className="text-gray-500"/>
                </div>
                <button onClick={onLogout}><LogOut size={20} className="text-gray-400 hover:text-rose-500"/></button>
              </>
            ) : (
              <button onClick={onLogin} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <User size={16}/> Đăng Nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'home' ? (
          <div className="space-y-12 animate-fade-in">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden h-64 flex items-center p-8 bg-gradient-to-r from-violet-900 to-black border border-white/10">
               <div className="z-10">
                 <h1 className="text-3xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-200">KHO ACC TỰ ĐỘNG</h1>
                 <p className="text-gray-400 mb-6">Hệ thống bán hàng siêu tốc. Uy tín - Bảo hành.</p>
                 {!user && <button onClick={onLogin} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:scale-105 transition">Đăng nhập ngay</button>}
               </div>
            </div>

            {/* PRODUCT LIST */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2"><Zap size={20}/> TÀI KHOẢN CÓ SẴN</h2>
              
              {products.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl text-gray-500">
                   <Search size={32} className="mx-auto mb-2 opacity-50"/>
                   Kho hàng đang được cập nhật...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-[#121214] border border-white/5 rounded-xl overflow-hidden hover:border-violet-500 transition group hover:-translate-y-1">
                      <div className="h-40 relative">
                        <img src={getSmartImage(p.title, p.image)} className="w-full h-full object-cover"/>
                        <span className="absolute bottom-2 right-2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">{p.tag || 'AUTO'}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold truncate text-gray-100">{p.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.desc || 'Tài khoản chất lượng cao'}</p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-emerald-400 font-bold">{formatVND(p.price)}</span>
                          <button onClick={() => handleBuy(p, false)} className="bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-violet-500 hover:text-white transition">MUA NGAY</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SHOWCASE */}
            <div>
               <h2 className="text-xl font-bold mb-4 text-gray-400 flex items-center gap-2"><Star size={20}/> HÀNG MẪU (DEMO)</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-70">
                 {SHOWCASE_PRODUCTS.map(p => (
                    <div key={p.id} className="bg-[#121214] border border-white/5 rounded-xl overflow-hidden">
                       <div className="h-40 relative"><img src={getSmartImage(p.title)} className="w-full h-full object-cover grayscale"/></div>
                       <div className="p-4">
                         <h3 className="font-bold text-gray-400 truncate">{p.title}</h3>
                         <div className="flex justify-between items-center mt-2">
                            <span className="text-violet-400 font-bold text-sm">{formatVND(p.price)}</span>
                            <span className="text-xs border border-gray-600 px-2 py-1 rounded">Xem thử</span>
                         </div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        ) : (
          // DEPOSIT TAB
          <div className="max-w-md mx-auto bg-[#121214] border border-white/10 rounded-2xl p-6 animate-fade-in shadow-2xl">
            <button onClick={() => setActiveTab('home')} className="mb-4 text-xs text-gray-500 hover:text-white flex items-center gap-1">← Quay lại</button>
            <h2 className="text-xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">NẠP TIỀN VÀO VÍ</h2>
            <div className="bg-violet-900/20 border border-violet-500/20 p-6 rounded-xl mb-6 relative overflow-hidden">
               <p className="text-sm text-violet-300">MB BANK (Quân Đội)</p>
               <p className="text-white font-bold text-2xl my-2 tracking-widest">9999 8888 6666</p>
               <p className="text-xs text-gray-400 font-bold">CHỦ TK: ADMIN SHOP</p>
               <div className="mt-4 bg-black/40 p-2 rounded text-center border border-dashed border-gray-600">
                 <span className="text-gray-400 text-xs">Nội dung:</span> <span className="text-yellow-400 font-bold select-all">NAP {user?.email?.split('@')[0]}</span>
               </div>
            </div>
            <form onSubmit={handleDeposit} className="space-y-4">
               <input type="number" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-emerald-500 outline-none" placeholder="Nhập số tiền" />
               <input type="text" value={depositNote} onChange={e=>setDepositNote(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-emerald-500 outline-none" placeholder="Nhập mã giao dịch" />
               <button className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition">XÁC NHẬN ĐÃ CHUYỂN</button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 mt-auto py-8 text-center bg-[#09090b]">
        <button onClick={() => setView('admin-login')} className="text-[10px] text-gray-700 hover:text-white flex items-center justify-center gap-1 mx-auto transition">
          <Lock size={10} /> ACCESS ADMIN
        </button>
      </footer>
    </div>
  );
};

// --- GIAO DIỆN ADMIN ---
const AdminPanel = ({ user, onLogout, setView, showToast }) => {
  const [deposits, setDeposits] = useState([]);
  const [products, setProducts] = useState([]);
  
  // FORM THÊM SẢN PHẨM ĐẦY ĐỦ
  const [newProd, setNewProd] = useState({ 
    title: '', 
    price: '', 
    tag: 'Premium', 
    desc: '', 
    data: '', // Dữ liệu mật (User|Pass)
    image: '' 
  });

  useEffect(() => {
    if (user?.email !== SUPER_ADMIN_EMAIL && user?.email !== 'admin@system.local') setView('shop');
  }, [user]);

  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), s => setDeposits(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, []);

  const handleApprove = async (d) => {
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', d.userId);
      const snap = await getDoc(userRef);
      const oldBal = snap.exists() ? (snap.data().balance || 0) : 0;
      await updateDoc(userRef, { balance: oldBal + d.amount });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), { status: 'approved' });
      showToast("Đã cộng tiền!", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        ...newProd, 
        price: Number(newProd.price), 
        createdAt: new Date().toISOString()
      });
      showToast("Đã thêm sản phẩm!", "success");
      setNewProd({ title: '', price: '', tag: 'Premium', desc: '', data: '', image: '' });
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono text-sm p-4">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2 text-rose-500 font-bold"><Terminal size={18}/> QUẢN TRỊ VIÊN</div>
        <button onClick={() => { onLogout(); setView('shop'); }} className="text-white hover:text-rose-500">THOÁT</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: FORM ĐĂNG BÁN */}
        <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg h-fit">
           <h3 className="text-white font-bold mb-4 text-emerald-500 border-b border-emerald-900/30 pb-2 flex gap-2"><Plus size={16}/> ĐĂNG BÁN ACC</h3>
           <form onSubmit={handleAdd} className="space-y-3">
             <div>
               <label className="text-[10px] text-gray-500 uppercase">Tên tài khoản</label>
               <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="VD: Netflix Premium 1 Tháng" value={newProd.title} onChange={e=>setNewProd({...newProd, title:e.target.value})} required/>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="text-[10px] text-gray-500 uppercase">Giá bán (VNĐ)</label>
                   <input type="number" className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="69000" value={newProd.price} onChange={e=>setNewProd({...newProd, price:e.target.value})} required/>
                </div>
                <div>
                   <label className="text-[10px] text-gray-500 uppercase">Loại (Tag)</label>
                   <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="VIP / 18+ / Game" value={newProd.tag} onChange={e=>setNewProd({...newProd, tag:e.target.value})} />
                </div>
             </div>

             <div>
               <label className="text-[10px] text-gray-500 uppercase">Ghi chú (Hiển thị cho khách xem)</label>
               <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="Bảo hành 1 đổi 1, không đổi pass..." value={newProd.desc} onChange={e=>setNewProd({...newProd, desc:e.target.value})} />
             </div>

             <div>
               <label className="text-[10px] text-gray-500 uppercase">Link Ảnh (Bỏ trống để tự động)</label>
               <div className="flex gap-2">
                 <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500" placeholder="https://..." value={newProd.image} onChange={e=>setNewProd({...newProd, image:e.target.value})} />
                 <div className="bg-gray-800 p-2 flex items-center justify-center border border-gray-700"><ImageIcon size={14}/></div>
               </div>
             </div>

             <div>
               <label className="text-[10px] text-rose-500 uppercase font-bold flex gap-1"><Lock size={10}/> DỮ LIỆU MẬT (Acc | Pass)</label>
               <textarea className="w-full bg-black border border-rose-900/50 p-2 text-emerald-500 h-24 outline-none focus:border-rose-500 font-bold font-mono" placeholder="user: admin@gmail.com | pass: 123456" value={newProd.data} onChange={e=>setNewProd({...newProd, data:e.target.value})} required/>
               <p className="text-[10px] text-gray-600 mt-1">* Dữ liệu này chỉ khách mua xong mới thấy.</p>
             </div>

             <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 font-bold transition rounded shadow-lg shadow-emerald-900/20">ĐĂNG LÊN SHOP</button>
           </form>
        </div>

        {/* CỘT PHẢI: QUẢN LÝ */}
        <div className="lg:col-span-2 space-y-6">
           {/* DUYỆT TIỀN */}
           <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg">
              <h3 className="text-white font-bold mb-4 text-yellow-500 border-b border-yellow-900/30 pb-2">DUYỆT TIỀN ({deposits.filter(d => d.status === 'pending').length})</h3>
              <div className="space-y-2">
                {deposits.filter(d => d.status === 'pending').length === 0 && <p className="text-gray-600 italic text-xs">Sạch sẽ! Không có đơn nạp mới.</p>}
                {deposits.filter(d => d.status === 'pending').map(d => (
                  <div key={d.id} className="flex justify-between items-center bg-black p-3 border-l-4 border-yellow-500 rounded-r">
                     <div>
                        <div className="text-white font-bold">{d.userEmail}</div>
                        <div className="text-xs text-gray-500 font-mono">Mã GD: {d.note}</div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-emerald-400 font-bold text-lg">+{d.amount.toLocaleString()}</span>
                        <div className="flex gap-2">
                          <button onClick={()=>handleApprove(d)} className="bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-500">DUYỆT</button>
                          <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), {status:'rejected'})} className="bg-rose-900 text-white px-2 py-1 text-xs rounded hover:bg-rose-800">HỦY</button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           {/* DANH SÁCH SẢN PHẨM */}
           <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg max-h-[500px] overflow-y-auto">
              <h3 className="text-white font-bold mb-4 text-blue-500 border-b border-blue-900/30 pb-2">KHO HÀNG ĐANG BÁN ({products.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                 {products.map(p => (
                    <div key={p.id} className="flex gap-3 bg-black p-3 border border-gray-800 items-center rounded hover:border-gray-600 transition group">
                       <img src={getSmartImage(p.title, p.image)} className="w-10 h-10 object-cover opacity-60 rounded"/>
                       <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-bold truncate">{p.title} <span className="text-[10px] text-gray-500 border border-gray-700 px-1 rounded ml-2">{p.tag}</span></div>
                          <div className="text-[10px] text-gray-500 truncate mt-1">Ghi chú: {p.desc}</div>
                          <div className="text-[10px] text-emerald-600 truncate font-mono mt-0.5">DATA: {p.data}</div>
                       </div>
                       <div className="text-white font-bold text-xs mr-4">{p.price.toLocaleString()}</div>
                       <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id))} className="text-rose-900 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- APP CONTROLLER ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('shop');
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast({msg:'',type:''}), 3000); };

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center p-8 text-center font-mono">
        <div>
           <AlertTriangle size={48} className="mx-auto mb-4"/>
           <h1 className="text-2xl font-bold">LỖI CẤU HÌNH</h1>
           <p className="text-gray-400 mt-2">Vui lòng mở file src/App.jsx và dán API Key vào.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'artifacts', appId, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          if (data.role === 'admin' && view === 'admin-login') setView('admin-panel');
        } else {
          const initData = { email: u.email, balance: 0, role: 'user', createdAt: serverTimestamp() };
          await setDoc(ref, initData);
          setUserData(initData);
        }
      }
    });
    return () => unsub();
  }, [view]);

  const handleAdminAuth = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'artifacts', appId, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      if ((snap.exists() && snap.data().role === 'admin') || email === SUPER_ADMIN_EMAIL) {
        if (!snap.exists() || snap.data().role !== 'admin') await setDoc(userRef, { email, role: 'admin', balance: 999999999 }, { merge: true });
        setView('admin-panel');
      } else { showToast("Không có quyền Admin", "error"); signOut(auth); }
    } catch (e) { showToast("Sai tài khoản/mật khẩu", "error"); }
  };

  return (
    <>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      {view === 'admin-panel' ? (
        <AdminPanel user={user} onLogout={()=>signOut(auth)} setView={setView} showToast={showToast} />
      ) : view === 'admin-login' ? (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono">
           <div className="w-full max-w-sm p-8 border border-rose-900/30 bg-[#0a0a0a] shadow-[0_0_50px_rgba(225,29,72,0.1)]">
              <h2 className="text-rose-600 font-bold mb-6 flex items-center gap-2 tracking-widest"><Lock size={16}/> ADMIN LOGIN</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleAdminAuth(e.target.email.value, e.target.password.value); }} className="space-y-4">
                 <input name="email" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600 transition" placeholder="admin@shop.com" />
                 <input type="password" name="password" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600 transition" placeholder="********" />
                 <button className="w-full bg-rose-700 text-white py-2 font-bold text-xs mt-4 hover:bg-rose-600 transition">LOGIN</button>
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


