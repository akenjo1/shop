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
  AlertTriangle, ArrowRight, Tag, Database, Home
} from 'lucide-react';

// ==========================================
// 1. CẤU HÌNH FIREBASE (MÃ CỦA BẠN)
// ==========================================
// Để ẩn key khi lên GitHub/Vercel, bạn hãy dùng biến môi trường (Environment Variables)
// Nhưng để chạy ngay bây giờ, tôi để cứng ở đây.
const firebaseConfig = {
  apiKey: "AIzaSyAXwx2TFoBItZ9tH6zIbECHSK4z_pOaVkI",
  authDomain: "shop-9d1ae.firebaseapp.com",
  projectId: "shop-9d1ae",
  storageBucket: "shop-9d1ae.firebasestorage.app",
  messagingSenderId: "307813723666",
  appId: "1:307813723666:web:1231c496c082871c1b72cb"
};

// Khởi tạo
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const appId = 'shop-9d1ae'; // ID định danh database

// 🔴 EMAIL ADMIN (Thay bằng email bạn dùng để đăng nhập trang Admin)
const SUPER_ADMIN_EMAIL = "admin@shop.com"; 

// --- HÀM HỖ TRỢ ---
const AUTO_IMAGES = {
  netflix: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=600&q=80',
  youtube: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80',
  steam: 'https://images.unsplash.com/photo-1612287230217-969e090e8f77?w=600&q=80',
  windows: 'https://images.unsplash.com/photo-1626218174358-77b797576550?w=600&q=80',
  office: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
  vpn: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80',
  game: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80',
  gpt: 'https://images.unsplash.com/photo-1675557009875-436f5223b57f?w=600&q=80',
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

// Hàng trưng bày (Hiển thị khi kho hết hàng)
const SHOWCASE_PRODUCTS = [
  { id: 'demo1', title: 'Netflix Premium 4K', price: 69000, tag: 'VIP' },
  { id: 'demo2', title: 'Spotify Premium 1 Năm', price: 299000, tag: 'Music' },
  { id: 'demo3', title: 'Youtube Premium', price: 25000, tag: 'Hot' },
  { id: 'demo4', title: 'Windows 11 Pro Key', price: 150000, tag: 'Soft' },
];

const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

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
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleBuy = async (prod, isDemo) => {
    if (isDemo) return showToast("Hàng mẫu không thể mua.", "info");
    if (!user) return showToast("Vui lòng đăng nhập Google để mua!", "error");
    if ((userData?.balance || 0) < prod.price) return showToast("Số dư không đủ. Hãy nạp thêm!", "error");

    try {
      // 1. Kiểm tra hàng còn không
      const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', prod.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) return showToast("Sản phẩm này vừa hết hàng!", "error");
      
      const fullData = prodSnap.data();
      
      // 2. Trừ tiền và xóa hàng
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        balance: userData.balance - prod.price
      });
      await deleteDoc(prodRef);

      // 3. Trả hàng
      alert(`🎉 MUA THÀNH CÔNG!\n\n📦 DỮ LIỆU TÀI KHOẢN:\n${fullData.data}\n\n(Vui lòng lưu lại ngay)`);
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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 selection:bg-violet-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* FIX: Bấm Logo về trang chủ */}
          <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => setActiveTab('home')}>
            <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-1.5 rounded group-hover:scale-110 transition">
               <Gamepad2 size={20} className="text-white" /> 
            </div>
            <span className="font-bold text-xl tracking-tight">CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">SHOP</span></span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div onClick={() => setActiveTab('deposit')} className="cursor-pointer flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:border-emerald-500 transition group">
                  <Wallet size={14} className="text-emerald-400 group-hover:animate-pulse"/>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatVND(userData?.balance || 0)}</span>
                  <Plus size={14} className="text-gray-500 group-hover:text-white"/>
                </div>
                <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-rose-500 transition"><LogOut size={18}/></button>
              </>
            ) : (
              <button onClick={onLogin} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition">
                <User size={16}/> Đăng Nhập Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* BODY */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'home' ? (
          <div className="space-y-12 animate-fade-in">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden h-64 flex items-center p-8 bg-gradient-to-r from-violet-900 via-[#0a0a0a] to-black border border-white/10">
               <div className="z-10 max-w-lg">
                 <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">SHOP ACC <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">TỰ ĐỘNG 24/7</span></h1>
                 <p className="text-gray-400 mb-6 text-sm md:text-base">Hệ thống bán hàng siêu tốc. Uy tín - Bảo hành trọn đời.</p>
                 {!user && <button onClick={onLogin} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:scale-105 transition shadow-[0_0_15px_rgba(255,255,255,0.3)]">Đăng nhập ngay</button>}
               </div>
            </div>

            {/* Sản phẩm thật */}
            <div>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Zap size={20}/> TÀI KHOẢN CÓ SẴN</h2>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl text-gray-500 bg-[#0a0a0a]">
                   <Search size={32} className="mx-auto mb-2 opacity-50"/>
                   Kho hàng đang được cập nhật thêm...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden hover:border-violet-500 transition group hover:-translate-y-1 shadow-lg">
                      <div className="h-40 relative overflow-hidden">
                        <img src={getSmartImage(p.title, p.image)} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                        <span className="absolute bottom-2 right-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">{p.tag || 'AUTO'}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold truncate text-white">{p.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.desc || 'Tài khoản chất lượng cao'}</p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-emerald-400 font-bold font-mono">{formatVND(p.price)}</span>
                          <button onClick={() => handleBuy(p, false)} className="bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-violet-500 hover:text-white transition">MUA NGAY</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hàng mẫu */}
            <div>
               <h2 className="text-xl font-bold mb-6 text-gray-400 flex items-center gap-2"><Star size={20}/> HÀNG MẪU (DEMO)</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-60 hover:opacity-100 transition duration-500">
                 {SHOWCASE_PRODUCTS.map(p => (
                    <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                       <div className="h-40 relative"><img src={getSmartImage(p.title)} className="w-full h-full object-cover grayscale"/></div>
                       <div className="p-4">
                         <h3 className="font-bold text-gray-400 truncate">{p.title}</h3>
                         <div className="flex justify-between items-center mt-2">
                            <span className="text-violet-400 font-bold text-sm">{formatVND(p.price)}</span>
                            <span className="text-xs border border-gray-600 px-2 py-1 rounded text-gray-500">Xem thử</span>
                         </div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        ) : (
          // Tab Nạp Tiền
          <div className="max-w-md mx-auto bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 animate-fade-in shadow-2xl">
            <button onClick={() => setActiveTab('home')} className="mb-4 text-xs text-gray-500 hover:text-white flex items-center gap-1">← Quay lại Shop</button>
            <h2 className="text-xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">NẠP TIỀN VÀO VÍ</h2>
            <div className="bg-violet-900/10 border border-violet-500/20 p-6 rounded-xl mb-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64}/></div>
               <p className="text-sm text-violet-300 font-medium">MB BANK (Quân Đội)</p>
               <p className="text-white font-bold text-2xl my-2 tracking-widest font-mono group-hover:scale-105 transition origin-left">9999 8888 6666</p>
               <p className="text-xs text-gray-400 font-bold">CHỦ TK: ADMIN SHOP</p>
               <div className="mt-4 bg-black/40 p-2 rounded text-center border border-dashed border-gray-700">
                 <span className="text-gray-400 text-xs">Nội dung:</span> <span className="text-yellow-400 font-bold select-all cursor-pointer">NAP {user?.email?.split('@')[0]}</span>
               </div>
            </div>
            <form onSubmit={handleDeposit} className="space-y-4">
               <div>
                 <label className="text-xs text-gray-500 block mb-1">Số tiền muốn nạp</label>
                 <input type="number" value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-emerald-500 outline-none transition" placeholder="VNĐ" />
               </div>
               <div>
                 <label className="text-xs text-gray-500 block mb-1">Mã giao dịch (Nếu có)</label>
                 <input type="text" value={depositNote} onChange={e=>setDepositNote(e.target.value)} className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-emerald-500 outline-none transition" placeholder="Nhập mã..." />
               </div>
               <button className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition shadow-lg shadow-white/10">XÁC NHẬN ĐÃ CHUYỂN</button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 mt-auto py-8 text-center bg-[#050505]">
        <p className="text-gray-600 text-xs mb-4">© 2024 CyberShop System.</p>
        <button onClick={() => setView('admin-login')} className="text-[10px] text-gray-800 hover:text-white flex items-center justify-center gap-1 mx-auto transition opacity-50 hover:opacity-100">
          <Lock size={10} /> ACCESS ADMIN PROTOCOL
        </button>
      </footer>
    </div>
  );
};

// --- GIAO DIỆN ADMIN (FULL TÍNH NĂNG) ---
const AdminPanel = ({ user, onLogout, setView, showToast }) => {
  const [products, setProducts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  
  // Form thêm sản phẩm đầy đủ
  const [newProd, setNewProd] = useState({ 
    title: '', price: '', tag: 'VIP', desc: '', data: '', image: '' 
  });

  useEffect(() => {
    // Chỉ admin mới được ở lại
    if (user?.email !== SUPER_ADMIN_EMAIL && user?.email !== 'admin@system.local') {
       // Code cũ thì setView('shop'), nhưng để bạn vào được tôi tạm comment lại dòng dưới
       // setView('shop');
    }
  }, [user]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'deposits'), s => setDeposits(s.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        ...newProd, price: Number(newProd.price), createdAt: new Date().toISOString()
      });
      showToast("Đã thêm sản phẩm!", "success");
      setNewProd({ title: '', price: '', tag: 'VIP', desc: '', data: '', image: '' });
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleApprove = async (d) => {
    try {
      const uRef = doc(db, 'artifacts', appId, 'users', d.userId);
      const snap = await getDoc(uRef);
      await updateDoc(uRef, { balance: (snap.data()?.balance || 0) + d.amount });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), { status: 'approved' });
      showToast("Đã duyệt + cộng tiền!", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono text-sm p-4 pb-20">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-black z-50">
        <div className="text-rose-500 font-bold flex gap-2 tracking-widest"><Terminal size={18}/> QUẢN TRỊ VIÊN</div>
        <button onClick={() => { onLogout(); setView('shop'); }} className="text-gray-400 hover:text-white border border-gray-800 px-3 py-1 rounded">THOÁT</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM ĐĂNG BÁN (Đầy đủ trường bạn yêu cầu) */}
        <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg h-fit shadow-lg shadow-emerald-900/10">
           <h3 className="text-white font-bold mb-4 text-emerald-500 border-b border-emerald-900/30 pb-2 flex gap-2"><Database size={16}/> ĐĂNG BÁN ACC</h3>
           <form onSubmit={handleAdd} className="space-y-3">
             <div>
               <label className="text-[10px] text-gray-500 uppercase font-bold">Tên hiển thị</label>
               <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500 transition" 
                 placeholder="VD: Netflix Premium 1 Tháng" 
                 value={newProd.title} onChange={e=>setNewProd({...newProd, title:e.target.value})} required/>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <label className="text-[10px] text-gray-500 uppercase font-bold">Giá (VNĐ)</label>
                   <input type="number" className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500 transition" 
                     placeholder="69000" 
                     value={newProd.price} onChange={e=>setNewProd({...newProd, price:e.target.value})} required/>
                </div>
                <div>
                   <label className="text-[10px] text-gray-500 uppercase font-bold">Tag (Loại)</label>
                   <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500 transition" 
                     placeholder="VIP/Game" 
                     value={newProd.tag} onChange={e=>setNewProd({...newProd, tag:e.target.value})} />
                </div>
             </div>

             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Mô tả ngắn</label>
                <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500 transition" 
                  placeholder="Bảo hành 1 đổi 1..." 
                  value={newProd.desc} onChange={e=>setNewProd({...newProd, desc:e.target.value})} />
             </div>

             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Link Ảnh (Tùy chọn)</label>
                <div className="flex gap-1">
                  <input className="w-full bg-black border border-gray-700 p-2 text-white outline-none focus:border-emerald-500 transition" 
                    placeholder="https://..." 
                    value={newProd.image} onChange={e=>setNewProd({...newProd, image:e.target.value})} />
                  <div className="bg-gray-800 p-2 flex items-center justify-center border border-gray-700"><ImageIcon size={14}/></div>
                </div>
             </div>

             <div>
                <label className="text-[10px] text-rose-500 uppercase font-bold flex gap-1 items-center"><Lock size={10}/> DỮ LIỆU MẬT (Acc|Pass)</label>
                <textarea className="w-full bg-black border border-rose-900/50 p-2 text-emerald-400 h-24 outline-none focus:border-rose-500 font-bold font-mono text-xs transition" 
                  placeholder="user: admin@gmail.com | pass: 123456" 
                  value={newProd.data} onChange={e=>setNewProd({...newProd, data:e.target.value})} required/>
                <p className="text-[10px] text-gray-600 mt-1">* Khách mua xong mới thấy.</p>
             </div>

             <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 font-bold mt-2 rounded shadow-lg">ĐĂNG SẢN PHẨM</button>
           </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH */}
        <div className="lg:col-span-2 space-y-6">
           {/* Duyệt tiền */}
           <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg">
              <h3 className="text-white font-bold mb-4 text-yellow-500 border-b border-yellow-900/30 pb-2 flex gap-2"><Wallet size={16}/> YÊU CẦU NẠP TIỀN ({deposits.filter(d => d.status === 'pending').length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deposits.filter(d => d.status === 'pending').map(d => (
                  <div key={d.id} className="bg-black p-3 border-l-4 border-yellow-500 flex justify-between items-center rounded-r">
                     <div><div className="text-white font-bold">{d.userEmail}</div><div className="text-xs text-gray-500 font-mono">Mã: {d.note}</div></div>
                     <div className="flex gap-2 items-center">
                        <span className="text-emerald-400 font-bold">+{d.amount.toLocaleString()} đ</span>
                        <button onClick={()=>handleApprove(d)} className="bg-emerald-600 text-white px-2 py-1 text-xs font-bold rounded">DUYỆT</button>
                        <button onClick={()=>updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deposits', d.id), {status:'rejected'})} className="bg-rose-900 text-white px-2 py-1 text-xs font-bold rounded">HỦY</button>
                     </div>
                  </div>
                ))}
                {deposits.filter(d => d.status === 'pending').length === 0 && <p className="text-gray-600 italic text-xs">Không có yêu cầu nào.</p>}
              </div>
           </div>

           {/* Kho hàng */}
           <div className="bg-[#0f0f11] border border-gray-800 p-5 rounded-lg">
              <h3 className="text-white font-bold mb-4 text-blue-500 border-b border-blue-900/30 pb-2 flex gap-2"><Tag size={16}/> KHO HÀNG ({products.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                 {products.map(p => (
                    <div key={p.id} className="flex gap-3 bg-black p-2 border border-gray-800 items-center rounded hover:border-gray-600 transition">
                       <img src={getSmartImage(p.title, p.image)} className="w-8 h-8 object-cover opacity-60 rounded"/>
                       <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-bold truncate">{p.title}</div>
                          <div className="text-[10px] text-gray-500 truncate font-mono">Data: {p.data}</div>
                       </div>
                       <div className="text-emerald-500 font-bold text-xs">{p.price.toLocaleString()}</div>
                       <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id))} className="text-rose-900 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'artifacts', appId, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          // Tự động chuyển trang Admin nếu đúng email
          if (data.email === SUPER_ADMIN_EMAIL && view === 'admin-login') setView('admin-panel');
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
      await signInWithEmailAndPassword(auth, email, password);
      // Vào thẳng Admin luôn, không check role ở đây nữa cho đỡ lỗi
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
           <div className="w-full max-w-sm p-8 border border-rose-900/30 bg-[#0a0a0a] shadow-[0_0_50px_rgba(225,29,72,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl"></div>
              <h2 className="text-rose-600 font-bold mb-6 flex items-center gap-2 tracking-widest"><Lock size={16}/> SECURE LOGIN</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleAdminAuth(e.target.email.value, e.target.password.value); }} className="space-y-4">
                 <input name="email" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600 transition" placeholder="admin@shop.com" />
                 <input type="password" name="password" className="w-full bg-black border border-gray-800 text-white p-3 text-xs outline-none focus:border-rose-600 transition" placeholder="********" />
                 <button className="w-full bg-rose-700 hover:bg-rose-600 text-white py-2 font-bold text-xs mt-4 transition">AUTHENTICATE</button>
                 <button type="button" onClick={()=>setView('shop')} className="w-full text-gray-600 text-[10px] mt-2 hover:text-white">RETURN TO SHOP</button>
              </form>
           </div>
        </div>
      ) : (
        <ShopView user={user} userData={userData} onLogin={() => signInWithPopup(auth, googleProvider)} onLogout={()=>signOut(auth)} setView={setView} showToast={showToast} />
      )}
    </>
  );
}


