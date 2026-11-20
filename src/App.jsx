import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Wallet, Users, Settings, LogOut, CheckCircle,
  Copy, Lock, Clock, Award, DollarSign, ExternalLink, User,
  BarChart2, Package, Layers, CreditCard, Plus, Trash2, Search,
  AlertTriangle, Edit3, Send, Check
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
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const ADMIN_EMAIL = '1roxi1@gmail.com';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'

  // Auth inputs (Register requires Name, Mobile, Email, Password; Login requires Email & Password)
  const [nameInput, setNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Navigation & UI state (Original KODA Task site layout for users)
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin Control Panel state (Styled after the reference dark theme!)
  const [adminSection, setAdminSection] = useState('tasks'); // 'tasks' | 'finance' | 'packages' | 'users' | 'settings'
  const [adminFilter, setAdminFilter] = useState('All'); // 'All' | 'Pending' | 'Active'
  const [adminSearch, setAdminSearch] = useState('');

  // Fresh Real User State (No old/mock user data)
  const [userData, setUserData] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [completedTasks, setCompletedTasks] = useState({});

  const isAdmin = authUser?.email === ADMIN_EMAIL;

  // Customizable Tasks (Synced with Firestore 'tasks' collection)
  const [tasks, setTasks] = useState([
    { id: '1', title: 'YouTube Video Watch & Subscribe', reward: 10, link: 'https://youtube.com', timerSec: 25, category: 'Video', status: 'ACTIVE' },
    { id: '2', title: 'Facebook Page Follow & Like', reward: 8, link: 'https://facebook.com', timerSec: 20, category: 'Social', status: 'ACTIVE' },
    { id: '3', title: 'Telegram Channel Join', reward: 5, link: 'https://telegram.org', timerSec: 15, category: 'Community', status: 'ACTIVE' },
    { id: '4', title: 'App Download & Review', reward: 14, link: 'https://play.google.com', timerSec: 30, category: 'App', status: 'PENDING' },
    { id: '5', title: 'Website Visit & Read Article', reward: 12, link: 'https://google.com', timerSec: 25, category: 'Web', status: 'ACTIVE' }
  ]);

  // Admin Task Editor Form State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskRewardInput, setTaskRewardInput] = useState('10');
  const [taskTimerInput, setTaskTimerInput] = useState('25');
  const [taskLinkInput, setTaskLinkInput] = useState('https://');
  const [taskCategoryInput, setTaskCategoryInput] = useState('Social');
  const [taskStatusInput, setTaskStatusInput] = useState('ACTIVE');

  // Gateways & Packages (Synced with Firestore)
  const [gateways, setGateways] = useState({
    bkash: '01737966207',
    nagad: '01737966207',
    rocket: '01737966207',
    minWithdraw: 100,
    specialReferral: 'KODA777'
  });

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
      desc: 'Ultimate membership with maximum daily task limits, highest rewards and instant payouts.',
      features: ['30 Daily High-Reward Tasks', '৳1700 Daily Potential (৳102,000 total)', '60 Days Long Validity', 'Instant Automated Cashouts', 'Personal Account Manager']
    }
  ]);

  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgValidity, setNewPkgValidity] = useState('30 Days');
  const [newPkgTasks, setNewPkgTasks] = useState('10');
  const [newPkgPotential, setNewPkgPotential] = useState('300');

  // Deposit & Withdrawal states
  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [targetTier, setTargetTier] = useState('Direct Balance');

  const [withdrawMethod, setWithdrawMethod] = useState('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  // Personal & Admin lists
  const [myDeposits, setMyDeposits] = useState([]);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [allDeposits, setAllDeposits] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Task Runner Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [timer, setTimer] = useState(25);
  const [timerActive, setTimerActive] = useState(false);
  const [taskCompletedMsg, setTaskCompletedMsg] = useState('');

  const t = {
    en: {
      brand: 'KODA Task',
      subBrand: 'Membership-Based Task Platform',
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      membership: 'Memberships',
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      referral: 'Referral',
      history: 'History',
      adminPanel: 'Admin Control',
      depositWallet: 'Deposit Wallet',
      earningsWallet: 'Earnings Wallet',
      activePackage: 'Active Package',
      noPackage: 'No Active Package'
    },
    bn: {
      brand: 'KODA Task',
      subBrand: 'Membership-Based Task Platform',
      dashboard: 'ড্যাশবোর্ড',
      tasks: 'টাস্কসমূহ',
      membership: 'মেম্বারশিপ',
      deposit: 'ডিপোজিট',
      withdraw: 'উইথড্র',
      referral: 'রেফারেল',
      history: 'হিস্ট্রি',
      adminPanel: 'অ্যাডমিন কন্ট্রোল',
      depositWallet: 'ডিপোজিট ওয়ালেট',
      earningsWallet: 'আর্নিংস ওয়ালেট',
      activePackage: 'সক্রিয় প্যাকেজ',
      noPackage: 'কোনো প্যাকেজ নেই'
    }
  };

  // Sync Settings & Tasks from Firestore
  useEffect(() => {
    const unsubGateways = onSnapshot(doc(db, 'settings', 'gateways'), (snap) => {
      if (snap.exists()) {
        setGateways(prev => ({ ...prev, ...snap.data() }));
      }
    }, () => {});

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      if (!snap.empty) {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, () => {});

    const unsubPackages = onSnapshot(collection(db, 'packages'), (snap) => {
      if (!snap.empty) {
        setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, () => {});

    return () => {
      unsubGateways();
      unsubTasks();
      unsubPackages();
    };
  }, []);

  // Monitor Firebase Auth State
  useEffect(() => {
    let unsubUser = null;
    let unsubDep = null;
    let unsubWit = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubUser) unsubUser();
      if (unsubDep) unsubDep();
      if (unsubWit) unsubWit();

      if (currentUser) {
        setAuthUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);

        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'Banned') {
              alert('Your account has been suspended by admin.');
              await signOut(auth);
              setAuthUser(null);
              setUserData(null);
              setAuthLoading(false);
              return;
            }
            setUserData(data);
            setProfileName(data.name || currentUser.displayName || '');
            setCompletedTasks(data.completedTasks || {});
          } else {
            const cleanName = (currentUser.displayName || nameInput || 'Member').trim();
            const refCode = cleanName.replace(/\s+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
            const freshProfile = {
              name: cleanName,
              email: currentUser.email,
              phone: mobileInput.trim() || 'N/A',
              referralCode: refCode,
              referredBy: referralInput.trim() || '',
              depositWallet: 0,
              earningsWallet: 0,
              referralEarnings: 0,
              package: currentUser.email === ADMIN_EMAIL ? 'Admin Access' : null,
              status: 'Active',
              completedTasks: {},
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, freshProfile, { merge: true });
            setUserData(freshProfile);
            setProfileName(cleanName);
            setCompletedTasks({});
          }

          unsubUser = onSnapshot(userRef, (dSnap) => {
            if (dSnap.exists()) {
              const u = dSnap.data();
              setUserData(u);
              setCompletedTasks(u.completedTasks || {});
            }
          });

          unsubDep = onSnapshot(query(collection(db, 'deposits'), where('uid', '==', currentUser.uid)), (snap) => {
            setMyDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });

          unsubWit = onSnapshot(query(collection(db, 'withdrawals'), where('uid', '==', currentUser.uid)), (snap) => {
            setMyWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
        } catch {
          setUserData({
            name: currentUser.displayName || 'Member',
            email: currentUser.email,
            phone: mobileInput || 'N/A',
            depositWallet: 0,
            earningsWallet: 0,
            package: currentUser.email === ADMIN_EMAIL ? 'Admin Access' : null,
            status: 'Active',
            completedTasks: {}
          });
        }
      } else {
        setAuthUser(null);
        setUserData(null);
        setMyDeposits([]);
        setMyWithdrawals([]);
        setCompletedTasks({});
      }
      setAuthLoading(false);
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubDep) unsubDep();
      if (unsubWit) unsubWit();
      unsubAuth();
    };
  }, []);

  // Admin-only listeners
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

  // Task Countdown Timer
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        if (!nameInput.trim() || !mobileInput.trim()) {
          setAuthError('Please enter your Name and Mobile Number.');
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
        await updateProfile(res.user, { displayName: nameInput.trim() });
        const cleanName = nameInput.trim();
        const refCode = cleanName.replace(/\s+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const newDoc = {
          name: cleanName,
          email: emailInput.trim(),
          phone: mobileInput.trim(),
          referralCode: refCode,
          referredBy: referralInput.trim() || '',
          depositWallet: 0,
          earningsWallet: 0,
          referralEarnings: 0,
          package: res.user.email === ADMIN_EMAIL ? 'Admin Access' : null,
          status: 'Active',
          completedTasks: {},
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', res.user.uid), newDoc);
        setUserData(newDoc);
        setProfileName(cleanName);
      } else {
        await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const isTaskLocked = (taskId) => {
    const lastCompleted = completedTasks[taskId];
    if (!lastCompleted) return false;
    return (Date.now() - Number(lastCompleted)) < 24 * 60 * 60 * 1000;
  };

  const getRemainingTime = (taskId) => {
    const lastCompleted = completedTasks[taskId];
    if (!lastCompleted) return '';
    const diff = 24 * 60 * 60 * 1000 - (Date.now() - Number(lastCompleted));
    if (diff <= 0) return '';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Available in ${hours}h ${minutes}m`;
  };

  // Admin: Add or Edit Task (Title, Reward, Timer, Link, Category, Status)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitleInput.trim()) return;
    const payload = {
      title: taskTitleInput.trim(),
      reward: Number(taskRewardInput) || 10,
      timerSec: Number(taskTimerInput) || 25,
      link: taskLinkInput.trim() || 'https://example.com',
      category: taskCategoryInput.trim() || 'Social',
      status: taskStatusInput
    };
    try {
      if (editingTaskId) {
        await updateDoc(doc(db, 'tasks', String(editingTaskId)), payload);
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { id: editingTaskId, ...payload } : t));
        setEditingTaskId(null);
      } else {
        const ref = await addDoc(collection(db, 'tasks'), payload);
        setTasks(prev => [...prev, { id: ref.id, ...payload }]);
      }
    } catch {
      if (editingTaskId) {
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { id: editingTaskId, ...payload } : t));
        setEditingTaskId(null);
      } else {
        setTasks(prev => [...prev, { id: String(Date.now()), ...payload }]);
      }
    }
    setTaskTitleInput('');
    setTaskRewardInput('10');
    setTaskTimerInput('25');
    setTaskLinkInput('https://');
    setTaskCategoryInput('Social');
    setTaskStatusInput('ACTIVE');
  };

  const handleEditTaskClick = (task) => {
    setEditingTaskId(task.id);
    setTaskTitleInput(task.title);
    setTaskRewardInput(String(task.reward));
    setTaskTimerInput(String(task.timerSec || 25));
    setTaskLinkInput(task.link || 'https://');
    setTaskCategoryInput(task.category || 'Social');
    setTaskStatusInput(task.status || 'ACTIVE');
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', String(id)));
    } catch {}
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingTaskId === id) {
      setEditingTaskId(null);
      setTaskTitleInput('');
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'tasks', String(task.id)), { status: nextStatus });
    } catch {}
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || !depositTrxId || !senderPhone || !authUser) return;
    try {
      await addDoc(collection(db, 'deposits'), {
        uid: authUser.uid,
        email: authUser.email,
        method: depositMethod,
        amount: Number(depositAmount),
        trxId: depositTrxId.trim().toUpperCase(),
        senderPhone: senderPhone.trim(),
        targetTier,
        status: 'Pending Verification',
        adminNote: '—',
        timestamp: serverTimestamp()
      });
      alert('Deposit reference submitted successfully!');
      setDepositAmount('');
      setDepositTrxId('');
      setSenderPhone('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!userData?.package && !isAdmin) {
      alert('You must activate a membership package to withdraw funds!');
      setActiveTab('membership');
      return;
    }
    const amount = Number(withdrawAmount);
    const minW = Number(gateways.minWithdraw) || 100;
    if (!amount || !withdrawAccount) return;
    if (amount < minW) {
      alert(`Minimum withdrawal is ৳${minW}.`);
      return;
    }
    if (amount > (userData?.earningsWallet || 0)) {
      alert('Insufficient earnings balance!');
      return;
    }
    try {
      await addDoc(collection(db, 'withdrawals'), {
        uid: authUser.uid,
        email: authUser.email,
        method: withdrawMethod,
        amount,
        account: withdrawAccount,
        status: 'Pending',
        payoutTrxId: '—',
        adminNote: 'Pending review',
        timestamp: serverTimestamp()
      });
      const newEarnings = userData.earningsWallet - amount;
      await updateDoc(doc(db, 'users', authUser.uid), { earningsWallet: newEarnings });
      setUserData({ ...userData, earningsWallet: newEarnings });
      alert('Withdrawal request submitted successfully!');
      setWithdrawAmount('');
      setWithdrawAccount('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleBuyPackage = async (pkg) => {
    if (!userData || !authUser) return;
    if ((userData.depositWallet || 0) < pkg.price) {
      alert(`Insufficient deposit balance (৳${userData.depositWallet || 0}). Required ৳${pkg.price}. Please deposit first!`);
      setActiveTab('deposit');
      return;
    }
    try {
      const newDeposit = userData.depositWallet - pkg.price;
      await updateDoc(doc(db, 'users', authUser.uid), {
        depositWallet: newDeposit,
        package: pkg.name
      });
      setUserData({ ...userData, depositWallet: newDeposit, package: pkg.name });
      alert(`Successfully activated ${pkg.name}!`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-sm text-slate-300">Loading KODA Task...</p>
        </div>
      </div>
    );
  }

  // Real Registration & Login Gate (No demo mode; Register asks Name, Mobile, Email, Password)
  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 shadow-2xl">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">KODA Task</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {authMode === 'register' ? 'Create a new account to get started' : 'Sign in to your account'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-xs text-slate-400">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01700000000"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-slate-400">Email *</label>
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="text-xs text-slate-400">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-cyan-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm shadow-lg transition"
            >
              {authMode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            {authMode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Register
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const navTabs = [
    { id: 'dashboard', label: t[lang].dashboard },
    { id: 'tasks', label: t[lang].tasks },
    { id: 'membership', label: t[lang].membership },
    { id: 'deposit', label: t[lang].deposit },
    { id: 'withdraw', label: t[lang].withdraw },
    { id: 'referral', label: t[lang].referral },
    { id: 'history', label: t[lang].history }
  ];

  // Admin Control Panel filtered tasks
  const adminFilteredTasks = tasks.filter(task => {
    const matchesStatus =
      adminFilter === 'All' ||
      (adminFilter === 'Active' && task.status === 'ACTIVE') ||
      (adminFilter === 'Pending' && task.status !== 'ACTIVE');
    const matchesQuery =
      !adminSearch.trim() ||
      task.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (task.category || '').toLowerCase().includes(adminSearch.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const pendingDepositsCount = allDeposits.filter(d => d.status === 'Pending Verification' || d.status === 'Pending').length;
  const pendingWithdrawalsCount = allWithdrawals.filter(w => w.status === 'Pending').length;
  const activeTasksCount = tasks.filter(tk => tk.status === 'ACTIVE').length;
  const pendingTasksCount = tasks.filter(tk => tk.status !== 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between w-full overflow-x-hidden">
      <div className="w-full">
        {/* Original KODA Task Site Header */}
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
                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700"
                >
                  <User className="h-4 w-4 text-slate-200" />
                </button>
              </div>
            </div>

            <nav className="flex items-center space-x-1 md:space-x-3 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 flex-nowrap md:flex-wrap justify-start md:justify-center">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 md:px-3 py-2 text-xs md:text-sm font-medium transition whitespace-nowrap rounded-lg ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              {/* Admin Control Tab - Strictly visible ONLY for 1roxi1@gmail.com */}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-2 text-xs md:text-sm font-semibold transition whitespace-nowrap rounded-lg flex items-center space-x-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-[#171C2B] text-white border border-indigo-500/50 shadow'
                      : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>{t[lang].adminPanel}</span>
                </button>
              )}
            </nav>

            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-semibold border border-slate-700"
              >
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition"
              >
                <User className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-slate-200 font-medium truncate max-w-[110px]">
                  {isAdmin ? 'Admin' : userData?.name || authUser.email}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-8 max-w-7xl mx-auto w-full">
          {/* ================================================================= */}
          {/* ADMIN CONTROL PANEL (Reference Dark Theme Applied ONLY Here)      */}
          {/* ================================================================= */}
          {isAdmin && activeTab === 'admin' ? (
            <div className="bg-[#090B10] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
              {/* Top Admin Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#121622] border border-slate-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">KODA Admin Pro</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Premium Control
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Alerts: {pendingDepositsCount + pendingWithdrawalsCount}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                  <span className="px-3 py-1.5 rounded-xl bg-[#121622] border border-slate-800 text-slate-300">
                    Today: {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>

              {/* Two-Column Reference Admin Layout: Left Sidebar + Right Main Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Sidebar: Navigation + Alerts Card */}
                <aside className="lg:col-span-3 space-y-4">
                  <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Navigation</h3>
                        <p className="text-[11px] text-slate-400">Task & platform control</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                        Live
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { id: 'tasks', label: 'Tasks Control', icon: Layers },
                        { id: 'finance', label: 'Billing & Finance', icon: CreditCard },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'packages', label: 'Packages', icon: Package },
                        { id: 'settings', label: 'Settings', icon: Settings }
                      ].map(nav => {
                        const Icon = nav.icon;
                        const active = adminSection === nav.id;
                        return (
                          <button
                            key={nav.id}
                            onClick={() => setAdminSection(nav.id)}
                            className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                              active
                                ? 'bg-[#1B2132] text-white border border-slate-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-[#151A28] border border-transparent'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span>{nav.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom-Left Alerts Card (Matching the Overdue / Due Soon card in reference) */}
                  <div className="bg-[#111520] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      <h4 className="text-sm font-bold text-white">Alerts</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">Pending & active task status filters</p>

                    <button
                      onClick={() => { setAdminSection('tasks'); setAdminFilter('Pending'); }}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Pending Tasks ({pendingTasksCount})</span>
                    </button>

                    <button
                      onClick={() => { setAdminSection('tasks'); setAdminFilter('Active'); }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#171C2B] hover:bg-[#1E2538] border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Active Tasks ({activeTasksCount})</span>
                    </button>
                  </div>
                </aside>

                {/* Right Main Workspace inside Admin Control */}
                <div className="lg:col-span-9 bg-[#111520] border border-slate-800/90 rounded-2xl p-5 space-y-5">
                  {/* Top Section Header + Filter + Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white capitalize">
                        {adminSection === 'tasks' ? 'Tasks & Timer Customization' : adminSection}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Configure tasks, rewards, countdown timers, target links, and approvals
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={adminFilter}
                        onChange={(e) => setAdminFilter(e.target.value)}
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
                          placeholder="Search..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="bg-[#090B10] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 sm:w-48"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 Summary Counter Cards (Total / Pending / Due Soon / Active OK) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block">Total Tasks</span>
                      <span className="text-2xl font-extrabold text-white font-mono mt-1 block">{tasks.length}</span>
                    </div>
                    <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block">Pending Finance</span>
                      <span className="text-2xl font-extrabold text-rose-400 font-mono mt-1 block">
                        {pendingDepositsCount + pendingWithdrawalsCount}
                      </span>
                    </div>
                    <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block">Pending Tasks</span>
                      <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">{pendingTasksCount}</span>
                    </div>
                    <div className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block">Active Tasks</span>
                      <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">{activeTasksCount}</span>
                    </div>
                  </div>

                  {/* SECTION 1: TASKS CUSTOMIZER */}
                  {adminSection === 'tasks' && (
                    <div className="space-y-5">
                      <form onSubmit={handleSaveTask} className="bg-[#0D1018] border border-slate-800/90 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <Plus className="h-4 w-4 text-emerald-400" />
                            <span>{editingTaskId ? 'Edit Task Details' : 'Create / Customize Task'}</span>
                          </span>
                          {editingTaskId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTaskId(null);
                                setTaskTitleInput('');
                                setTaskRewardInput('10');
                                setTaskTimerInput('25');
                                setTaskLinkInput('https://');
                              }}
                              className="text-[11px] text-slate-400 hover:text-white underline"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                          <div className="lg:col-span-2">
                            <label className="block text-[11px] text-slate-400 mb-1">Task Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. YouTube Subscribe"
                              value={taskTitleInput}
                              onChange={(e) => setTaskTitleInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Reward (TK)</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={taskRewardInput}
                              onChange={(e) => setTaskRewardInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Timer (Sec)</label>
                            <input
                              type="number"
                              required
                              min="5"
                              value={taskTimerInput}
                              onChange={(e) => setTaskTimerInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                            <select
                              value={taskStatusInput}
                              onChange={(e) => setTaskStatusInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="PENDING">PENDING</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                            <input
                              type="text"
                              value={taskCategoryInput}
                              onChange={(e) => setTaskCategoryInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4">
                            <label className="block text-[11px] text-slate-400 mb-1">Task Link (URL)</label>
                            <input
                              type="url"
                              required
                              placeholder="https://youtube.com"
                              value={taskLinkInput}
                              onChange={(e) => setTaskLinkInput(e.target.value)}
                              className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                            <button
                              type="submit"
                              className="w-full py-2 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                            >
                              {editingTaskId ? 'Update Task' : 'Add Task'}
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Reference-style Status Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              <th className="py-2.5 px-3">Task & Link</th>
                              <th className="py-2.5 px-3">Timer</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Reward & Controls</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-xs">
                            {adminFilteredTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-[#161B2A]/60 transition">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-white">{task.title}</div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{task.link}</div>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-300">{task.timerSec || 25}s</td>
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleToggleTaskStatus(task)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                                      task.status === 'ACTIVE'
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {task.status || 'ACTIVE'}
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="inline-flex items-center space-x-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-[#090B10] border border-slate-800 font-mono font-bold text-slate-200">
                                      ৳{task.reward}
                                    </span>
                                    <button
                                      onClick={() => handleEditTaskClick(task)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center space-x-1"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: BILLING & FINANCE (Deposits + Withdrawals) */}
                  {adminSection === 'finance' && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-white mb-2">Deposit Requests ({allDeposits.length})</h3>
                        <div className="space-y-2">
                          {allDeposits.length === 0 ? (
                            <p className="text-xs text-slate-400">No deposits found.</p>
                          ) : (
                            allDeposits.map(dep => (
                              <div key={dep.id} className="bg-[#0D1018] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                                <div>
                                  <p className="font-semibold text-white">{dep.email} — ৳{dep.amount} ({dep.method})</p>
                                  <p className="text-slate-400 font-mono text-[11px]">TrxID: {dep.trxId} • Sender: {dep.senderPhone}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    dep.status === 'Approved'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {dep.status}
                                  </span>
                                  {dep.status !== 'Approved' && (
                                    <button
                                      onClick={async () => {
                                        await updateDoc(doc(db, 'deposits', dep.id), { status: 'Approved' });
                                        const uRef = doc(db, 'users', dep.uid);
                                        const uSnap = await getDoc(uRef);
                                        if (uSnap.exists()) {
                                          await updateDoc(uRef, { depositWallet: (uSnap.data().depositWallet || 0) + Number(dep.amount) });
                                        }
                                      }}
                                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white mb-2">Withdrawal Requests ({allWithdrawals.length})</h3>
                        <div className="space-y-2">
                          {allWithdrawals.length === 0 ? (
                            <p className="text-xs text-slate-400">No withdrawals found.</p>
                          ) : (
                            allWithdrawals.map(wit => (
                              <div key={wit.id} className="bg-[#0D1018] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                                <div>
                                  <p className="font-semibold text-white">{wit.email} — ৳{wit.amount} ({wit.method})</p>
                                  <p className="text-slate-400 font-mono text-[11px]">Account: {wit.account}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    wit.status === 'Approved'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {wit.status}
                                  </span>
                                  {wit.status === 'Pending' && (
                                    <button
                                      onClick={async () => {
                                        await updateDoc(doc(db, 'withdrawals', wit.id), {
                                          status: 'Approved',
                                          payoutTrxId: `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                                        });
                                      }}
                                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: USERS */}
                  {adminSection === 'users' && (
                    <div className="space-y-3">
                      {allUsers.length === 0 ? (
                        <p className="text-xs text-slate-400">No registered users yet.</p>
                      ) : (
                        allUsers.map(usr => (
                          <UserAdminRow key={usr.id} usr={usr} />
                        ))
                      )}
                    </div>
                  )}

                  {/* SECTION 4: PACKAGES */}
                  {adminSection === 'packages' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#0D1018] border border-slate-800 rounded-xl p-3.5">
                        <input
                          type="text"
                          placeholder="Package Name"
                          value={newPkgName}
                          onChange={(e) => setNewPkgName(e.target.value)}
                          className="bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="number"
                          placeholder="Price (৳)"
                          value={newPkgPrice}
                          onChange={(e) => setNewPkgPrice(e.target.value)}
                          className="bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        />
                        <button
                          onClick={async () => {
                            if (!newPkgName || !newPkgPrice) return;
                            const pkgObj = {
                              name: newPkgName,
                              price: Number(newPkgPrice),
                              validity: newPkgValidity,
                              dailyTasks: Number(newPkgTasks) || 10,
                              dailyPotential: Number(newPkgPotential) || 300,
                              desc: 'Custom membership package',
                              features: [`${newPkgTasks || 10} Daily Tasks`, `${newPkgValidity} Validity`]
                            };
                            try {
                              const ref = await addDoc(collection(db, 'packages'), pkgObj);
                              setPackages(prev => [...prev, { id: ref.id, ...pkgObj }]);
                            } catch {
                              setPackages(prev => [...prev, { id: String(Date.now()), ...pkgObj }]);
                            }
                            setNewPkgName('');
                            setNewPkgPrice('');
                          }}
                          className="py-2 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                        >
                          Add Package
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {packages.map(pkg => (
                          <div key={pkg.id} className="bg-[#0D1018] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{pkg.name} — ৳{pkg.price}</p>
                              <p className="text-slate-400 font-mono text-[11px]">{pkg.dailyTasks} Tasks/day • {pkg.validity}</p>
                            </div>
                            <button
                              onClick={async () => {
                                try { await deleteDoc(doc(db, 'packages', String(pkg.id))); } catch {}
                                setPackages(prev => prev.filter(p => p.id !== pkg.id));
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 5: GATEWAY SETTINGS */}
                  {adminSection === 'settings' && (
                    <div className="bg-[#0D1018] border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">bKash Personal</label>
                          <input
                            type="text"
                            value={gateways.bkash}
                            onChange={(e) => setGateways({ ...gateways, bkash: e.target.value })}
                            className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Nagad Personal</label>
                          <input
                            type="text"
                            value={gateways.nagad}
                            onChange={(e) => setGateways({ ...gateways, nagad: e.target.value })}
                            className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Rocket Personal</label>
                          <input
                            type="text"
                            value={gateways.rocket}
                            onChange={(e) => setGateways({ ...gateways, rocket: e.target.value })}
                            className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Min Withdraw (৳)</label>
                          <input
                            type="number"
                            value={gateways.minWithdraw}
                            onChange={(e) => setGateways({ ...gateways, minWithdraw: Number(e.target.value) })}
                            className="w-full bg-[#111520] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await setDoc(doc(db, 'settings', 'gateways'), gateways, { merge: true });
                          alert('Settings saved!');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold"
                      >
                        Save Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            /* =============================================================== */
            /* ORIGINAL USER SITE DASHBOARD (Unchanged Site Layout)            */
            /* =============================================================== */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t[lang].depositWallet}</p>
                    <h3 className="text-2xl font-bold text-blue-400 mt-1">৳ {userData?.depositWallet || 0}</h3>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t[lang].earningsWallet}</p>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">৳ {userData?.earningsWallet || 0}</h3>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
                    <Award className="h-6 w-6" />
                  </div>
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
                  {tasks.map(task => {
                    const locked = isTaskLocked(task.id);
                    const remaining = getRemainingTime(task.id);
                    return (
                      <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                        <div>
                          <h4 className="font-medium text-slate-200 text-sm md:text-base">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs text-blue-400 font-semibold">Reward: ৳{task.reward}</span>
                            <span className="text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Timer: {task.timerSec || 25} Seconds</span>
                            </span>
                            <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline hover:text-indigo-300 flex items-center space-x-1">
                              <span>Visit Link</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        {locked ? (
                          <div className="text-right">
                            <span className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl border border-slate-700 block">
                              Completed ✓
                            </span>
                            <span className="text-[10px] text-amber-400 mt-1 block">{remaining}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!userData?.package && !isAdmin) {
                                alert('Please activate a membership package first!');
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Available Tasks</h3>
              <div className="space-y-3">
                {tasks.map(task => {
                  const locked = isTaskLocked(task.id);
                  const remaining = getRemainingTime(task.id);
                  return (
                    <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
                      <div>
                        <h4 className="font-medium text-slate-200 text-sm md:text-base">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs text-blue-400 font-semibold">Reward: ৳{task.reward}</span>
                          <span className="text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                            Timer: {task.timerSec || 25} Seconds
                          </span>
                          <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline hover:text-indigo-300">
                            Visit Link ↗
                          </a>
                        </div>
                      </div>
                      {locked ? (
                        <div className="text-right">
                          <span className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl border border-slate-700 block">
                            Completed ✓
                          </span>
                          <span className="text-[10px] text-amber-400 mt-1 block">{remaining}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!userData?.package && !isAdmin) {
                              alert('Please activate a membership package first!');
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'membership' ? (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">Select Membership Plan</h2>
                <p className="text-xs md:text-sm text-slate-400">Choose a tier that fits your daily availability.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg, idx) => (
                  <div key={pkg.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition shadow-xl">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{pkg.desc}</p>
                      <div className="my-5">
                        <span className="text-3xl font-extrabold text-amber-400">৳{pkg.price}</span>
                        <span className="text-xs text-slate-400"> / {pkg.validity}</span>
                      </div>
                      <div className="space-y-2">
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
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-white text-sm shadow-lg transition"
                    >
                      Activate for ৳{pkg.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'deposit' ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white">Deposit Verification Gateway</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    {['bKash', 'Nagad', 'Rocket'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDepositMethod(m)}
                        className={`py-3 text-xs font-semibold rounded-xl border transition ${
                          depositMethod === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-lg font-extrabold font-mono text-white">
                      {gateways[depositMethod.toLowerCase()] || gateways.bkash}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(gateways[depositMethod.toLowerCase()] || gateways.bkash)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-white flex items-center space-x-1"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Sender Mobile Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="01700000000"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Deposit Amount (BDT) *</label>
                      <input
                        type="number"
                        required
                        placeholder="500"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Transaction ID (TrxID) *</label>
                      <input
                        type="text"
                        required
                        placeholder="TRX12345"
                        value={depositTrxId}
                        onChange={(e) => setDepositTrxId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono uppercase"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white text-sm">
                      Submit Deposit Reference
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === 'withdraw' ? (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Wallet Cashout Gateway</h2>
                <span className="text-xl font-extrabold text-emerald-400">৳{(userData?.earningsWallet || 0).toFixed(2)}</span>
              </div>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['bKash', 'Nagad', 'Rocket'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`py-2.5 text-xs font-semibold rounded-xl border ${
                        withdrawMethod === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Recipient Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="01700000000"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder={`Min ৳${gateways.minWithdraw || 100}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white text-sm">
                  Submit Cashout Request
                </button>
              </form>
            </div>
          ) : activeTab === 'referral' ? (
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold text-amber-400">Referral Program</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={userData?.referralCode || 'N/A'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-cyan-400 font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(userData?.referralCode || '')}
                  className="px-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl text-white"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-lg font-semibold text-slate-200">Deposit History</h3>
                {myDeposits.length === 0 ? (
                  <p className="text-xs text-slate-400">No deposit history.</p>
                ) : (
                  myDeposits.map(d => (
                    <div key={d.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between text-xs">
                      <span>৳{d.amount} ({d.method}) — {d.trxId}</span>
                      <span className="text-amber-400 font-semibold">{d.status}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-lg font-semibold text-slate-200">Withdrawal History</h3>
                {myWithdrawals.length === 0 ? (
                  <p className="text-xs text-slate-400">No withdrawal history.</p>
                ) : (
                  myWithdrawals.map(w => (
                    <div key={w.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between text-xs">
                      <span>৳{w.amount} ({w.method}) — {w.account}</span>
                      <span className="text-amber-400 font-semibold">{w.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold text-blue-400">User Profile Settings</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!authUser) return;
                  await updateDoc(doc(db, 'users', authUser.uid), { name: profileName });
                  setUserData({ ...userData, name: profileName });
                  alert('Profile updated!');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input
                    type="text"
                    disabled
                    value={authUser.email}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Mobile Number</label>
                  <input
                    type="text"
                    disabled
                    value={userData?.phone || 'N/A'}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-500"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm">
                  Save Profile Name
                </button>
              </form>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white text-sm"
              >
                Logout Account
              </button>
            </div>
          ) : null}
        </main>
      </div>

      {/* Original Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 md:px-8 mt-12 text-xs text-slate-400 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-blue-400 text-sm">KODA Task</span>
            <span>•</span>
            <span>Task-Based Earning Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs"
            >
              <Send className="h-3.5 w-3.5" />
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
            <p className="text-xs text-slate-400">
              Visit Link:{' '}
              <a href={selectedTask.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                {selectedTask.link}
              </a>
            </p>
            <div className="text-4xl font-mono text-blue-400 font-bold py-4 bg-slate-950 rounded-xl border border-slate-800">
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
            {taskCompletedMsg ? (
              <button
                onClick={async () => {
                  const newEarnings = (userData?.earningsWallet || 0) + Number(selectedTask.reward);
                  const updatedCompleted = { ...completedTasks, [selectedTask.id]: Date.now() };
                  if (authUser) {
                    await updateDoc(doc(db, 'users', authUser.uid), {
                      earningsWallet: newEarnings,
                      completedTasks: updatedCompleted
                    });
                  }
                  setUserData({ ...userData, earningsWallet: newEarnings, completedTasks: updatedCompleted });
                  setCompletedTasks(updatedCompleted);
                  setSelectedTask(null);
                  alert(`Collected ৳${selectedTask.reward}!`);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white shadow-lg"
              >
                Collect Reward (৳{selectedTask.reward})
              </button>
            ) : (
              <p className="text-sm text-slate-400 animate-pulse">Please wait while the task timer completes...</p>
            )}
            <button onClick={() => setSelectedTask(null)} className="text-xs text-slate-500 hover:text-slate-300 underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAdminRow({ usr }) {
  const [depWallet, setDepWallet] = useState(usr.depositWallet || 0);
  const [earnWallet, setEarnWallet] = useState(usr.earningsWallet || 0);

  return (
    <div className="bg-[#0D1018] border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <p className="font-bold text-white">{usr.name || 'User'} ({usr.email})</p>
          <p className="text-slate-400 font-mono text-[11px]">Phone: {usr.phone || 'N/A'} • Package: {usr.package || 'None'}</p>
        </div>
        {usr.email !== ADMIN_EMAIL && (
          <button
            onClick={async () => {
              const nextStatus = usr.status === 'Banned' ? 'Active' : 'Banned';
              await updateDoc(doc(db, 'users', usr.id), { status: nextStatus });
            }}
            className={`px-3 py-1 rounded-lg font-semibold ${
              usr.status === 'Banned' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {usr.status === 'Banned' ? 'Unban' : 'Ban'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        <input
          type="number"
          value={depWallet}
          onChange={(e) => setDepWallet(e.target.value)}
          className="bg-[#111520] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
        />
        <input
          type="number"
          value={earnWallet}
          onChange={(e) => setEarnWallet(e.target.value)}
          className="bg-[#111520] border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
        />
        <button
          onClick={async () => {
            await updateDoc(doc(db, 'users', usr.id), {
              depositWallet: Number(depWallet),
              earningsWallet: Number(earnWallet)
            });
            alert(`Updated balances for ${usr.email}`);
          }}
          className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
        >
          Update Wallet
        </button>
      </div>
    </div>
  );
}
