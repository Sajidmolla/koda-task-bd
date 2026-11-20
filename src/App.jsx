import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Wallet, Users, Settings, LogOut, CheckCircle,
  Copy, Lock, Check, Clock, Award, DollarSign, Send,
  ExternalLink, User, BarChart2, Package, Layers, CreditCard,
  Plus, Trash2, Search, AlertTriangle, RefreshCw, Download, Upload,
  LayoutDashboard, ListTodo, Coins, ArrowDownCircle, ArrowUpCircle, Share2, History
} from 'lucide-react';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('register'); // 'login' or 'register'

  // Auth form inputs
  const [nameInput, setNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Navigation & Theme state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminSection, setAdminSection] = useState('tasks'); // 'tasks', 'billing', 'users', 'packages'
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState('EN');

  // User profile & wallet state
  const [user, setUser] = useState({
    name: '',
    email: '',
    mobile: '',
    depositWallet: 0,
    earningsWallet: 0,
    membership: 'No Active Package',
    activePackage: false,
    tasksCompletedToday: 0,
    dailyLimit: 0,
    referralCode: ''
  });

  const isAdmin = (authUser?.email || user.email) === '1roxi1@gmail.com';
  const [profileNameInput, setProfileNameInput] = useState('');

  // Tasks state (synced with Firestore if available, with clean local fallback)
  const [tasks, setTasks] = useState([
    { id: '1', title: 'YouTube Video Watch & Subscribe', reward: 10, timer: 25, link: 'https://youtube.com', status: 'ACTIVE', category: 'Video' },
    { id: '2', title: 'Facebook Page Follow & Like', reward: 8, timer: 20, link: 'https://facebook.com', status: 'ACTIVE', category: 'Social' },
    { id: '3', title: 'Telegram Channel Join', reward: 5, timer: 15, link: 'https://telegram.org', status: 'ACTIVE', category: 'Community' },
    { id: '4', title: 'App Download & Review', reward: 14, timer: 30, link: 'https://play.google.com', status: 'PENDING', category: 'App' },
    { id: '5', title: 'Website Visit & Read Article', reward: 12, timer: 25, link: 'https://google.com', status: 'ACTIVE', category: 'Web' }
  ]);

  const [completedTaskIds, setCompletedTaskIds] = useState([]);

  // Admin task form inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('10');
  const [newTaskTimer, setNewTaskTimer] = useState('20');
  const [newTaskLink, setNewTaskLink] = useState('https://');
  const [newTaskCategory, setNewTaskCategory] = useState('Social');
  const [newTaskStatus, setNewTaskStatus] = useState('ACTIVE');

  // Timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Deposit & Withdraw states
  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositTarget, setDepositTarget] = useState('Direct Balance');
  const [senderPhone, setSenderPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [depositHistory, setDepositHistory] = useState([]);
  const [depositSuccess, setDepositSuccess] = useState('');

  const [cashoutMethod, setCashoutMethod] = useState('bKash');
  const [cashoutPhone, setCashoutPhone] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutHistory, setCashoutHistory] = useState([]);
  const [cashoutError, setCashoutError] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState('');

  // Admin billing / requests rows
  const [billingRows, setBillingRows] = useState([
    { id: 'REQ002', userName: 'Rashed', type: 'Cashout', amount: 150, method: 'bKash', status: 'OVERDUE', daysLeft: -2 },
    { id: 'REQ003', userName: 'Mim', type: 'Deposit', amount: 200, method: 'Nagad', status: 'DUE SOON', daysLeft: 2 },
    { id: 'REQ001', userName: 'Shohan', type: 'Deposit', amount: 300, method: 'Rocket', status: 'OK', daysLeft: 15 }
  ]);

  // Listen to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              name: data.name || firebaseUser.displayName || 'Member',
              email: firebaseUser.email,
              mobile: data.mobile || 'N/A',
              depositWallet: data.depositWallet ?? 0,
              earningsWallet: data.earningsWallet ?? 0,
              membership: data.membership || (firebaseUser.email === '1roxi1@gmail.com' ? 'Admin Pro' : 'No Active Package'),
              activePackage: data.activePackage ?? (firebaseUser.email === '1roxi1@gmail.com'),
              tasksCompletedToday: data.tasksCompletedToday ?? 0,
              dailyLimit: data.dailyLimit ?? (firebaseUser.email === '1roxi1@gmail.com' ? 50 : 0),
              referralCode: data.referralCode || ('KODA' + firebaseUser.uid.slice(0, 5).toUpperCase())
            });
            setProfileNameInput(data.name || firebaseUser.displayName || 'Member');
          } else {
            const fallbackName = firebaseUser.displayName || (firebaseUser.email === '1roxi1@gmail.com' ? 'Admin 1roxi1' : 'New Member');
            const freshProfile = {
              name: fallbackName,
              email: firebaseUser.email,
              mobile: mobileInput || 'N/A',
              depositWallet: 0,
              earningsWallet: 0,
              membership: firebaseUser.email === '1roxi1@gmail.com' ? 'Admin Pro' : 'No Active Package',
              activePackage: firebaseUser.email === '1roxi1@gmail.com',
              tasksCompletedToday: 0,
              dailyLimit: firebaseUser.email === '1roxi1@gmail.com' ? 50 : 0,
              referralCode: 'KODA' + firebaseUser.uid.slice(0, 5).toUpperCase(),
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, freshProfile, { merge: true });
            setUser(freshProfile);
            setProfileNameInput(fallbackName);
          }
        } catch {
          setUser(prev => ({
            ...prev,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Member'
          }));
        }
      } else {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Realtime Firestore listener for tasks
  useEffect(() => {
    try {
      const q = collection(db, 'tasks');
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasks(list);
        }
      }, () => {
        // Keep local tasks if rules block read
      });
      return () => unsub();
    } catch {
      // fallback
    }
  }, []);

  // Task Countdown Timer
  useEffect(() => {
    let timer;
    if (activeTimerTaskId !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeTimerTaskId !== null) {
      const finishedTask = tasks.find(t => t.id === activeTimerTaskId);
      const rewardAmt = finishedTask ? Number(finishedTask.reward) || 0 : 0;
      setCompletedTaskIds(prev => [...new Set([...prev, activeTimerTaskId])]);
      setUser(prev => {
        const updated = {
          ...prev,
          earningsWallet: Number((prev.earningsWallet + rewardAmt).toFixed(2)),
          tasksCompletedToday: prev.tasksCompletedToday + 1
        };
        if (authUser) {
          updateDoc(doc(db, 'users', authUser.uid), {
            earningsWallet: updated.earningsWallet,
            tasksCompletedToday: updated.tasksCompletedToday
          }).catch(() => {});
        }
        return updated;
      });
      setActiveTimerTaskId(null);
    }
    return () => clearInterval(timer);
  }, [activeTimerTaskId, timeLeft, tasks, authUser]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        if (!nameInput.trim() || !mobileInput.trim()) {
          setAuthError('Please enter your Full Name and Mobile Number.');
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        if (res.user) {
          await updateProfile(res.user, { displayName: nameInput.trim() });
          const newUserDoc = {
            name: nameInput.trim(),
            mobile: mobileInput.trim(),
            email: emailInput.trim(),
            depositWallet: 0,
            earningsWallet: 0,
            membership: 'No Active Package',
            activePackage: false,
            tasksCompletedToday: 0,
            dailyLimit: 0,
            referralCode: 'KODA' + res.user.uid.slice(0, 5).toUpperCase(),
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', res.user.uid), newUserDoc);
          setUser(newUserDoc);
          setProfileNameInput(nameInput.trim());
        }
      } else {
        await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthUser(null);
    setActiveTab('dashboard');
  };

  const startTask = (task) => {
    if (!user.activePackage && !isAdmin) {
      alert('Please activate a membership package first to start earning tasks.');
      setActiveTab('memberships');
      return;
    }
    setActiveTimerTaskId(task.id);
    setTimeLeft(Number(task.timer) || 15);
    if (task.link && task.link !== 'https://') {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const payload = {
      title: newTaskTitle.trim(),
      reward: Number(newTaskReward) || 10,
      timer: Number(newTaskTimer) || 20,
      link: newTaskLink.trim() || 'https://google.com',
      category: newTaskCategory,
      status: newTaskStatus,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'tasks'), payload);
      setTasks(prev => [...prev, { id: docRef.id, ...payload }]);
    } catch {
      setTasks(prev => [...prev, { id: String(Date.now()), ...payload }]);
    }

    setNewTaskTitle('');
    setNewTaskReward('10');
    setNewTaskTimer('20');
    setNewTaskLink('https://');
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', String(id)));
    } catch {
      // ignore if local only
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'tasks', String(task.id)), { status: nextStatus });
    } catch {
      // ignore
    }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
  };

  const handleMarkBillingPaid = (rowId) => {
    setBillingRows(prev => prev.map(r => r.id === rowId ? { ...r, status: 'OK', daysLeft: 30 } : r));
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositTrxId.trim()) return;
    const item = {
      id: 'DEP' + Math.floor(1000 + Math.random() * 9000),
      trxId: depositTrxId.trim().toUpperCase(),
      method: depositMethod,
      senderPhone: senderPhone || '017XXXXXXXX',
      amount: Number(depositAmount) || 0,
      packageTarget: depositTarget,
      status: 'Pending Verification',
      date: new Date().toLocaleDateString()
    };
    setDepositHistory(prev => [item, ...prev]);
    setDepositTrxId('');
    setDepositSuccess('Deposit reference submitted for verification.');
    setTimeout(() => setDepositSuccess(''), 3500);
  };

  const handleCashoutSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(cashoutAmount);
    if (!amt || amt < 100 || amt > 25000) {
      setCashoutError('Cashout amount must be between ৳100 and ৳25,000.');
      return;
    }
    if (amt > user.earningsWallet) {
      setCashoutError('Insufficient earnings wallet balance.');
      return;
    }
    const item = {
      id: 'WDR' + Math.floor(1000 + Math.random() * 9000),
      method: cashoutMethod,
      phone: cashoutPhone,
      gross: amt,
      net: Number((amt * 0.98).toFixed(2)),
      status: 'Processing',
      date: new Date().toLocaleDateString()
    };
    setUser(prev => ({ ...prev, earningsWallet: Number((prev.earningsWallet - amt).toFixed(2)) }));
    setCashoutHistory(prev => [item, ...prev]);
    setCashoutAmount('');
    setCashoutError('');
    setCashoutSuccess('Cashout request submitted.');
    setTimeout(() => setCashoutSuccess(''), 3500);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090B10] text-slate-300 flex items-center justify-center font-mono text-sm">
        Initializing KODA Task BD...
      </div>
    );
  }

  // Authentication Screen (Register requires Name, Mobile, Email, Password; Login requires Email & Password)
  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#090B10] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111520] border border-slate-800/90 rounded-2xl p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">KODA Task BD</h1>
              <p className="text-xs text-slate-400 mt-0.5">Real-time Task & Membership Platform</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              LIVE AUTH
            </span>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-[#090B10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    className="w-full bg-[#090B10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#090B10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#090B10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {authMode === 'login' ? (
              <span>
                New to KODA Task BD?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Register Account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Login Here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filtered tasks for search & status badge filter
  const filteredTasks = tasks.filter(t => {
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && t.status === 'ACTIVE') ||
      (filterStatus === 'Pending' && t.status !== 'ACTIVE');
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeTaskCount = tasks.filter(t => t.status === 'ACTIVE').length;
  const pendingTaskCount = tasks.filter(t => t.status !== 'ACTIVE').length;
  const completedCount = completedTaskIds.length;

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col">
      {/* Top Bar (inspired by dark theme header) */}
      <header className="h-14 border-b border-slate-800/90 bg-[#0D1018]/95 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#141926] border border-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide text-white">KODA Task Pro</span>
          </div>
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Admin Mode
            </span>
          )}
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Tasks: {tasks.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="hidden lg:inline-block px-3 py-1 rounded-lg bg-[#141926] border border-slate-800 text-xs font-mono text-slate-300">
            {new Date().toISOString().slice(0, 10)}
          </span>
          <button
            onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
            className="px-2.5 py-1 rounded-lg bg-[#141926] border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
          >
            {lang}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1 rounded-lg bg-[#141926] border border-slate-800 text-xs font-medium text-slate-200 hover:border-slate-700 flex items-center space-x-1.5"
          >
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span className="max-w-[120px] truncate">{user.name || user.email}</span>
          </button>
        </div>
      </header>

      {/* Main Layout with Left Sidebar + Main Workspace */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar (Navigation + Status Alerts Card) */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Navigation</h2>
                <p className="text-[11px] text-slate-400">Task & wallet controls</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                Online
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'tasks', label: 'Tasks', icon: ListTodo },
                { id: 'memberships', label: 'Memberships', icon: Award },
                { id: 'deposit', label: 'Deposit', icon: ArrowDownCircle },
                { id: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle },
                { id: 'referral', label: 'Referral', icon: Share2 },
                { id: 'history', label: 'History', icon: History },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin Control', icon: Settings }] : [])
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#171C2B] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Icon className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'admin' && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                        ADMIN
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-[#161B29] hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold text-slate-300 hover:text-rose-300 flex items-center justify-center space-x-2 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Alerts / Status Card (inspired by bottom-left card in reference) */}
          <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Task Status</h3>
            </div>
            <p className="text-[11px] text-slate-400">Quick status filter for available tasks</p>

            <button
              onClick={() => { setActiveTab('tasks'); setFilterStatus('Pending'); }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Pending ({pendingTaskCount})</span>
            </button>

            <button
              onClick={() => { setActiveTab('tasks'); setFilterStatus('Active'); }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#171C2B] hover:bg-[#1E2538] border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Active ({activeTaskCount})</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Panel */}
        <main className="lg:col-span-9 space-y-6">
          {(activeTab === 'dashboard' || activeTab === 'tasks') && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              {/* Header + Filter + Search (matches Billing header bar in reference) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {activeTab === 'dashboard' ? 'Overview & Active Tasks' : 'Tasks Directory'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Complete timed tasks to credit your Earnings Wallet automatically
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#090B10] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                  </select>

                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search task..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#090B10] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-52"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Summary Counter Cards (inspired by Total / Overdue / Due Soon / OK cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Earnings Wallet</span>
                  <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                    ৳{user.earningsWallet.toFixed(0)}
                  </span>
                </div>

                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Deposit Wallet</span>
                  <span className="text-xl font-extrabold text-amber-400 font-mono mt-1 block">
                    ৳{user.depositWallet.toFixed(0)}
                  </span>
                </div>

                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Available Tasks</span>
                  <span className="text-xl font-extrabold text-indigo-400 font-mono mt-1 block">
                    {filteredTasks.length}
                  </span>
                </div>

                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Completed</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1 block">
                    {completedCount}
                  </span>
                </div>
              </div>

              {/* Tasks Table / List (styled cleanly with status pills and action buttons) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Task</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Timer</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Reward & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredTasks.map((task) => {
                      const isDone = completedTaskIds.includes(task.id);
                      const isRunning = activeTimerTaskId === task.id;
                      return (
                        <tr key={task.id} className="hover:bg-[#151A28]/60 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-white">{task.title}</div>
                            {task.link && task.link !== 'https://' && (
                              <a
                                href={task.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:underline mt-0.5"
                              >
                                <span>Visit Link</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 font-mono">
                            {task.category || 'General'}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-300">
                            {isRunning ? `${timeLeft}s` : `${task.timer}s`}
                          </td>
                          <td className="py-3.5 px-3">
                            {isDone ? (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                DONE
                              </span>
                            ) : task.status === 'ACTIVE' ? (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center space-x-3">
                              <span className="font-mono font-bold text-slate-200">৳{task.reward}</span>
                              {isDone ? (
                                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
                                  Paid
                                </span>
                              ) : isRunning ? (
                                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold">
                                  {timeLeft}s left
                                </span>
                              ) : (
                                <button
                                  onClick={() => startTask(task)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                                >
                                  Start
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin Control Panel (Visible ONLY when logged in as 1roxi1@gmail.com) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Control Panel</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize tasks, rewards, timers, target links, and user finance approvals
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {[
                    { id: 'tasks', label: 'Tasks Manager' },
                    { id: 'billing', label: 'Requests & Billing' },
                    { id: 'packages', label: 'Packages' }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setAdminSection(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        adminSection === sec.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#090B10] text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {adminSection === 'tasks' && (
                <div className="space-y-6">
                  {/* Add Custom Task Form */}
                  <form onSubmit={handleAddTask} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-emerald-400" />
                      <span>Create New Custom Task</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">Task Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Watch Promo Video"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Reward (৳)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={newTaskReward}
                          onChange={(e) => setNewTaskReward(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Timer (Sec)</label>
                        <input
                          type="number"
                          required
                          min="5"
                          value={newTaskTimer}
                          onChange={(e) => setNewTaskTimer(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                        <select
                          value={newTaskStatus}
                          onChange={(e) => setNewTaskStatus(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                        <input
                          type="text"
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-[11px] text-slate-400 mb-1">Task Link / URL</label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com"
                          value={newTaskLink}
                          onChange={(e) => setNewTaskLink(e.target.value)}
                          className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Configured Tasks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">Title & Link</th>
                          <th className="py-3 px-3">Timer</th>
                          <th className="py-3 px-3">Reward</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {tasks.map(t => (
                          <tr key={t.id} className="hover:bg-[#151A28]/60">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white">{t.title}</div>
                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{t.link}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">{t.timer}s</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">৳{t.reward}</td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleTaskStatus(t)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                  t.status === 'ACTIVE'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {t.status}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                title="Delete Task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminSection === 'billing' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Amount & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {billingRows.map(r => (
                        <tr key={r.id} className="hover:bg-[#151A28]/60">
                          <td className="py-3 px-3 font-mono text-slate-300">{r.id}</td>
                          <td className="py-3 px-3 font-semibold text-white">{r.userName}</td>
                          <td className="py-3 px-3 text-slate-400">{r.type} ({r.method})</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              r.status === 'OK'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : r.status === 'DUE SOON'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <span className="font-mono font-bold text-white">৳{r.amount}</span>
                              {r.status !== 'OK' && (
                                <button
                                  onClick={() => handleMarkBillingPaid(r.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {adminSection === 'packages' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Basic Starter', price: 500, limit: '5 Tasks/day' },
                    { name: 'Standard Pro', price: 1200, limit: '10 Tasks/day' },
                    { name: 'Premium Booster', price: 2500, limit: '18 Tasks/day' },
                    { name: 'VIP Master Elite', price: 5000, limit: '30 Tasks/day' }
                  ].map((p, idx) => (
                    <div key={idx} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{p.limit}</div>
                      </div>
                      <span className="text-base font-extrabold text-amber-400 font-mono">৳{p.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Memberships Tab */}
          {activeTab === 'memberships' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-bold text-white">Membership Plans</h2>
                <p className="text-xs text-slate-400 mt-0.5">Activate a plan to unlock daily earning tasks</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Basic Starter', price: 500, days: 30, quota: 5 },
                  { name: 'Standard Pro', price: 1200, days: 30, quota: 10 },
                  { name: 'Premium Booster', price: 2500, days: 45, quota: 18 },
                  { name: 'VIP Master Elite', price: 5000, days: 60, quota: 30 }
                ].map((pkg, i) => (
                  <div key={i} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">{pkg.name}</h3>
                        <span className="text-lg font-extrabold text-amber-400 font-mono">৳{pkg.price}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{pkg.quota} Daily Tasks • {pkg.days} Days Validity</p>
                    </div>
                    <button
                      onClick={() => {
                        setUser(prev => ({ ...prev, membership: pkg.name, activePackage: true, dailyLimit: pkg.quota }));
                        setActiveTab('tasks');
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                    >
                      Activate {pkg.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-bold text-white">Deposit Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Send via bKash / Nagad / Rocket and submit TrxID</p>
              </div>
              {depositSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  {depositSuccess}
                </div>
              )}
              <form onSubmit={handleDepositSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Method</label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sender Number</label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Transaction ID (TrxID)</label>
                  <input
                    type="text"
                    required
                    placeholder="TX987654"
                    value={depositTrxId}
                    onChange={(e) => setDepositTrxId(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Submit Deposit Reference
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 max-w-2xl">
              <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Withdraw Earnings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Min ৳100 • Max ৳25,000</p>
                </div>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  ৳{user.earningsWallet.toFixed(2)}
                </span>
              </div>
              {cashoutError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {cashoutError}
                </div>
              )}
              {cashoutSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  {cashoutSuccess}
                </div>
              )}
              <form onSubmit={handleCashoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Recipient Number</label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={cashoutPhone}
                    onChange={(e) => setCashoutPhone(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Request Withdrawal
                </button>
              </form>
            </div>
          )}

          {/* Referral Tab */}
          {activeTab === 'referral' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Referral Code</h2>
              <div className="bg-[#0D1018] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-indigo-400">{user.referralCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(user.referralCode)}
                  className="px-3 py-1.5 rounded-lg bg-[#161B29] border border-slate-800 text-xs text-slate-200 flex items-center space-x-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Activity History</h2>
              <p className="text-xs text-slate-400">
                Deposits: {depositHistory.length} • Withdrawals: {cashoutHistory.length} • Completed Tasks: {completedTaskIds.length}
              </p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4 max-w-xl">
              <h2 className="text-lg font-bold text-white">Account Profile</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="text"
                    disabled
                    value={user.email}
                    className="w-full bg-[#090B10] border border-slate-800/70 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
                  />
                </div>
                <button
                  onClick={() => setUser(prev => ({ ...prev, name: profileNameInput }))}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Name
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
