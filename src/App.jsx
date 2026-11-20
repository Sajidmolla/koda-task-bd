import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Wallet, Users, Settings, LogOut, CheckCircle,
  Copy, Lock, Clock, Award, DollarSign, ExternalLink, User,
  BarChart2, Package, Layers, CreditCard, Plus, Trash2, Search,
  AlertTriangle, LayoutDashboard, ListTodo, ArrowDownCircle,
  ArrowUpCircle, Share2, History, Edit3, Check
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
  query,
  where
} from 'firebase/firestore';

const ADMIN_EMAIL = '1roxi1@gmail.com';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'

  // Registration & Login fields (Register asks for Name, Mobile, Email, Password)
  const [nameInput, setNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminSubTab, setAdminSubTab] = useState('tasks');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState('EN');

  // Fresh real user state (no old/mock user data)
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
    referralCode: '',
    completedTasks: {}
  });

  const isAdmin = (authUser?.email || user.email) === ADMIN_EMAIL;
  const [profileNameInput, setProfileNameInput] = useState('');

  // Customizable Tasks state (synced with Firestore 'tasks' collection)
  const [tasks, setTasks] = useState([
    { id: '1', title: 'YouTube Video Watch & Subscribe', reward: 10, timer: 25, link: 'https://youtube.com', category: 'Video', status: 'ACTIVE' },
    { id: '2', title: 'Facebook Page Follow & Like', reward: 8, timer: 20, link: 'https://facebook.com', category: 'Social', status: 'ACTIVE' },
    { id: '3', title: 'Telegram Channel Join', reward: 5, timer: 15, link: 'https://telegram.org', category: 'Community', status: 'ACTIVE' },
    { id: '4', title: 'App Download & Review', reward: 14, timer: 30, link: 'https://play.google.com', category: 'App', status: 'PENDING' },
    { id: '5', title: 'Website Visit & Read Article', reward: 12, timer: 25, link: 'https://google.com', category: 'Web', status: 'ACTIVE' }
  ]);

  // Admin task form states (Add or Edit Title, Reward, Timer, Link, Category, Status)
  const [editingTaskId, setEditingTaskId] = useState(null);
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
  const [myDeposits, setMyDeposits] = useState([]);
  const [depositSuccess, setDepositSuccess] = useState('');

  const [cashoutMethod, setCashoutMethod] = useState('bKash');
  const [cashoutPhone, setCashoutPhone] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [cashoutError, setCashoutError] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState('');

  // Admin collections (only loaded when isAdmin is true)
  const [allUsers, setAllUsers] = useState([]);
  const [allDeposits, setAllDeposits] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);

  // Monitor Firebase Auth & User Profile
  useEffect(() => {
    let unsubUserDoc = null;
    let unsubDep = null;
    let unsubWit = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubDep) unsubDep();
      if (unsubWit) unsubWit();

      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'Banned') {
              alert('Your account has been suspended by admin.');
              await signOut(auth);
              setAuthUser(null);
              setAuthLoading(false);
              return;
            }
            const loadedUser = {
              name: data.name || firebaseUser.displayName || (firebaseUser.email === ADMIN_EMAIL ? 'Admin' : 'Member'),
              email: firebaseUser.email,
              mobile: data.mobile || 'N/A',
              depositWallet: Number(data.depositWallet ?? 0),
              earningsWallet: Number(data.earningsWallet ?? 0),
              membership: data.membership || (firebaseUser.email === ADMIN_EMAIL ? 'Admin Access' : 'No Active Package'),
              activePackage: Boolean(data.activePackage ?? (firebaseUser.email === ADMIN_EMAIL)),
              tasksCompletedToday: Number(data.tasksCompletedToday ?? 0),
              dailyLimit: Number(data.dailyLimit ?? (firebaseUser.email === ADMIN_EMAIL ? 100 : 0)),
              referralCode: data.referralCode || ('KODA' + firebaseUser.uid.slice(0, 5).toUpperCase()),
              completedTasks: data.completedTasks || {}
            };
            setUser(loadedUser);
            setProfileNameInput(loadedUser.name);
          } else {
            const freshName = firebaseUser.displayName || nameInput.trim() || (firebaseUser.email === ADMIN_EMAIL ? 'Admin' : 'Member');
            const freshProfile = {
              name: freshName,
              email: firebaseUser.email,
              mobile: mobileInput.trim() || 'N/A',
              depositWallet: 0,
              earningsWallet: 0,
              membership: firebaseUser.email === ADMIN_EMAIL ? 'Admin Access' : 'No Active Package',
              activePackage: firebaseUser.email === ADMIN_EMAIL,
              tasksCompletedToday: 0,
              dailyLimit: firebaseUser.email === ADMIN_EMAIL ? 100 : 0,
              referralCode: 'KODA' + firebaseUser.uid.slice(0, 5).toUpperCase(),
              status: 'Active',
              completedTasks: {},
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, freshProfile, { merge: true });
            setUser(freshProfile);
            setProfileNameInput(freshName);
          }

          unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const d = docSnap.data();
              setUser(prev => ({
                ...prev,
                name: d.name ?? prev.name,
                mobile: d.mobile ?? prev.mobile,
                depositWallet: Number(d.depositWallet ?? prev.depositWallet),
                earningsWallet: Number(d.earningsWallet ?? prev.earningsWallet),
                membership: d.membership ?? prev.membership,
                activePackage: Boolean(d.activePackage ?? prev.activePackage),
                tasksCompletedToday: Number(d.tasksCompletedToday ?? prev.tasksCompletedToday),
                dailyLimit: Number(d.dailyLimit ?? prev.dailyLimit),
                referralCode: d.referralCode ?? prev.referralCode,
                completedTasks: d.completedTasks || {}
              }));
            }
          });

          unsubDep = onSnapshot(query(collection(db, 'deposits'), where('uid', '==', firebaseUser.uid)), (snap) => {
            setMyDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });

          unsubWit = onSnapshot(query(collection(db, 'withdrawals'), where('uid', '==', firebaseUser.uid)), (snap) => {
            setMyWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
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

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubDep) unsubDep();
      if (unsubWit) unsubWit();
      unsubscribeAuth();
    };
  }, []);

  // Realtime listener for customizable tasks in Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTasks(list);
        }
      }, () => {});
      return () => unsub();
    } catch {
      // keep local default tasks if offline/rules restricted
    }
  }, []);

  // Admin-only realtime listeners
  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      setAllDeposits([]);
      setAllWithdrawals([]);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    const unsubDeps = onSnapshot(collection(db, 'deposits'), (snap) => {
      setAllDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    const unsubWits = onSnapshot(collection(db, 'withdrawals'), (snap) => {
      setAllWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => {
      unsubUsers();
      unsubDeps();
      unsubWits();
    };
  }, [isAdmin]);

  // Task Countdown Timer & Reward Credit
  useEffect(() => {
    let interval = null;
    if (activeTimerTaskId !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeTimerTaskId !== null) {
      const finishedTask = tasks.find(t => t.id === activeTimerTaskId);
      const rewardAmt = finishedTask ? Number(finishedTask.reward) || 0 : 0;
      const updatedCompleted = {
        ...(user.completedTasks || {}),
        [activeTimerTaskId]: Date.now()
      };
      const updatedEarnings = Number((user.earningsWallet + rewardAmt).toFixed(2));
      const updatedCount = user.tasksCompletedToday + 1;

      setUser(prev => ({
        ...prev,
        earningsWallet: updatedEarnings,
        tasksCompletedToday: updatedCount,
        completedTasks: updatedCompleted
      }));

      if (authUser) {
        updateDoc(doc(db, 'users', authUser.uid), {
          earningsWallet: updatedEarnings,
          tasksCompletedToday: updatedCount,
          completedTasks: updatedCompleted
        }).catch(() => {});
      }
      setActiveTimerTaskId(null);
    }
    return () => clearInterval(interval);
  }, [activeTimerTaskId, timeLeft, tasks, user, authUser]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        if (!nameInput.trim() || !mobileInput.trim()) {
          setAuthError('Please provide Full Name and Mobile Number.');
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        if (res.user) {
          await updateProfile(res.user, { displayName: nameInput.trim() });
          const newUserProfile = {
            name: nameInput.trim(),
            mobile: mobileInput.trim(),
            email: emailInput.trim(),
            depositWallet: 0,
            earningsWallet: 0,
            membership: res.user.email === ADMIN_EMAIL ? 'Admin Access' : 'No Active Package',
            activePackage: res.user.email === ADMIN_EMAIL,
            tasksCompletedToday: 0,
            dailyLimit: res.user.email === ADMIN_EMAIL ? 100 : 0,
            referralCode: 'KODA' + res.user.uid.slice(0, 5).toUpperCase(),
            status: 'Active',
            completedTasks: {},
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', res.user.uid), newUserProfile);
          setUser(newUserProfile);
          setProfileNameInput(newUserProfile.name);
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

  const isTaskLocked24h = (taskId) => {
    const lastDone = user.completedTasks?.[taskId];
    if (!lastDone) return false;
    return (Date.now() - Number(lastDone)) < 24 * 60 * 60 * 1000;
  };

  const startTask = (task) => {
    if (!user.activePackage && !isAdmin) {
      alert('Please activate a membership package first to start tasks.');
      setActiveTab('memberships');
      return;
    }
    if (isTaskLocked24h(task.id)) {
      alert('You have already completed this task within the last 24 hours.');
      return;
    }
    setActiveTimerTaskId(task.id);
    setTimeLeft(Number(task.timer) || 15);
    if (task.link && task.link !== 'https://') {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  // Admin: Add or Update Task (Title, Reward, Timer, Link, Category, Status)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const payload = {
      title: newTaskTitle.trim(),
      reward: Number(newTaskReward) || 10,
      timer: Number(newTaskTimer) || 20,
      link: newTaskLink.trim() || 'https://google.com',
      category: newTaskCategory.trim() || 'General',
      status: newTaskStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingTaskId) {
        await updateDoc(doc(db, 'tasks', String(editingTaskId)), payload);
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { id: editingTaskId, ...payload } : t));
        setEditingTaskId(null);
      } else {
        const docRef = await addDoc(collection(db, 'tasks'), payload);
        setTasks(prev => [...prev, { id: docRef.id, ...payload }]);
      }
    } catch {
      if (editingTaskId) {
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { id: editingTaskId, ...payload } : t));
        setEditingTaskId(null);
      } else {
        setTasks(prev => [...prev, { id: String(Date.now()), ...payload }]);
      }
    }

    setNewTaskTitle('');
    setNewTaskReward('10');
    setNewTaskTimer('20');
    setNewTaskLink('https://');
    setNewTaskCategory('Social');
    setNewTaskStatus('ACTIVE');
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskReward(String(task.reward));
    setNewTaskTimer(String(task.timer));
    setNewTaskLink(task.link || 'https://');
    setNewTaskCategory(task.category || 'General');
    setNewTaskStatus(task.status || 'ACTIVE');
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', String(id)));
    } catch {}
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingTaskId === id) {
      setEditingTaskId(null);
      setNewTaskTitle('');
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositTrxId.trim() || !authUser) return;
    const record = {
      uid: authUser.uid,
      email: authUser.email,
      trxId: depositTrxId.trim().toUpperCase(),
      method: depositMethod,
      senderPhone: senderPhone.trim() || '017XXXXXXXX',
      amount: Number(depositAmount) || 0,
      packageTarget: depositTarget,
      status: 'Pending Verification',
      createdAt: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, 'deposits'), record);
    } catch {}
    setMyDeposits(prev => [record, ...prev]);
    setDepositTrxId('');
    setDepositSuccess('Deposit reference submitted for verification.');
    setTimeout(() => setDepositSuccess(''), 3500);
  };

  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(cashoutAmount);
    if (!amt || amt < 100 || amt > 25000) {
      setCashoutError('Minimum cashout is ৳100 and Maximum is ৳25,000.');
      return;
    }
    if (amt > user.earningsWallet) {
      setCashoutError('Insufficient earnings wallet balance.');
      return;
    }
    const nextBalance = Number((user.earningsWallet - amt).toFixed(2));
    const record = {
      uid: authUser?.uid || 'local',
      email: user.email,
      method: cashoutMethod,
      phone: cashoutPhone.trim(),
      gross: amt,
      net: Number((amt * 0.98).toFixed(2)),
      status: 'Processing',
      createdAt: new Date().toISOString()
    };
    try {
      if (authUser) {
        await addDoc(collection(db, 'withdrawals'), record);
        await updateDoc(doc(db, 'users', authUser.uid), { earningsWallet: nextBalance });
      }
    } catch {}
    setUser(prev => ({ ...prev, earningsWallet: nextBalance }));
    setMyWithdrawals(prev => [record, ...prev]);
    setCashoutAmount('');
    setCashoutError('');
    setCashoutSuccess('Cashout request submitted.');
    setTimeout(() => setCashoutSuccess(''), 3500);
  };

  const handleApproveDeposit = async (dep) => {
    try {
      await updateDoc(doc(db, 'deposits', dep.id), { status: 'Approved' });
      if (dep.uid) {
        const uRef = doc(db, 'users', dep.uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const cur = Number(uSnap.data().depositWallet || 0);
          await updateDoc(uRef, { depositWallet: cur + Number(dep.amount || 0) });
        }
      }
    } catch {}
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090B10] text-slate-300 flex items-center justify-center font-mono text-sm">
        Loading KODA Task BD...
      </div>
    );
  }

  // Real Auth Screen: Register requires Name, Mobile, Email, Password; Login requires Email & Password
  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#090B10] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111520] border border-slate-800/90 rounded-2xl p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">KODA Task BD</h1>
              <p className="text-xs text-slate-400 mt-0.5">Real Account Registration & Login</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              REAL SITE
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
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Name</label>
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
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                placeholder="example@gmail.com"
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
              {authMode === 'register' ? 'Register Account' : 'Login'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {authMode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Login
                </button>
              </span>
            ) : (
              <span>
                Need a new account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

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
  const completedCount = Object.keys(user.completedTasks || {}).length;

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800/90 bg-[#0D1018]/95 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#141926] border border-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide text-white">KODA Task BD</span>
          </div>
          {isAdmin && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Admin
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
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
            <span className="max-w-[130px] truncate">{user.name || user.email}</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Navigation</h2>
                <p className="text-[11px] text-slate-400">KODA Task controls</p>
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
                ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Settings }] : [])
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
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Task Status</h3>
            </div>
            <p className="text-[11px] text-slate-400">Filter tasks by status</p>
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

        {/* Main Workspace */}
        <main className="lg:col-span-9 space-y-6">
          {(activeTab === 'dashboard' || activeTab === 'tasks') && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {activeTab === 'dashboard' ? 'Dashboard & Tasks' : 'Available Tasks'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tasks, timers, and links are customized live from Admin Panel
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

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Earnings Wallet</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1 block">
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
                  <span className="text-xs text-slate-400 block">Total Tasks</span>
                  <span className="text-xl font-extrabold text-indigo-400 font-mono mt-1 block">
                    {filteredTasks.length}
                  </span>
                </div>
                <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block">Completed</span>
                  <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                    {completedCount}
                  </span>
                </div>
              </div>

              {/* Tasks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Task & Link</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Timer</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Reward & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredTasks.map((task) => {
                      const done24h = isTaskLocked24h(task.id);
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
                            {done24h ? (
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
                              {done24h ? (
                                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
                                  24h Lock
                                </span>
                              ) : isRunning ? (
                                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold">
                                  {timeLeft}s
                                </span>
                              ) : (
                                <button
                                  onClick={() => startTask(task)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                                >
                                  Start Task
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

          {/* Admin Control Panel (Visible ONLY for 1roxi1@gmail.com) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Control Panel</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add, edit, or delete tasks (Title, Reward, Timer, Link, Category, Status) and manage deposits
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'tasks', label: 'Customize Tasks' },
                    { id: 'deposits', label: `Deposits (${allDeposits.length})` },
                    { id: 'users', label: `Users (${allUsers.length})` }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setAdminSubTab(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        adminSubTab === sec.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#090B10] text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {adminSubTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Add / Edit Task Form */}
                  <form onSubmit={handleSaveTask} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-emerald-400" />
                        <span>{editingTaskId ? 'Edit Task Configuration' : 'Add Custom Task'}</span>
                      </h3>
                      {editingTaskId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(null);
                            setNewTaskTitle('');
                            setNewTaskReward('10');
                            setNewTaskTimer('20');
                            setNewTaskLink('https://');
                          }}
                          className="text-xs text-slate-400 hover:text-white underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">Task Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Watch Video & Subscribe"
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
                        <label className="block text-[11px] text-slate-400 mb-1">Timer (Seconds)</label>
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
                          {editingTaskId ? 'Update Task' : 'Save Task'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Configured Tasks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">Task & Link</th>
                          <th className="py-3 px-3">Timer</th>
                          <th className="py-3 px-3">Reward</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
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
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                t.status === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              <button
                                onClick={() => startEditingTask(t)}
                                className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                                title="Edit Task"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
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

              {adminSubTab === 'deposits' && (
                <div className="space-y-3">
                  {allDeposits.length === 0 ? (
                    <p className="text-xs text-slate-400">No deposit submissions yet.</p>
                  ) : (
                    allDeposits.map(dep => (
                      <div key={dep.id} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white">{dep.email} — ৳{dep.amount} ({dep.method})</div>
                          <div className="text-slate-400 font-mono mt-0.5">TrxID: {dep.trxId} • Status: {dep.status}</div>
                        </div>
                        {dep.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveDeposit(dep)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Approve & Credit
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {adminSubTab === 'users' && (
                <div className="space-y-3">
                  {allUsers.length === 0 ? (
                    <p className="text-xs text-slate-400">No registered users yet.</p>
                  ) : (
                    allUsers.map(u => (
                      <div key={u.id} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-white">{u.name || 'Member'} ({u.email})</div>
                          <div className="text-slate-400 font-mono mt-0.5">Mobile: {u.mobile || 'N/A'} • Deposit: ৳{u.depositWallet || 0} • Earnings: ৳{u.earningsWallet || 0}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                          {u.status || 'Active'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'memberships' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-bold text-white">Membership Packages</h2>
                <p className="text-xs text-slate-400 mt-0.5">Activate a plan to unlock earning tasks</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Basic Starter', price: 500, days: 30, limit: 5 },
                  { name: 'Standard Pro', price: 1200, days: 30, limit: 10 },
                  { name: 'Premium Booster', price: 2500, days: 45, limit: 18 },
                  { name: 'VIP Master Elite', price: 5000, days: 60, limit: 30 }
                ].map((pkg, idx) => (
                  <div key={idx} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">{pkg.name}</h3>
                        <span className="text-lg font-extrabold text-amber-400 font-mono">৳{pkg.price}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{pkg.limit} Daily Tasks • {pkg.days} Days</p>
                    </div>
                    <button
                      onClick={() => {
                        setUser(prev => ({ ...prev, membership: pkg.name, activePackage: true, dailyLimit: pkg.limit }));
                        if (authUser) {
                          updateDoc(doc(db, 'users', authUser.uid), {
                            membership: pkg.name,
                            activePackage: true,
                            dailyLimit: pkg.limit
                          }).catch(() => {});
                        }
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

          {activeTab === 'deposit' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-bold text-white">Deposit Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Submit payment details and TrxID</p>
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
                  <label className="block text-xs text-slate-400 mb-1">Sender Mobile</label>
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
                    placeholder="TRX123456"
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
                    Submit Deposit
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 max-w-2xl">
              <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Withdraw</h2>
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
                  <label className="block text-xs text-slate-400 mb-1">Method</label>
                  <select
                    value={cashoutMethod}
                    onChange={(e) => setCashoutMethod(e.target.value)}
                    className="w-full bg-[#0D1018] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
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
                  Request Cashout
                </button>
              </form>
            </div>
          )}

          {activeTab === 'referral' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Referral Code</h2>
              <div className="bg-[#0D1018] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-indigo-400">{user.referralCode || 'N/A'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(user.referralCode || '')}
                  className="px-3 py-1.5 rounded-lg bg-[#161B29] border border-slate-800 text-xs text-slate-200 flex items-center space-x-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">History</h2>
              <p className="text-xs text-slate-400">
                Deposits: {myDeposits.length} • Withdrawals: {myWithdrawals.length} • Completed Tasks: {completedCount}
              </p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-6 space-y-4 max-w-xl">
              <h2 className="text-lg font-bold text-white">Profile</h2>
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
                  onClick={() => {
                    setUser(prev => ({ ...prev, name: profileNameInput }));
                    if (authUser) {
                      updateDoc(doc(db, 'users', authUser.uid), { name: profileNameInput }).catch(() => {});
                    }
                    alert('Profile updated.');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Profile
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
