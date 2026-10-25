import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbzkhBZkwfyQunRgkiiIHLmoMzzno3lRU",
  authDomain: "koda-task-bd-43172.firebaseapp.com",
  projectId: "koda-task-bd-43172",
  storageBucket: "koda-task-bd-43172.firebasestorage.app",
  messagingSenderId: "17624227098",
  appId: "1:17624227098:web:3cab9bd3789f286bd520a3",
  measurementId: "G-TKD5PVVQ8G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Profile editable states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  // Gateways synced with Firestore
  const [gateways, setGateways] = useState({
    bkash: "01737966207",
    nagad: "01737966207",
    rocket: "01737966207",
    binance: "KODA-PAY-USDT-ID"
  });

  // Default Tasks with configurable timer (in seconds) and link
  const [tasks, setTasks] = useState([
    { id: '1', title: 'YouTube Video Watch & Subscribe', reward: 10, link: 'https://youtube.com', timerSec: 25 },
    { id: '2', title: 'Facebook Page Follow & Like', reward: 8, link: 'https://facebook.com', timerSec: 20 },
    { id: '3', title: 'Telegram Channel Join', reward: 5, link: 'https://telegram.org', timerSec: 15 },
    { id: '4', title: 'App Download & Review', reward: 14, link: 'https://play.google.com', timerSec: 30 },
    { id: '5', title: 'Website Visit & Read Article', reward: 12, link: 'https://google.com', timerSec: 25 }
  ]);

  // Admin Task management states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskTimer, setNewTaskTimer] = useState(25);

  // Membership Plans matching user image style
  const [packages, setPackages] = useState([
    { 
      id: 'p1', 
      name: 'Basic Starter', 
      price: 500, 
      validity: '30 Days', 
      dailyTasks: 5, 
      dailyPotential: 100, 
      desc: 'Perfect for beginners looking to earn daily pocket money with easy micro-tasks.',
      features: ['5 Daily AI & Ad Tasks', '৳100 Daily Guaranteed Potential', '30 Days Validity', 'Instant bKash/Nagad Payout', 'Standard Support'] 
    },
    { 
      id: 'p2', 
      name: 'Standard Pro', 
      price: 1200, 
      validity: '30 Days', 
      dailyTasks: 10, 
      dailyPotential: 450, 
      desc: 'Most popular membership plan with enhanced daily income and high-tier tasks.',
      features: ['10 Daily AI & Ad Tasks', '৳450 Daily Potential (৳13,500/mo)', '30 Days Validity', 'Priority Withdrawal Queue', 'Dedicated Telegram Support'] 
    },
    { 
      id: 'p3', 
      name: 'Premium Booster', 
      price: 2500, 
      validity: '45 Days', 
      dailyTasks: 18, 
      dailyPotential: 950, 
      desc: 'Advanced package for serious earners offering high payout AI tasks and extended validity.',
      features: ['18 Daily Premium Tasks', '৳950 Daily Potential (৳42,750 total)', 'Extended 45 Days Validity', 'VIP Fast Cashouts', 'Exclusive High-Reward AI tasks'] 
    },
    { 
      id: 'p4', 
      name: 'VIP Master Elite', 
      price: 5000, 
      validity: '60 Days', 
      dailyTasks: 30, 
      dailyPotential: 1700, 
      desc: 'Ultimate membership with maximum daily task limits, highest rewards and instant...',
      features: ['30 Daily High-Reward Tasks', '৳1700 Daily Potential (৳102,000 total)', '60 Days Long Validity', 'Instant Automated Cashouts', 'Personal Account Manager'] 
    }
  ]);

  // Admin Membership management states
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgValidity, setNewPkgValidity] = useState('30 Days');
  const [newPkgTasks, setNewPkgTasks] = useState('');
  const [newPkgPotential, setNewPkgPotential] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');

  const [allDeposits, setAllDeposits] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // User personal history states
  const [myDeposits, setMyDeposits] = useState([]);
  const [myWithdrawals, setMyWithdrawals] = useState([]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [timer, setTimer] = useState(25);
  const [timerActive, setTimerActive] = useState(false);
  const [taskCompletedMsg, setTaskCompletedMsg] = useState('');

  const t = {
    en: {
      brand: "KODA Task",
      subBrand: "Membership-Based Task Platform",
      dashboard: "Dashboard",
      tasks: "Tasks",
      wallet: "Wallet & Transactions",
      membership: "Membership",
      profile: "Profile",
      support: "Support",
      adminPanel: "Admin Panel",
      logout: "Logout",
      login: "Sign In",
      signup: "Sign Up",
      depositWallet: "Deposit Wallet",
      earningsWallet: "Earnings Wallet",
      activePackage: "Active Package",
      noPackage: "No Active Package"
    },
    bn: {
      brand: "KODA Task",
      subBrand: "Membership-Based Task Platform",
      dashboard: "ড্যাশবোর্ড",
      tasks: "টাস্কসমূহ",
      wallet: "ওয়ালেট ও লেনদেন",
      membership: "মেম্বারশিপ",
      profile: "প্রোফাইল",
      support: "সাপোর্ট",
      adminPanel: "অ্যাডমিন প্যানেল",
      logout: "লগআউট",
      login: "সাইন ইন",
      signup: "রেজিস্ট্রেশন",
      depositWallet: "ডিপোজিট ওয়ালেট",
      earningsWallet: "আর্নিংস ওয়ালেট",
      activePackage: "সক্রিয় প্যাকেজ",
      noPackage: "কোনো প্যাকেজ নেই"
    }
  };

  useEffect(() => {
    // Fetch gateways in real-time from Firestore
    const unsubGateways = onSnapshot(doc(db, "settings", "gateways"), (docSnap) => {
      if (docSnap.exists()) {
        setGateways(docSnap.data());
      } else {
        setDoc(doc(db, "settings", "gateways"), {
          bkash: "01737966207",
          nagad: "01737966207",
          rocket: "01737966207",
          binance: "KODA-PAY-USDT-ID"
        });
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          if (currentUser.email === '1roxi1@gmail.com') {
            setUser(currentUser);
            setIsAdmin(true);
            setLoading(false);
          } else {
            setUser(currentUser);
            setIsAdmin(false);
            const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'Banned') {
                  alert("Your account has been banned by admin.");
                  signOut(auth);
                  setUser(null);
                  setUserData(null);
                  setIsAdmin(false);
                  return;
                }
                setUserData(data);
                setProfileName(data.name || '');
                setProfilePhone(data.phone || '');
              } else {
                const initialData = {
                  name: currentUser.displayName || "Member",
                  email: currentUser.email,
                  phone: "",
                  depositWallet: 0,
                  earningsWallet: 0,
                  package: null,
                  status: "Active"
                };
                setDoc(doc(db, "users", currentUser.uid), initialData);
                setUserData(initialData);
                setProfileName(initialData.name);
                setProfilePhone(initialData.phone);
              }
            });

            const qDep = query(collection(db, "deposits"), where("uid", "==", currentUser.uid));
            const unsubDep = onSnapshot(qDep, (snapshot) => {
              setMyDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            const qWit = query(collection(db, "withdrawals"), where("uid", "==", currentUser.uid));
            const unsubWit = onSnapshot(qWit, (snapshot) => {
              setMyWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            setLoading(false);
            return () => {
              unsubUser();
              unsubDep();
              unsubWit();
            };
          }
        } else {
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
          setMyDeposits([]);
          setMyWithdrawals([]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Firebase Error:", err);
        setLoading(false);
      }
    });

    const unsubAllDep = onSnapshot(collection(db, "deposits"), (snapshot) => {
      setAllDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAllWit = onSnapshot(collection(db, "withdrawals"), (snapshot) => {
      setAllWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAllUsr = onSnapshot(collection(db, "users"), (snapshot) => {
      setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGateways();
      unsubscribeAuth();
      unsubAllDep();
      unsubAllWit();
      unsubAllUsr();
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
      setTaskCompletedMsg('Task finished! Click Collect Reward.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUserDoc = {
        name: fullName,
        email: email,
        phone: phone,
        depositWallet: 0,
        earningsWallet: 0,
        package: null,
        status: "Active"
      };
      await setDoc(doc(db, "users", res.user.uid), newUserDoc);
      setUserData(newUserDoc);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSaveGateways = async () => {
    try {
      await setDoc(doc(db, "settings", "gateways"), gateways);
      alert("Payment gateways updated successfully!");
    } catch (err) {
      alert("Error updating gateways: " + err.message);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || !depositTrxId) return;
    try {
      await addDoc(collection(db, "deposits"), {
        uid: user.uid,
        email: user.email,
        method: depositMethod,
        amount: Number(depositAmount),
        trxId: depositTrxId,
        status: "Pending",
        timestamp: serverTimestamp()
      });
      alert("Deposit request submitted successfully! Admin will review soon.");
      setDepositAmount('');
      setDepositTrxId('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || !withdrawAccount) return;
    if (amount > (userData?.earningsWallet || 0)) {
      alert("Insufficient earnings balance!");
      return;
    }
    try {
      await addDoc(collection(db, "withdrawals"), {
        uid: user.uid,
        email: user.email,
        method: withdrawMethod,
        amount: amount,
        account: withdrawAccount,
        status: "Pending",
        timestamp: serverTimestamp()
      });
      const newEarnings = userData.earningsWallet - amount;
      await updateDoc(doc(db, "users", user.uid), { earningsWallet: newEarnings });
      setUserData({ ...userData, earningsWallet: newEarnings });
      alert("Withdrawal request submitted successfully!");
      setWithdrawAmount('');
      setWithdrawAccount('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleBuyPackage = async (pkg) => {
    if (!user) { setShowAuthModal(true); return; }
    if (!userData) return;
    if (userData.depositWallet < pkg.price) {
      alert(`Insufficient deposit balance (৳${userData.depositWallet}). Please deposit ৳${pkg.price} first!`);
      setActiveTab('wallet');
      return;
    }
    try {
      const newDeposit = userData.depositWallet - pkg.price;
      await updateDoc(doc(db, "users", user.uid), {
        depositWallet: newDeposit,
        package: pkg.name
      });
      setUserData({ ...userData, depositWallet: newDeposit, package: pkg.name });
      alert(`Successfully activated ${pkg.name}!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading KODA Task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            ☰
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-blue-400 tracking-wide">{t[lang].brand}</h1>
            <p className="text-[10px] md:text-xs text-slate-400">{t[lang].subBrand}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-semibold border border-slate-700"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>

          {user ? (
            <div className="flex items-center space-x-2 md:space-x-3">
              <button 
                onClick={() => setActiveTab('profile')} 
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition"
              >
                <span className="text-base">👤</span>
                <span className="text-xs md:text-sm text-slate-200 font-medium truncate max-w-[100px] md:max-w-none">
                  {isAdmin ? 'Admin' : userData?.name || user.email}
                </span>
              </button>
              <button 
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-xs rounded-lg font-medium text-white"
              >
                {t[lang].logout}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm font-semibold rounded-lg text-white shadow-lg"
            >
              {t[lang].login} / {t[lang].signup}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar for Desktop & Mobile Drawer */}
        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 p-4 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col space-y-2`}>
          <div className="flex justify-between items-center md:hidden mb-4">
            <span className="font-bold text-blue-400">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <button 
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            📊 {t[lang].dashboard}
          </button>
          <button 
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            📋 {t[lang].tasks}
          </button>
          <button 
            onClick={() => { setActiveTab('wallet'); setMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            💳 {t[lang].wallet}
          </button>
          <button 
            onClick={() => { setActiveTab('membership'); setMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'membership' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            ⭐ {t[lang].membership}
          </button>
          <button 
            onClick={() => {
              if (!user) { setShowAuthModal(true); return; }
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            👤 {t[lang].profile}
          </button>
          <button 
            onClick={() => { setActiveTab('support'); setMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'support' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            🎧 {t[lang].support}
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} 
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-slate-800'}`}
            >
              ⚙️ {t[lang].adminPanel}
            </button>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 bg-slate-950 overflow-y-auto w-full">
          {isAdmin && activeTab === 'admin' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-indigo-400">Admin Control Panel</h2>
              
              {/* Payment Gateways (Fully customizable & saved to Firestore) */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Manage Payment Gateways</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate-400">bKash Personal</label>
                    <div className="flex mt-1 space-x-2">
                      <input 
                        type="text" 
                        value={gateways.bkash} 
                        onChange={(e)=>setGateways({...gateways, bkash: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                      <button onClick={()=>copyToClipboard(gateways.bkash)} className="px-3 bg-blue-600 text-xs rounded text-white">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Nagad Personal</label>
                    <div className="flex mt-1 space-x-2">
                      <input 
                        type="text" 
                        value={gateways.nagad} 
                        onChange={(e)=>setGateways({...gateways, nagad: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                      <button onClick={()=>copyToClipboard(gateways.nagad)} className="px-3 bg-blue-600 text-xs rounded text-white">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Rocket Personal</label>
                    <div className="flex mt-1 space-x-2">
                      <input 
                        type="text" 
                        value={gateways.rocket} 
                        onChange={(e)=>setGateways({...gateways, rocket: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                      <button onClick={()=>copyToClipboard(gateways.rocket)} className="px-3 bg-blue-600 text-xs rounded text-white">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Binance ID</label>
                    <div className="flex mt-1 space-x-2">
                      <input 
                        type="text" 
                        value={gateways.binance} 
                        onChange={(e)=>setGateways({...gateways, binance: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                      <button onClick={()=>copyToClipboard(gateways.binance)} className="px-3 bg-blue-600 text-xs rounded text-white">Copy</button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSaveGateways}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded-lg text-white shadow"
                >
                  Save Gateway Numbers
                </button>
              </div>

              {/* Task Management (Link & Timer adjustable) */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Manage Tasks (Link & Timer Adjustable)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Task Title" 
                    value={newTaskTitle} 
                    onChange={(e)=>setNewTaskTitle(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Reward (৳)" 
                    value={newTaskReward} 
                    onChange={(e)=>setNewTaskReward(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="Task Link URL" 
                    value={newTaskLink} 
                    onChange={(e)=>setNewTaskLink(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      placeholder="Timer (Sec)" 
                      value={newTaskTimer} 
                      onChange={(e)=>setNewTaskTimer(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                    <button 
                      onClick={() => {
                        if (!newTaskTitle || !newTaskReward) return;
                        const newTask = {
                          id: Date.now().toString(),
                          title: newTaskTitle,
                          reward: Number(newTaskReward),
                          link: newTaskLink || 'https://example.com',
                          timerSec: Number(newTaskTimer) || 25
                        };
                        setTasks([...tasks, newTask]);
                        setNewTaskTitle('');
                        setNewTaskReward('');
                        setNewTaskLink('');
                        alert("Task added successfully!");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded text-white whitespace-nowrap"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-3 rounded border border-slate-800 gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{task.title}</p>
                        <p className="text-xs text-blue-400">Reward: ৳{task.reward} | Timer: {task.timerSec}s | Link: {task.link}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setTasks(tasks.filter(t => t.id !== task.id));
                          alert("Task removed!");
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded text-white self-end sm:self-center"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Membership Package Customization */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Manage Membership Packages (Fully Customizable)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <input 
                    type="text" 
                    placeholder="Package Name (e.g. Mega Pro)" 
                    value={newPkgName} 
                    onChange={(e)=>setNewPkgName(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Price (৳)" 
                    value={newPkgPrice} 
                    onChange={(e)=>setNewPkgPrice(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="Validity (e.g. 30 Days)" 
                    value={newPkgValidity} 
                    onChange={(e)=>setNewPkgValidity(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Daily Tasks Limit" 
                    value={newPkgTasks} 
                    onChange={(e)=>setNewPkgTasks(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Daily Potential (৳)" 
                    value={newPkgPotential} 
                    onChange={(e)=>setNewPkgPotential(e.target.value)} 
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <button 
                    onClick={() => {
                      if (!newPkgName || !newPkgPrice) return;
                      const newP = {
                        id: Date.now().toString(),
                        name: newPkgName,
                        price: Number(newPkgPrice),
                        validity: newPkgValidity || '30 Days',
                        dailyTasks: Number(newPkgTasks) || 5,
                        dailyPotential: Number(newPkgPotential) || 100,
                        desc: 'Customized membership plan via admin panel.',
                        features: [`${newPkgTasks || 5} Daily Tasks`, `৳${newPkgPotential || 100} Daily Potential`, `${newPkgValidity || '30 Days'} Validity`, 'Instant Payouts']
                      };
                      setPackages([...packages, newP]);
                      setNewPkgName('');
                      setNewPkgPrice('');
                      setNewPkgTasks('');
                      setNewPkgPotential('');
                      alert("Membership package added!");
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-sm font-semibold rounded text-white"
                  >
                    Add Membership Plan
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-amber-400">{pkg.name} - ৳{pkg.price} / {pkg.validity}</h4>
                        <p className="text-xs text-slate-300 mt-1">Limit: {pkg.dailyTasks} Tasks | Potential: ৳{pkg.dailyPotential}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setPackages(packages.filter(p => p.id !== pkg.id));
                          alert("Package removed!");
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs rounded text-white"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposit Audit Requests */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Deposit Audit Requests</h3>
                <div className="space-y-3">
                  {allDeposits.length === 0 ? <p className="text-sm text-slate-400">No deposit requests.</p> : 
                    allDeposits.map(dep => (
                      <div key={dep.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-lg border border-slate-800 gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{dep.email} - ৳{dep.amount} ({dep.method})</p>
                          <p className="text-xs text-slate-400">TrxID: {dep.trxId} | Status: <span className="text-amber-400">{dep.status}</span></p>
                        </div>
                        {dep.status === 'Pending' && (
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, "deposits", dep.id), { status: "Approved" });
                              const usrRef = doc(db, "users", dep.uid);
                              const usrSnap = await getDoc(usrRef);
                              if(usrSnap.exists()) {
                                const currentDep = usrSnap.data().depositWallet || 0;
                                await updateDoc(usrRef, { depositWallet: currentDep + dep.amount });
                              }
                              alert("Deposit approved!");
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded text-white"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Withdrawal Audit Requests */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Withdrawal Audit Requests</h3>
                <div className="space-y-3">
                  {allWithdrawals.length === 0 ? <p className="text-sm text-slate-400">No withdrawal requests.</p> : 
                    allWithdrawals.map(wit => (
                      <div key={wit.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-lg border border-slate-800 gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{wit.email} - ৳{wit.amount} ({wit.method})</p>
                          <p className="text-xs text-slate-400">Account: {wit.account} | Status: <span className="text-amber-400">{wit.status}</span></p>
                        </div>
                        {wit.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={async () => {
                                await updateDoc(doc(db, "withdrawals", wit.id), { status: "Approved" });
                                alert("Withdrawal approved!");
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded text-white"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={async () => {
                                await updateDoc(doc(db, "withdrawals", wit.id), { status: "Rejected" });
                                const usrRef = doc(db, "users", wit.uid);
                                const usrSnap = await getDoc(usrRef);
                                if(usrSnap.exists()) {
                                  const currentEarn = usrSnap.data().earningsWallet || 0;
                                  await updateDoc(usrRef, { earningsWallet: currentEarn + wit.amount });
                                }
                                alert("Withdrawal rejected & refunded!");
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded text-white"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* User Management */}
              <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">User Management & Balance Adjustment</h3>
                <div className="space-y-4">
                  {allUsers.length === 0 ? <p className="text-sm text-slate-400">No users found.</p> : 
                    allUsers.map(usr => (
                      <UserAdminRow key={usr.id} usr={usr} db={db} />
                    ))
                  }
                </div>
              </div>

            </div>
          ) : activeTab === 'membership' ? (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">Select Membership Plan</h2>
                <p className="text-xs md:text-sm text-slate-400">Choose a tier that fits your daily availability. Upgrades take effect immediately and quota resets every 24 hours.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg, idx) => (
                  <div key={pkg.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition shadow-xl relative overflow-hidden">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{pkg.desc}</p>
                      
                      <div className="my-6">
                        <span className="text-3xl font-extrabold text-amber-400">৳{pkg.price}</span>
                        <span className="text-xs text-slate-400"> / {pkg.validity}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-6 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Limit</p>
                          <p className="text-sm font-bold text-slate-200 mt-0.5">{pkg.dailyTasks} Tasks</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Potential</p>
                          <p className="text-sm font-bold text-emerald-400 mt-0.5">৳{pkg.dailyPotential}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {pkg.features?.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBuyPackage(pkg)}
                      className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl font-bold text-white text-sm shadow-lg shadow-amber-900/20 transition"
                    >
                      Deposit ৳{pkg.price} to Activate &gt;
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400">🛡️</span>
                  <span>Direct Deposit Verification: Send funds via personal bKash or Nagad to activate packages instantly upon admin transaction validation.</span>
                </div>
                <button onClick={() => setActiveTab('wallet')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg whitespace-nowrap">
                  View Deposit Instructions
                </button>
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center space-x-2">
                <span>👤</span>
                <span>User Profile Settings</span>
              </h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  try {
                    await updateDoc(doc(db, "users", user.uid), {
                      name: profileName,
                      phone: profilePhone
                    });
                    setUserData({ ...userData, name: profileName, phone: profilePhone });
                    alert("Profile updated successfully!");
                  } catch (err) {
                    alert("Error: " + err.message);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileName} 
                      onChange={(e)=>setProfileName(e.target.value)} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Email Address (Cannot be changed)</label>
                    <input 
                      type="email" 
                      disabled 
                      value={user?.email || ''} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Mobile Number</label>
                    <input 
                      type="text" 
                      required
                      value={profilePhone} 
                      onChange={(e)=>setProfilePhone(e.target.value)} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Active Membership Package</label>
                    <input 
                      type="text" 
                      disabled 
                      value={userData?.package || 'No Active Package'} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-sm text-amber-400 cursor-not-allowed font-bold"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm shadow-lg">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'support' ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center space-x-2">
                <span>🎧</span>
                <span>Customer Support</span>
              </h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-center">
                <div className="text-4xl">💬</div>
                <h3 className="text-lg font-bold text-slate-100">Need Help with Deposit or Task?</h3>
                <p className="text-xs text-slate-400">Our support team is available 24/7 to help you out with any payment or account issues.</p>
                <div className="pt-4 space-y-3">
                  <a 
                    href="https://t.me/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-sky-600 hover:bg-sky-700 rounded-xl font-bold text-white text-sm shadow-lg transition"
                  >
                    💬 Join Telegram Support Channel
                  </a>
                  <a 
                    href="https://wa.me/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white text-sm shadow-lg transition"
                  >
                    📱 Contact WhatsApp Support
                  </a>
                </div>
              </div>
            </div>
          ) : activeTab === 'wallet' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center space-x-2">
                <span>💳</span>
                <span>Wallet & Transactions</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-200">Add Deposit</h3>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Send money to our company personal number:</p>
                      <p className="font-bold text-blue-400">{depositMethod}: {gateways[depositMethod.toLowerCase()] || gateways.bkash}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(gateways[depositMethod.toLowerCase()] || gateways.bkash)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs rounded-lg text-white font-medium whitespace-nowrap"
                    >
                      Copy Number
                    </button>
                  </div>
                  <form onSubmit={handleDepositSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Method</label>
                      <select 
                        value={depositMethod} 
                        onChange={(e)=>setDepositMethod(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Binance">Binance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Amount (৳)</label>
                      <input 
                        type="number" 
                        required 
                        value={depositAmount} 
                        onChange={(e)=>setDepositAmount(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Transaction ID (TrxID)</label>
                      <input 
                        type="text" 
                        required 
                        value={depositTrxId} 
                        onChange={(e)=>setDepositTrxId(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm shadow-lg">
                      Submit Deposit
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-200">Request Withdrawal</h3>
                  <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Method</label>
                      <select 
                        value={withdrawMethod} 
                        onChange={(e)=>setWithdrawMethod(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Amount (৳)</label>
                      <input 
                        type="number" 
                        required 
                        value={withdrawAmount} 
                        onChange={(e)=>setWithdrawAmount(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Account Number</label>
                      <input 
                        type="text" 
                        required 
                        value={withdrawAccount} 
                        onChange={(e)=>setWithdrawAccount(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white text-sm shadow-lg">
                      Request Withdraw
                    </button>
                  </form>
                </div>
              </div>

              {/* User History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-200">My Deposit History</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {myDeposits.length === 0 ? <p className="text-xs text-slate-400">No deposit history.</p> :
                      myDeposits.map(d => (
                        <div key={d.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-blue-400">৳{d.amount} ({d.method})</p>
                            <p className="text-slate-400 text-[10px]">TrxID: {d.trxId}</p>
                          </div>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${d.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : d.status === 'Rejected' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                            {d.status}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-200">My Withdrawal History</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {myWithdrawals.length === 0 ? <p className="text-xs text-slate-400">No withdrawal history.</p> :
                      myWithdrawals.map(w => (
                        <div key={w.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-emerald-400">৳{w.amount} ({w.method})</p>
                            <p className="text-slate-400 text-[10px]">Acc: {w.account}</p>
                          </div>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${w.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : w.status === 'Rejected' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                            {w.status}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <span className="text-3xl bg-blue-950 p-3 rounded-xl border border-blue-800">💳</span>
                  <div>
                    <p className="text-xs text-slate-400">{t[lang].depositWallet}</p>
                    <h3 className="text-2xl font-bold text-blue-400 mt-1">৳ {userData ? userData.depositWallet : 0}</h3>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <span className="text-3xl bg-emerald-950 p-3 rounded-xl border border-emerald-800">💰</span>
                  <div>
                    <p className="text-xs text-slate-400">{t[lang].earningsWallet}</p>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">৳ {userData ? userData.earningsWallet : 0}</h3>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <span className="text-3xl bg-amber-950 p-3 rounded-xl border border-amber-800">⭐</span>
                  <div>
                    <p className="text-xs text-slate-400">{t[lang].activePackage}</p>
                    <h3 className="text-base md:text-lg font-bold text-amber-400 mt-1 truncate">
                      {userData?.package ? userData.package : t[lang].noPackage}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Available Tasks (Timer & Link Enabled)</h3>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                      <div>
                        <h4 className="font-medium text-slate-200 text-sm md:text-base">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs text-blue-400 font-semibold">Reward: ৳{task.reward}</span>
                          <span className="text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">⏱️ Timer: {task.timerSec} Seconds</span>
                          <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline hover:text-indigo-300">Visit Link ↗</a>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (!user) { setShowAuthModal(true); return; }
                          if (!userData?.package) {
                            alert("Please activate a membership package first!");
                            setActiveTab('membership');
                            return;
                          }
                          setSelectedTask(task);
                          setTimer(task.timerSec || 25);
                          setTimerActive(true);
                          setTaskCompletedMsg('');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-xl text-white shadow-lg whitespace-nowrap"
                      >
                        Start Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task Timer Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100">{selectedTask.title}</h3>
            <p className="text-xs text-slate-400">Please complete your task. Link: <a href={selectedTask.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{selectedTask.link}</a></p>
            <div className="text-4xl font-mono text-blue-400 font-bold py-4 bg-slate-950 rounded-xl border border-slate-800">
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
            {taskCompletedMsg ? (
              <button 
                onClick={async () => {
                  if(!userData?.package) {
                    alert("Active membership required to collect reward!");
                    setSelectedTask(null);
                    return;
                  }
                  const newEarnings = (userData.earningsWallet || 0) + selectedTask.reward;
                  await updateDoc(doc(db, "users", user.uid), { earningsWallet: newEarnings });
                  setUserData({...userData, earningsWallet: newEarnings});
                  setSelectedTask(null);
                  alert(`Successfully collected ৳${selectedTask.reward}!`);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white shadow-lg"
              >
                Collect Reward (৳{selectedTask.reward})
              </button>
            ) : (
              <p className="text-sm text-slate-400 animate-pulse">Please wait while the task timer completes...</p>
            )}
            <button 
              onClick={() => setSelectedTask(null)}
              className="text-xs text-slate-500 hover:text-slate-300 underline pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100">
              {authMode === 'login' ? 'Sign In to KODA Task' : 'Create New Account'}
            </h3>
            {authError && <p className="text-xs text-red-500">{authError}</p>}
            
            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={fullName} 
                      onChange={(e)=>setFullName(e.target.value)} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Mobile Number</label>
                    <input 
                      type="text" 
                      required 
                      value={phone} 
                      onChange={(e)=>setPhone(e.target.value)} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)} 
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white shadow-lg"
              >
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              {authMode === 'login' ? (
                <p>Don't have an account? <button onClick={()=>setAuthMode('signup')} className="text-blue-400 underline">Sign Up</button></p>
              ) : (
                <p>Already have an account? <button onClick={()=>setAuthMode('login')} className="text-blue-400 underline">Sign In</button></p>
              )}
            </div>

            <button 
              onClick={() => setShowAuthModal(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAdminRow({ usr, db }) {
  const [depWallet, setDepWallet] = useState(usr.depositWallet || 0);
  const [earnWallet, setEarnWallet] = useState(usr.earningsWallet || 0);

  const handleUpdateBalance = async () => {
    try {
      await updateDoc(doc(db, "users", usr.id), {
        depositWallet: Number(depWallet),
        earningsWallet: Number(earnWallet)
      });
      alert(`Wallet updated for ${usr.email}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleBan = async () => {
    const newStatus = usr.status === 'Banned' ? 'Active' : 'Banned';
    try {
      await updateDoc(doc(db, "users", usr.id), { status: newStatus });
      alert(`User status changed to ${newStatus}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <p className="text-sm font-medium text-slate-200">{usr.name} ({usr.email})</p>
          <p className="text-xs text-slate-400">Phone: {usr.phone || 'N/A'} | Status: <span className={usr.status === 'Banned' ? 'text-red-400' : 'text-emerald-400'}>{usr.status || 'Active'}</span></p>
        </div>
        {usr.email !== '1roxi1@gmail.com' && (
          <button 
            onClick={handleToggleBan}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${usr.status === 'Banned' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {usr.status === 'Banned' ? 'Unban' : 'Ban'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center pt-2 border-t border-slate-800">
        <div>
          <label className="text-[10px] text-slate-400">Deposit Wallet (৳)</label>
          <input 
            type="number" 
            value={depWallet} 
            onChange={(e)=>setDepWorkspace ? setDepWallet(e.target.value) : setDepWallet(e.target.value)} 
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400">Earnings Wallet (৳)</label>
          <input 
            type="number" 
            value={earnWallet} 
            onChange={(e)=>setEarnWallet(e.target.value)} 
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>
        <div className="flex items-end h-full pt-1 sm:pt-4">
          <button 
            onClick={handleUpdateBalance}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg text-white shadow"
          >
            Update Balance
          </button>
        </div>
      </div>
    </div>
  );
}
