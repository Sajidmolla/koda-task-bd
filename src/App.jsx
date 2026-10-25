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
  const [adminSubTab, setAdminSubTab] = useState('overview');
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

  // Deposit gateway states matching screenshot design
  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [targetTier, setTargetTier] = useState('Direct Balance Credit (No Auto-Package)');
  
  // Withdrawal gateway states
  const [withdrawMethod, setWithdrawMethod] = useState('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  // Gateways & Config synced with Firestore
  const [gateways, setGateways] = useState({
    bkash: "01737966207",
    nagad: "01737966207",
    rocket: "01737966207",
    binance: "KODA-PAY-USDT-ID",
    minWithdraw: 100
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
  const [userSearchQuery, setUserSearchQuery] = useState('');

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
      wallet: "Wallet",
      membership: "Memberships",
      deposit: "Deposit",
      withdraw: "Withdraw",
      history: "History",
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
      wallet: "ওয়ালেট",
      membership: "মেম্বারশিপ",
      deposit: "ডিপোজিট",
      withdraw: "উইথড্র",
      history: "হিস্ট্রি",
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
    const unsubGateways = onSnapshot(doc(db, "settings", "gateways"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGateways(prev => ({ ...prev, ...data }));
      } else {
        setDoc(doc(db, "settings", "gateways"), {
          bkash: "01737966207",
          nagad: "01737966207",
          rocket: "01737966207",
          binance: "KODA-PAY-USDT-ID",
          minWithdraw: 100
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
      alert("Payment gateways and minimum withdrawal updated successfully!");
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
        targetTier: targetTier,
        status: "Pending",
        timestamp: serverTimestamp()
      });
      alert("Deposit reference submitted successfully! Admin will verify and credit soon.");
      setDepositAmount('');
      setDepositTrxId('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const minW = Number(gateways.minWithdraw) || 100;
    if (!amount || !withdrawAccount) return;
    if (amount < minW) {
      alert(`Minimum withdrawal is ৳${minW}.`);
      return;
    }
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
        payoutTrxId: "—",
        adminNote: "Pending review",
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
      setActiveTab('deposit');
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

  const tabs = [
    { id: 'dashboard', label: t[lang].dashboard },
    { id: 'tasks', label: t[lang].tasks },
    { id: 'membership', label: t[lang].membership },
    { id: 'deposit', label: t[lang].deposit },
    { id: 'withdraw', label: t[lang].withdraw },
    { id: 'history', label: t[lang].history },
  ];

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.phone?.includes(userSearchQuery)
  );

  const pendingDepositsCount = allDeposits.filter(d => d.status === 'Pending').length;
  const pendingWithdrawalsCount = allWithdrawals.filter(w => w.status === 'Pending').length;
  const totalPendingFinance = pendingDepositsCount + pendingWithdrawalsCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between w-full overflow-x-hidden">
      <div className="w-full">
        {/* Top Header fully responsive & wrapped for mobile */}
        <header className="bg-slate-900 border-b border-slate-800 px-3 md:px-8 py-3 sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 w-full">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-blue-400 tracking-wide">{t[lang].brand}</h1>
                <p className="text-[10px] text-slate-400">{t[lang].subBrand}</p>
              </div>
              <div className="flex items-center space-x-2 md:hidden">
                <button 
                  onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-semibold border border-slate-700"
                >
                  {lang === 'en' ? 'বাংলা' : 'English'}
                </button>
                {user ? (
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700"
                  >
                    👤
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 py-1 bg-blue-600 text-xs font-semibold rounded-lg text-white"
                  >
                    {t[lang].login}
                  </button>
                )}
              </div>
            </div>

            {/* Fully responsive wrapped/scrollable navigation tabs for mobile */}
            <nav className="flex items-center space-x-1 md:space-x-4 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none flex-nowrap md:flex-wrap justify-start md:justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-2.5 md:px-3 py-2 text-xs md:text-sm font-medium transition whitespace-nowrap rounded-lg ${isActive ? 'bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`relative px-2.5 md:px-3 py-2 text-xs md:text-sm font-medium transition whitespace-nowrap rounded-lg ${activeTab === 'admin' ? 'bg-indigo-950 text-indigo-400 font-semibold border border-indigo-500/30' : 'text-indigo-400/80 hover:text-indigo-300 hover:bg-slate-800/50'}`}
                >
                  ⚙️ {t[lang].adminPanel}
                </button>
              )}
            </nav>

            {/* Right side desktop user actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button 
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-semibold border border-slate-700"
              >
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition"
                  >
                    <span className="text-base">👤</span>
                    <span className="text-xs text-slate-200 font-medium truncate max-w-[100px]">
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg text-white shadow-lg"
                >
                  {t[lang].login} / {t[lang].signup}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3 md:p-8 bg-slate-950 overflow-y-auto max-w-7xl mx-auto w-full">
          {isAdmin && activeTab === 'admin' ? (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-indigo-400">Admin Control Panel</h2>
              
              {/* Admin Sub-Tabs matching user screenshot style */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <button
                  onClick={() => setAdminSubTab('overview')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${adminSubTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  📊 Overview
                </button>
                <button
                  onClick={() => setAdminSubTab('finance')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition relative ${adminSubTab === 'finance' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  💳 Finance {totalPendingFinance > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] rounded-full font-bold">{totalPendingFinance}</span>}
                </button>
                <button
                  onClick={() => setAdminSubTab('packages')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${adminSubTab === 'packages' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  📦 Packages
                </button>
                <button
                  onClick={() => setAdminSubTab('tasks')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${adminSubTab === 'tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  ✨ Tasks
                </button>
                <button
                  onClick={() => setAdminSubTab('users')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${adminSubTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  👤 Users
                </button>
                <button
                  onClick={() => setAdminSubTab('gateways')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition ${adminSubTab === 'gateways' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  ⚙️ Gateways
                </button>
              </div>

              {/* Sub-Tab 1: Overview */}
              {adminSubTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Total Registered Users</p>
                    <h3 className="text-3xl font-extrabold text-blue-400 mt-2">{allUsers.length}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Pending Deposit Requests</p>
                    <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{pendingDepositsCount}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Pending Withdrawal Requests</p>
                    <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{pendingWithdrawalsCount}</h3>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Active Task Synthesizer</p>
                    <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">{tasks.length} Tasks</h3>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Finance & TrxID Verification */}
              {adminSubTab === 'finance' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-4">
                    <h3 className="text-lg font-semibold text-slate-200">Deposit Verification & Audits</h3>
                    <div className="space-y-3">
                      {allDeposits.length === 0 ? <p className="text-xs text-slate-400">No deposit requests.</p> : 
                        allDeposits.map(dep => (
                          <div key={dep.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-200">{dep.email} - ৳{dep.amount} ({dep.method}) [Target: {dep.targetTier || 'Direct Credit'}]</p>
                              <p className="text-xs text-slate-400">TrxID: <span className="text-blue-400 font-mono">{dep.trxId}</span> | Status: <span className="text-amber-400">{dep.status}</span></p>
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
                                  alert("Deposit approved and credited!");
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded-lg text-white shadow"
                              >
                                Approve Deposit
                              </button>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-4">
                    <h3 className="text-lg font-semibold text-slate-200">Withdrawal Audit & Payouts</h3>
                    <div className="space-y-3">
                      {allWithdrawals.length === 0 ? <p className="text-xs text-slate-400">No withdrawal requests.</p> : 
                        allWithdrawals.map(wit => (
                          <div key={wit.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-200">{wit.email} - ৳{wit.amount} ({wit.method})</p>
                              <p className="text-xs text-slate-400">Account: <span className="text-emerald-400 font-mono">{wit.account}</span> | Status: <span className="text-amber-400">{wit.status}</span></p>
                            </div>
                            
                            {/* Admin inputs for Payout TrxID and Admin Note */}
                            {wit.status === 'Pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                                <input 
                                  type="text" 
                                  placeholder="Payout TrxID (e.g. PAY-12345)"
                                  id={`trx-${wit.id}`}
                                  defaultValue={`PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`}
                                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white w-full sm:w-48 font-mono"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Note (e.g. Dispatched via bKash)"
                                  id={`note-${wit.id}`}
                                  defaultValue={`Dispatched via ${wit.method}`}
                                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white w-full sm:w-48"
                                />
                                <button 
                                  onClick={async () => {
                                    const trxInput = document.getElementById(`trx-${wit.id}`).value;
                                    const noteInput = document.getElementById(`note-${wit.id}`).value;
                                    await updateDoc(doc(db, "withdrawals", wit.id), { 
                                      status: "Approved",
                                      payoutTrxId: trxInput || "PAY-VERIFIED",
                                      adminNote: noteInput || `Dispatched via ${wit.method}`
                                    });
                                    alert("Withdrawal approved!");
                                  }}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded-lg text-white whitespace-nowrap"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, "withdrawals", wit.id), { 
                                      status: "Rejected",
                                      payoutTrxId: "—",
                                      adminNote: "Rejected by admin"
                                    });
                                    const usrRef = doc(db, "users", wit.uid);
                                    const usrSnap = await getDoc(usrRef);
                                    if(usrSnap.exists()) {
                                      const currentEarn = usrSnap.data().earningsWallet || 0;
                                      await updateDoc(usrRef, { earningsWallet: currentEarn + wit.amount });
                                    }
                                    alert("Withdrawal rejected & refunded!");
                                  }}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-lg text-white whitespace-nowrap"
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
                </div>
              )}

              {/* Sub-Tab 3: Packages */}
              {adminSubTab === 'packages' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <h3 className="text-lg font-semibold text-slate-200">Manage Membership Packages</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="Package Name" 
                      value={newPkgName} 
                      onChange={(e)=>setNewPkgName(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="Price (৳)" 
                      value={newPkgPrice} 
                      onChange={(e)=>setNewPkgPrice(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Validity (e.g. 30 Days)" 
                      value={newPkgValidity} 
                      onChange={(e)=>setNewPkgValidity(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="Daily Tasks Limit" 
                      value={newPkgTasks} 
                      onChange={(e)=>setNewPkgTasks(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="Daily Potential (৳)" 
                      value={newPkgPotential} 
                      onChange={(e)=>setNewPkgPotential(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
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
                      className="py-3 bg-amber-600 hover:bg-amber-700 text-sm font-bold rounded-xl text-white shadow"
                    >
                      Add Membership Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-amber-400">{pkg.name} — ৳{pkg.price} / {pkg.validity}</h4>
                          <p className="text-xs text-slate-300 mt-1">Limit: {pkg.dailyTasks} Tasks | Potential: ৳{pkg.dailyPotential}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setPackages(packages.filter(p => p.id !== pkg.id));
                            alert("Package removed!");
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-lg text-white"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 4: Tasks & Task Synthesizer */}
              {adminSubTab === 'tasks' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-200">Tasks & Task Synthesizer (Link & Timer Adjustable)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input 
                      type="text" 
                      placeholder="Task Title" 
                      value={newTaskTitle} 
                      onChange={(e)=>setNewTaskTitle(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="Reward (৳)" 
                      value={newTaskReward} 
                      onChange={(e)=>setNewTaskReward(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Task Link URL" 
                      value={newTaskLink} 
                      onChange={(e)=>setNewTaskLink(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        placeholder="Timer (Sec)" 
                        value={newTaskTimer} 
                        onChange={(e)=>setNewTaskTimer(e.target.value)} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
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
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-sm font-bold rounded-xl text-white whitespace-nowrap shadow"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    {tasks.map(task => (
                      <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{task.title}</p>
                          <p className="text-xs text-blue-400">Reward: ৳{task.reward} | Timer: {task.timerSec}s | Link: {task.link}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setTasks(tasks.filter(t => t.id !== task.id));
                            alert("Task removed!");
                          }}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-lg text-white"
                        >
                          Delete Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 5: User Control (Matching user screenshot style) */}
              {adminSubTab === 'users' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200">Registered Users ({filteredUsers.length})</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Adjust wallet balances, inspect packages, or toggle account suspension.</p>
                    </div>
                    <div className="w-full sm:w-72">
                      <input 
                        type="text" 
                        placeholder="🔍 Search name, phone, email..." 
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {filteredUsers.length === 0 ? <p className="text-xs text-slate-500 text-center py-6">No users found.</p> : 
                      filteredUsers.map(usr => (
                        <UserAdminRow key={usr.id} usr={usr} db={db} />
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Sub-Tab 6: Payment Numbers & Limits */}
              {adminSubTab === 'gateways' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <h3 className="text-lg font-semibold mb-2 text-slate-200">Payment Numbers & Withdrawal Limits</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-400">bKash Personal</label>
                      <div className="flex mt-1 space-x-2">
                        <input 
                          type="text" 
                          value={gateways.bkash} 
                          onChange={(e)=>setGateways({...gateways, bkash: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Nagad Personal</label>
                      <div className="flex mt-1 space-x-2">
                        <input 
                          type="text" 
                          value={gateways.nagad} 
                          onChange={(e)=>setGateways({...gateways, nagad: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rocket Personal</label>
                      <div className="flex mt-1 space-x-2">
                        <input 
                          type="text" 
                          value={gateways.rocket} 
                          onChange={(e)=>setGateways({...gateways, rocket: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Binance ID</label>
                      <div className="flex mt-1 space-x-2">
                        <input 
                          type="text" 
                          value={gateways.binance} 
                          onChange={(e)=>setGateways({...gateways, binance: e.target.value})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Minimum Withdrawal (৳)</label>
                      <div className="flex mt-1 space-x-2">
                        <input 
                          type="number" 
                          value={gateways.minWithdraw} 
                          onChange={(e)=>setGateways({...gateways, minWithdraw: Number(e.target.value)})} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveGateways}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-sm font-bold rounded-xl text-white shadow-lg"
                  >
                    Save All Payment Settings
                  </button>
                </div>
              )}

            </div>
          ) : activeTab === 'dashboard' ? (
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
          ) : activeTab === 'tasks' ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Available Tasks</h3>
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
                <button onClick={() => setActiveTab('deposit')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg whitespace-nowrap">
                  View Deposit Instructions
                </button>
              </div>
            </div>
          ) : activeTab === 'deposit' ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <p className="text-xs text-blue-400 font-medium">Manual Gateway • Personal Account Verification • Deduplication Indexed</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide mt-1">Deposit Verification Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Transfer to our verified personal line, submit your Transaction ID (TrxID), and balance or package will be credited automatically.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Select Provider & Official Number */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2 font-medium">1. Select Financial Provider</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['bKash', 'Nagad', 'Rocket'].map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setDepositMethod(m)}
                          className={`py-3 text-xs font-semibold rounded-xl border transition flex flex-col items-center justify-center space-y-1 ${depositMethod === m ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        >
                          <span className="font-bold">{m}</span>
                          <span className="text-[10px] opacity-75">Personal</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Official {depositMethod} Personal Line:</span>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                        <span>●</span>
                        <span>Verified Active</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-lg md:text-xl font-extrabold font-mono text-white tracking-wider">
                        {gateways[depositMethod.toLowerCase()] || gateways.bkash}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(gateways[depositMethod.toLowerCase()] || gateways.bkash)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-white font-medium flex items-center space-x-1 border border-slate-700"
                      >
                        <span>📋</span>
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <p className="text-slate-300 font-semibold mb-1">Instructions:</p>
                    <p>01. Open your {depositMethod} App and choose <strong className="text-slate-200">Send Money</strong>.</p>
                    <p>02. Send exact amount to <strong className="text-blue-400 font-mono">{gateways[depositMethod.toLowerCase()] || gateways.bkash}</strong>.</p>
                    <p>03. Copy the returned <strong className="text-slate-200">Transaction ID (TrxID)</strong> and complete the verification form on the right.</p>
                  </div>
                </div>

                {/* Right Column: Submit Reference Form */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <form onSubmit={handleDepositSubmit} className="space-y-5">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">2. Submit Transaction Reference</label>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Target Membership Tier (Optional)</label>
                      <select
                        value={targetTier}
                        onChange={(e) => setTargetTier(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Direct Balance Credit (No Auto-Package)">Direct Balance Credit (No Auto-Package)</option>
                        {packages.map(p => (
                          <option key={p.id} value={`${p.name} — ৳${p.price}`}>
                            {p.name} — ৳{p.price} ({p.dailyTasks} Daily Tasks)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Deposit Amount (BDT) *</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="e.g. 500"
                        value={depositAmount} 
                        onChange={(e)=>setDepositAmount(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Transaction ID (TrxID) *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. 9N87A65B43"
                        value={depositTrxId} 
                        onChange={(e)=>setDepositTrxId(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-bold text-white text-sm shadow-lg shadow-emerald-900/20 transition flex items-center justify-center space-x-2">
                      <span>🛡️ Submit Deposit Reference</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Deposit Audit Log matching screenshot */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Deposit Audit Log</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {myDeposits.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No deposits recorded yet.
                    </div>
                  ) : (
                    myDeposits.map(d => (
                      <div key={d.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-blue-400">৳{d.amount} ({d.method})</p>
                          <p className="text-slate-400 text-[10px]">TrxID: {d.trxId} | Target: {d.targetTier || 'Direct Credit'}</p>
                        </div>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${d.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : d.status === 'Rejected' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                          {d.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'withdraw' ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <p className="text-xs text-blue-400 font-medium">Mobile Banking Disbursement • bKash / Nagad / Rocket • Zero Unjustified Holds</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide mt-1">Wallet Cashout Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Transfer earnings directly to your personal mobile banking account. Requests are audited and settled with verifiable reference IDs.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Available Wallet Balance</span>
                    <span className="text-2xl font-extrabold text-white">৳{(userData?.earningsWallet || 0).toFixed(2)}</span>
                  </div>

                  <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Payout Provider</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['bKash', 'Nagad', 'Rocket'].map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setWithdrawMethod(m)}
                            className={`py-2.5 text-xs font-semibold rounded-xl border transition ${withdrawMethod === m ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Personal Recipient Mobile Number *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="01700000000"
                        value={withdrawAccount} 
                        onChange={(e)=>setWithdrawAccount(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cashout Amount (BDT) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder={`Min ৳${gateways.minWithdraw || 100}, Max ৳25000`}
                        value={withdrawAmount} 
                        onChange={(e)=>setWithdrawAmount(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Requested Gross:</span>
                        <span className="text-white font-mono">৳{Number(withdrawAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Processing Fee (0%):</span>
                        <span className="text-red-400 font-mono">-৳0.00</span>
                      </div>
                      <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-slate-800">
                        <span>Net Receivable:</span>
                        <span className="text-emerald-400 font-mono text-sm">৳{Number(withdrawAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 rounded-xl font-bold text-white text-sm shadow-lg shadow-blue-900/20 transition flex items-center justify-center space-x-2">
                      <span>↗ Submit Cashout Request</span>
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 h-fit">
                  <div className="flex items-center space-x-2 text-blue-400 text-sm font-semibold border-b border-slate-800 pb-3">
                    <span>🛡️</span>
                    <span>WITHDRAWAL TERMS</span>
                  </div>
                  
                  <div className="space-y-4 text-xs text-slate-400">
                    <div>
                      <p className="font-bold text-slate-200 mb-0.5">Threshold Policy</p>
                      <p>Minimum withdrawal is ৳{gateways.minWithdraw || 100}. Requests below this threshold cannot be processed.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 mb-0.5">Escrow & Refund Safety</p>
                      <p>Funds are held safely in escrow during verification. In the rare event of rejection, funds return immediately to your balance.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 mb-0.5">Reference ID Tracking</p>
                      <p>Every payout is logged with a verifiable TrxID accessible in your audit log below.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Audit Log matching screenshot design exactly */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-slate-200">Withdrawal Audit Log</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Gross</th>
                        <th className="py-3 px-4">Net Disbursed</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payout TrxID</th>
                        <th className="py-3 px-4">Admin Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {myWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-500 font-sans">
                            No withdrawal requests logged yet.
                          </td>
                        </tr>
                      ) : (
                        myWithdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-slate-950/50 transition">
                            <td className="py-3.5 px-4 text-white font-bold">৳{Number(w.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-cyan-400 font-bold">৳{Number(w.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-4 font-sans font-semibold">
                              <span className={`${w.status === 'Approved' ? 'text-emerald-400' : w.status === 'Rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{w.payoutTrxId || '—'}</td>
                            <td className="py-3.5 px-4 text-slate-400 font-sans">{w.adminNote || 'Pending review'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400">Transaction History Log</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-slate-200">Deposit History</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
                  <h3 className="text-lg font-semibold text-slate-200">Withdrawal History</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
                    href="https://t.me/Yours_support_admin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-sky-600 hover:bg-sky-700 rounded-xl font-bold text-white text-sm shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <span>✈️</span>
                    <span>Join Telegram Support (t.me/Yours_support_admin)</span>
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Professional Footer matching user screenshot with Telegram button */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 md:px-8 mt-12 text-xs text-slate-400 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-center md:text-left justify-center md:justify-start">
            <span className="font-bold text-blue-400 text-sm">KODA Task</span>
            <span className="hidden sm:inline">•</span>
            <span>Task-Based Earning Platform</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span>🛡️</span>
              <span>Personal Deposit Verification</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a 
              href="https://t.me/Yours_support_admin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow transition"
            >
              <span>✈️</span>
              <span>Telegram Support</span>
            </a>
            <span className="text-slate-500">© 2026 KODA Task</span>
          </div>
        </div>
      </footer>

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
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white shadow-lg"
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
          <p className="text-sm font-medium text-slate-200">{usr.name || 'No Name'} ({usr.email})</p>
          <p className="text-xs text-slate-400">Phone: {usr.phone || 'N/A'} | Package: <span className="text-amber-400">{usr.package || 'None'}</span> | Status: <span className={usr.status === 'Banned' ? 'text-red-400' : 'text-emerald-400'}>{usr.status || 'Active'}</span></p>
        </div>
        {usr.email !== '1roxi1@gmail.com' && (
          <button 
            onClick={handleToggleBan}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${usr.status === 'Banned' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {usr.status === 'Banned' ? 'Unban User' : 'Ban User'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-3 border-t border-slate-800">
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider">Deposit Wallet (৳)</label>
          <input 
            type="number" 
            value={depWallet} 
            onChange={(e)=>setDepWallet(e.target.value)} 
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider">Earnings Wallet (৳)</label>
          <input 
            type="number" 
            value= {earnWallet} 
            onChange={(e)=>setEarnWallet(e.target.value)} 
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>
        <div className="flex items-end h-full pt-1 sm:pt-4">
          <button 
            onClick={handleUpdateButtonHandler => handleUpdateBalance()}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg text-white shadow"
          >
            Update Balances
          </button>
        </div>
      </div>
    </div>
  );
}
