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
  appId: "1:17624227098:web:08af8b7a815921aad520a3",
  measurementId: "G-1N4NEPC6SJ"
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
  const [signupReferralCode, setSignupReferralCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Profile editable states
  const [profileName, setProfileName] = useState('');

  // Deposit gateway states
  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [targetTier, setTargetTier] = useState('Direct Balance');
  
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
    minWithdraw: 100,
    specialReferral: "KODA777"
  });

  // Default Tasks
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

  // Membership Plans
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

  // User personal history
  const [myDeposits, setMyDeposits] = useState([]);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});

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
      referral: "Referral",
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
          minWithdraw: 100,
          specialReferral: "KODA777"
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
            
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              if (data.status === 'Banned') {
                alert("Your account has been banned by admin.");
                signOut(auth);
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
                return;
              }
              if (!data.referralCode || data.referralCode.startsWith("KODA")) {
                const cleanName = (data.name || currentUser.displayName || "User").replace(/\s+/g, '');
                const generatedCode = cleanName + "-" + Math.floor(1000 + Math.random() * 9000);
                await updateDoc(userDocRef, { referralCode: generatedCode });
                data.referralCode = generatedCode;
              }
              setUserData(data);
              setProfileName(data.name || '');
              setCompletedTasks(data.completedTasks || {});
            } else {
              const cleanName = (currentUser.displayName || "User").replace(/\s+/g, '');
              const uniqueRefCode = cleanName + "-" + Math.floor(1000 + Math.random() * 9000);
              const initialData = {
                name: currentUser.displayName || "User",
                email: currentUser.email,
                phone: "",
                referralCode: uniqueRefCode,
                referredBy: "",
                depositWallet: 0,
                earningsWallet: 0,
                referralEarnings: 0,
                package: null,
                status: "Active",
                completedTasks: {}
              };
              await setDoc(userDocRef, initialData);
              setUserData(initialData);
              setProfileName(initialData.name);
              setCompletedTasks({});
            }

            const unsubUser = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const uData = docSnap.data();
                setUserData(uData);
                setCompletedTasks(uData.completedTasks || {});
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
          setCompletedTasks({});
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
    const unsubAllUsr = onSnapshot(collection(db, "users"), async (snapshot) => {
      const usersList = [];
      for (const userDoc of snapshot.docs) {
        const uData = userDoc.data();
        if (!uData.referralCode || uData.referralCode.startsWith("KODA")) {
          const cleanName = (uData.name || "User").replace(/\s+/g, '');
          const newCode = cleanName + "-" + Math.floor(1000 + Math.random() * 9000);
          await updateDoc(doc(db, "users", userDoc.id), { referralCode: newCode });
          uData.referralCode = newCode;
        }
        usersList.push({ id: userDoc.id, ...uData });
      }
      setAllUsers(usersList);
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

  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email address is already in use. Please use another email or sign in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to many failed attempts. Try again later.';
      default:
        return 'An error occurred during authentication. Please check your details and try again.';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err.code));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      const cleanName = fullName.trim().replace(/\s+/g, '');
      const uniqueRefCode = (cleanName || "User") + "-" + Math.floor(1000 + Math.random() * 9000);
      
      const newUserDoc = {
        name: fullName,
        email: email,
        phone: phone,
        referralCode: uniqueRefCode,
        referredBy: signupReferralCode.trim() || "",
        depositWallet: 0,
        earningsWallet: 0,
        referralEarnings: 0,
        package: null,
        status: "Active",
        completedTasks: {}
      };
      await setDoc(doc(db, "users", res.user.uid), newUserDoc);
      setUserData(newUserDoc);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err.code));
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setActiveTab('dashboard');
  };

  const handleSaveGateways = async () => {
    try {
      await setDoc(doc(db, "settings", "gateways"), gateways);
      alert("Payment gateways, minimum withdrawal and special referral updated successfully!");
    } catch (err) {
      alert("Error updating gateways: " + err.message);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || !depositTrxId || !senderPhone) return;
    try {
      await addDoc(collection(db, "deposits"), {
        uid: user.uid,
        email: user.email,
        method: depositMethod,
        amount: Number(depositAmount),
        trxId: depositTrxId,
        senderPhone: senderPhone,
        targetTier: targetTier,
        status: "Pending Verification",
        adminNote: "—",
        timestamp: serverTimestamp()
      });
      alert("Deposit reference submitted successfully! Admin will verify and credit soon.");
      setDepositAmount('');
      setDepositTrxId('');
      setSenderPhone('');
    } catch (err) {
      console.error("Deposit Error Details:", err);
      alert("Error: " + err.message);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    
    if (!userData?.package) {
      alert("⚠️ You must activate a membership package to withdraw funds!");
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
      console.error("Withdrawal Error Details:", err);
      alert("Error: " + err.message);
    }
  };

  const handleBuyPackage = async (pkg) => {
    if (!user) { setShowAuthModal(true); return; }
    if (!userData) return;

    let finalPrice = pkg.price;
    const adminSpecRef = gateways.specialReferral || "KODA777";
    if (userData.referredBy && userData.referredBy.toLowerCase() === adminSpecRef.toLowerCase()) {
      finalPrice = Math.round(pkg.price * 0.9);
    }

    if (userData.depositWallet < finalPrice) {
      alert(`Insufficient deposit balance (৳${userData.depositWallet}). Required ৳${finalPrice}! Please deposit first!`);
      setActiveTab('deposit');
      return;
    }

    try {
      const newDeposit = userData.depositWallet - finalPrice;
      await updateDoc(doc(db, "users", user.uid), {
        depositWallet: newDeposit,
        package: pkg.name
      });

      if (userData.referredBy && userData.referredBy.toLowerCase() !== adminSpecRef.toLowerCase()) {
        const refUserObj = allUsers.find(u => u.referralCode?.toLowerCase() === userData.referredBy.toLowerCase());
        if (refUserObj && refUserObj.package) {
          const currentRefEarnings = refUserObj.earningsWallet || 0;
          await updateDoc(doc(db, "users", refUserObj.id), {
            earningsWallet: currentRefEarnings + 50
          });
        }
      }

      setUserData({ ...userData, depositWallet: newDeposit, package: pkg.name });
      alert(`Successfully activated ${pkg.name} for ৳${finalPrice}!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  const isTaskLocked = (taskId) => {
    const lastCompleted = completedTasks[taskId];
    if (!lastCompleted) return false;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - lastCompleted) < twentyFourHours;
  };

  const getRemainingTime = (taskId) => {
    const lastCompleted = completedTasks[taskId];
    if (!lastCompleted) return "";
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const diff = twentyFourHours - (now - lastCompleted);
    if (diff <= 0) return "";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Available in ${hours}h ${minutes}m`;
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
    { id: 'referral', label: t[lang].referral },
    { id: 'history', label: t[lang].history },
  ];

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.phone?.includes(userSearchQuery) ||
    u.referralCode?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const pendingDepositsCount = allDeposits.filter(d => d.status === 'Pending Verification' || d.status === 'Pending').length;
  const pendingWithdrawalsCount = allWithdrawals.filter(w => w.status === 'Pending').length;
  const totalPendingFinance = pendingDepositsCount + pendingWithdrawalsCount;

  const myReferralCodeDisplay = userData?.referralCode || (userData?.name ? userData.name.replace(/\s+/g, '') + "-1234" : "N/A");
  const myReferralCount = allUsers.filter(u => u.referredBy?.toLowerCase() === myReferralCodeDisplay.toLowerCase()).length;
  const adminSpecRefPlaceholder = gateways.specialReferral || "KODA777";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between w-full overflow-x-hidden">
      <div className="w-full">
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

        <main className="flex-1 p-3 md:p-8 bg-slate-950 overflow-y-auto max-w-7xl mx-auto w-full">
          {isAdmin && activeTab === 'admin' ? (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-indigo-400">Admin Control Panel</h2>
              
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
                              <p className="text-xs text-slate-400">TrxID: <span className="text-blue-400 font-mono">{dep.trxId}</span> | Sender Phone: <span className="text-emerald-400 font-mono">{dep.senderPhone || 'N/A'}</span> | Status: <span className="text-amber-400">{dep.status}</span></p>
                            </div>
                            {(dep.status === 'Pending Verification' || dep.status === 'Pending') && (
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
                            
                            {wit.status === 'Pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                                <input 
                                  type="text" 
                                  placeholder="Payout TrxID"
                                  id={`trx-${wit.id}`}
                                  defaultValue={`PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`}
                                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white w-full sm:w-48 font-mono"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Note"
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
                      placeholder="Validity" 
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

              {adminSubTab === 'tasks' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-200">Tasks & Task Synthesizer</h3>
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

              {adminSubTab === 'users' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200">Registered Users ({filteredUsers.length})</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Adjust wallet balances or toggle account suspension.</p>
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

              {adminSubTab === 'gateways' && (
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl shadow-xl space-y-6">
                  <h3 className="text-lg font-semibold mb-2 text-slate-200">Payment Numbers & Withdrawal Limits</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-400">bKash Personal</label>
                      <input 
                        type="text" 
                        value={gateways.bkash} 
                        onChange={(e)=>setGateways({...gateways, bkash: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Nagad Personal</label>
                      <input 
                        type="text" 
                        value={gateways.nagad} 
                        onChange={(e)=>setGateways({...gateways, nagad: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rocket Personal</label>
                      <input 
                        type="text" 
                        value={gateways.rocket} 
                        onChange={(e)=>setGateways({...gateways, rocket: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Binance ID</label>
                      <input 
                        type="text" 
                        value={gateways.binance} 
                        onChange={(e)=>setGateways({...gateways, binance: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Minimum Withdrawal (৳)</label>
                      <input 
                        type="number" 
                        value={gateways.minWithdraw} 
                        onChange={(e)=>setGateways({...gateways, minWithdraw: Number(e.target.value)})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Special Admin Referral Code</label>
                      <input 
                        type="text" 
                        value={gateways.specialReferral || "KODA777"} 
                        onChange={(e)=>setGateways({...gateways, specialReferral: e.target.value})} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono mt-1"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveGateways}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-sm font-bold rounded-xl text-white shadow-lg"
                  >
                    Save All Settings & Gateways
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
                            <span className="text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">⏱️ Timer: {task.timerSec}s</span>
                            <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline hover:text-indigo-300">Visit Link ↗</a>
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
                          <span className="text-xs text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">⏱️ Timer: {task.timerSec}s</span>
                          <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline hover:text-indigo-300">Visit Link ↗</a>
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
                {userData?.referredBy && userData?.referredBy.toLowerCase() === (gateways.specialReferral || "KODA777").toLowerCase() && (
                  <div className="mt-3 inline-block bg-emerald-950 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-800">
                    🎉 Special Referral Applied: 10% Discount on All Memberships!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map((pkg, idx) => {
                  const hasDiscount = userData?.referredBy && userData?.referredBy.toLowerCase() === (gateways.specialReferral || "KODA777").toLowerCase();
                  const effectivePrice = hasDiscount ? Math.round(pkg.price * 0.9) : pkg.price;
                  return (
                    <div key={pkg.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition shadow-xl relative overflow-hidden">
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{pkg.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{pkg.desc}</p>
                        
                        <div className="my-6">
                          {hasDiscount ? (
                            <div>
                              <span className="text-xl text-slate-500 line-through mr-2">৳{pkg.price}</span>
                              <span className="text-3xl font-extrabold text-emerald-400">৳{effectivePrice}</span>
                            </div>
                          ) : (
                            <span className="text-3xl font-extrabold text-amber-400">৳{pkg.price}</span>
                          )}
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
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl font-bold text-white text-sm shadow-lg transition"
                      >
                        Deposit ৳{effectivePrice} to Activate &gt;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'deposit' ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <p className="text-xs text-blue-400 font-medium">Manual Gateway • Personal Account Verification</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide mt-1">Deposit Verification Gateway</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <span className="text-xs text-emerald-400 font-semibold">Verified Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-lg md:text-xl font-extrabold font-mono text-white tracking-wider">
                        {gateways[depositMethod.toLowerCase()] || gateways.bkash}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(gateways[depositMethod.toLowerCase()] || gateways.bkash)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-white font-medium border border-slate-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Target Membership Tier</label>
                      <select
                        value={targetTier}
                        onChange={(e) => setTargetTier(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="Direct Balance">Direct Balance</option>
                        {packages.map(p => (
                          <option key={p.id} value={`${p.name} — ৳${p.price}`}>
                            {p.name} — ৳{p.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Sender Mobile Number *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="01700000000"
                        value={senderPhone} 
                        onChange={(e)=>setSenderPhone(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Deposit Amount (BDT) *</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="500"
                        value={depositAmount} 
                        onChange={(e)=>setDepositAmount(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Transaction ID (TrxID) *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="TRX12345"
                        value={depositTrxId} 
                        onChange={(e)=>setDepositTrxId(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono uppercase focus:outline-none"
                      />
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white text-sm shadow-lg transition">
                      Submit Deposit Reference
                    </button>
                  </form>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Deposit Audit Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">TrxID</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Sender Phone</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {myDeposits.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-500 font-sans">No deposits recorded yet.</td></tr>
                      ) : (
                        myDeposits.map(d => (
                          <tr key={d.id} className="hover:bg-slate-950/50">
                            <td className="py-3.5 px-4 text-white font-bold">{d.trxId}</td>
                            <td className="py-3.5 px-4 font-sans">{d.method}</td>
                            <td className="py-3.5 px-4">{d.senderPhone || '—'}</td>
                            <td className="py-3.5 px-4 text-emerald-400 font-bold font-sans">৳{d.amount}</td>
                            <td className="py-3.5 px-4 font-sans font-semibold text-amber-400">{d.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'withdraw' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">Wallet Cashout Gateway</h2>
                <p className="text-xs text-slate-400 mt-0.5">Transfer earnings directly to your personal mobile banking account.</p>
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
                            className={`py-2.5 text-xs font-semibold rounded-xl border transition ${withdrawMethod === m ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cashout Amount (BDT) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder={`Min ৳${gateways.minWithdraw || 100}`}
                        value={withdrawAmount} 
                        onChange={(e)=>setWithdrawAmount(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 rounded-xl font-bold text-white text-sm shadow-lg transition">
                      Submit Cashout Request
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 h-fit">
                  <div className="text-blue-400 text-sm font-semibold border-b border-slate-800 pb-3">
                    🛡️ WITHDRAWAL TERMS
                  </div>
                  <p className="text-xs text-slate-400">Minimum withdrawal is ৳{gateways.minWithdraw || 100}. Requests are processed securely.</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-slate-200">Withdrawal Audit Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payout TrxID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {myWithdrawals.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-8 text-slate-500 font-sans">No withdrawal requests logged yet.</td></tr>
                      ) : (
                        myWithdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-slate-950/50">
                            <td className="py-3.5 px-4 text-white font-bold">৳{Number(w.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-4 font-sans font-semibold text-amber-400">{w.status}</td>
                            <td className="py-3.5 px-4 text-slate-300">{w.payoutTrxId || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'referral' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-amber-400">Referral Program & Rewards</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your Unique Referral Link</label>
                  <input 
                    type="text" 
                    readOnly
                    value={`https://kodatask.app/register?ref=${myReferralCodeDisplay}`} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400">Transaction History Log</h2>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-400">User Profile Settings</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5 shadow-xl">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  try {
                    await updateDoc(doc(db, "users", user.uid), { name: profileName });
                    setUserData({ ...userData, name: profileName });
                    alert("Profile name updated successfully!");
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
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm shadow-lg">
                    Save Profile Name
                  </button>
                </form>
                <button onClick={handleLogout} className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white text-sm shadow-lg transition">
                  🚪 Logout Account
                </button>
              </div>
            </div>
          ) : activeTab === 'support' ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-400">Customer Support</h2>
            </div>
          ) : null}
        </main>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 md:px-8 mt-12 text-xs text-slate-400 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <span className="font-bold text-blue-400 text-sm">KODA Task</span>
          <span>© 2026 KODA Task</span>
        </div>
      </footer>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100">{selectedTask.title}</h3>
            <div className="text-4xl font-mono text-blue-400 font-bold py-4 bg-slate-950 rounded-xl border border-slate-800">
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
            {taskCompletedMsg ? (
              <button 
                onClick={async () => {
                  if(!userData?.package) {
                    alert("Active membership required!");
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
              <p className="text-sm text-slate-400 animate-pulse">Please wait...</p>
            )}
            <button onClick={() => setSelectedTask(null)} className="text-xs text-slate-500 underline pt-2">Cancel</button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100">
              {authMode === 'login' ? 'Sign In' : 'Create New Account'}
            </h3>
            {authError && <p className="text-xs text-red-500">{authError}</p>}
            
            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs text-slate-400">Full Name</label>
                    <input type="text" required value={fullName} onChange={(e)=>setFullName(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Mobile Number</label>
                    <input type="text" required value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Referral Code (Optional)</label>
                    <input type="text" value={signupReferralCode} onChange={(e)=>setSignupReferralCode(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-cyan-400 font-mono" />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-slate-400">Email Address</label>
                <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Password</label>
                <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white shadow-lg">
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
            <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-xs text-slate-500 mt-2">Close</button>
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
          <p className="text-xs text-slate-400">Phone: {usr.phone || 'N/A'} | Ref: <span className="text-cyan-400 font-mono">{usr.referralCode || 'N/A'}</span></p>
        </div>
        {usr.email !== '1roxi1@gmail.com' && (
          <button onClick={handleToggleBan} className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${usr.status === 'Banned' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {usr.status === 'Banned' ? 'Unban' : 'Ban'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-3 border-t border-slate-800">
        <div>
          <label className="text-[10px] text-slate-400 uppercase">Deposit Wallet (৳)</label>
          <input type="number" value={depWallet} onChange={(e)=>setDepWallet(e.target.value)} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase">Earnings Wallet (৳)</label>
          <input type="number" value={earnWallet} onChange={(e)=>setEarnWallet(e.target.value)} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" />
        </div>
        <div className="flex items-end h-full pt-1 sm:pt-4">
          <button onClick={handleUpdateBalance} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg text-white shadow">
            Update Balances
          </button>
        </div>
      </div>
    </div>
  );
}
