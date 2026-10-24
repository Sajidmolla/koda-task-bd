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
  serverTimestamp 
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
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrxId, setDepositTrxId] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  const [gateways, setGateways] = useState({
    bkash: "01737966207",
    nagad: "01737966207",
    rocket: "01737966207",
    binance: "KODA-PAY-USDT-ID"
  });

  const [tasks, setTasks] = useState([
    { id: '1', title: 'YouTube Video Watch & Subscribe', reward: 10, link: '#' },
    { id: '2', title: 'Facebook Page Follow & Like', reward: 8, link: '#' },
    { id: '3', title: 'Telegram Channel Join', reward: 5, link: '#' },
    { id: '4', title: 'App Download & Review', reward: 14, link: '#' },
    { id: '5', title: 'Website Visit & Read Article', reward: 12, link: '#' }
  ]);

  const [allDeposits, setAllDeposits] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [timer, setTimer] = useState(25);
  const [timerActive, setTimerActive] = useState(false);
  const [taskCompletedMsg, setTaskCompletedMsg] = useState('');

  const packages = [
    { name: 'Bronze Package', price: 500, duration: '1 Month' },
    { name: 'Silver Package', price: 1200, duration: '1 Month' },
    { name: 'Gold Package', price: 2500, duration: '1 Month' },
    { name: 'Platinum Package', price: 3500, duration: '1 Month' }
  ];

  const t = {
    en: {
      brand: "KODA Task",
      subBrand: "Membership-Based Task Platform",
      dashboard: "Dashboard",
      tasks: "Tasks",
      wallet: "Wallet & Transactions",
      membership: "Membership",
      adminPanel: "Admin Panel",
      logout: "Logout",
      login: "Sign In",
      signup: "Sign Up",
      depositWallet: "Deposit Wallet",
      earningsWallet: "Earnings Wallet",
      activePackage: "Active Package",
      noPackage: "No Active Package",
      deposit: "Deposit",
      withdraw: "Withdraw",
      submit: "Submit",
      cancel: "Cancel"
    },
    bn: {
      brand: "KODA Task",
      subBrand: "Membership-Based Task Platform",
      dashboard: "ড্যাশবোর্ড",
      tasks: "টাস্কসমূহ",
      wallet: "ওয়ালেট ও লেনদেন",
      membership: "মেম্বারশিপ",
      adminPanel: "অ্যাডমিন প্যানেল",
      logout: "লগআউট",
      login: "সাইন ইন",
      signup: "রেজিস্ট্রেশন",
      depositWallet: "ডিপোজিট ওয়ালেট",
      earningsWallet: "আর্নিংস ওয়ালেট",
      activePackage: "সক্রিয় প্যাকেজ",
      noPackage: "কোনো প্যাকেজ নেই",
      deposit: "ডিপোজিট",
      withdraw: "উত্তোলন",
      submit: "জমা দিন",
      cancel: "বাতিল"
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email === '1roxi1@gmail.com') {
          setIsAdmin(true);
          fetchAllAdminData();
        } else {
          setIsAdmin(false);
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
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
            await setDoc(docRef, initialData);
            setUserData(initialData);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllAdminData = async () => {
    try {
      const depSnap = await getDocs(collection(db, "deposits"));
      setAllDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const witSnap = await getDocs(collection(db, "withdrawals"));
      setAllWithdrawals(witSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const usrSnap = await getDocs(collection(db, "users"));
      setAllUsers(usrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

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
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-blue-400 tracking-wide">{t[lang].brand}</h1>
          <p className="text-xs text-slate-400">{t[lang].subBrand}</p>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-semibold border border-slate-700"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-300 font-medium">
                {isAdmin ? '👑 Admin' : userData?.name || user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded font-medium text-white"
              >
                {t[lang].logout}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-lg text-white shadow-lg"
            >
              {t[lang].login} / {t[lang].signup}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 hidden md:flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            📊 {t[lang].dashboard}
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            📋 {t[lang].tasks}
          </button>
          <button 
            onClick={() => setActiveTab('wallet')} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            💳 {t[lang].wallet}
          </button>
          <button 
            onClick={() => setActiveTab('membership')} 
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'membership' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            ⭐ {t[lang].membership}
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:bg-slate-800'}`}
            >
              ⚙️ {t[lang].adminPanel}
            </button>
          )}
        </aside>

        <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
          {isAdmin && activeTab === 'admin' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-indigo-400">Admin Control Panel</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Manage Payment Gateways</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400">bKash Personal</label>
                    <input 
                      type="text" 
                      value={gateways.bkash} 
                      onChange={(e)=>setGateways({...gateways, bkash: e.target.value})} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Nagad Personal</label>
                    <input 
                      type="text" 
                      value={gateways.nagad} 
                      onChange={(e)=>setGateways({...gateways, nagad: e.target.value})} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Rocket Personal</label>
                    <input 
                      type="text" 
                      value={gateways.rocket} 
                      onChange={(e)=>setGateways({...gateways, rocket: e.target.value})} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Binance ID</label>
                    <input 
                      type="text" 
                      value={gateways.binance} 
                      onChange={(e)=>setGateways({...gateways, binance: e.target.value})} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Deposit Audit Requests</h3>
                <div className="space-y-3">
                  {allDeposits.length === 0 ? <p className="text-sm text-slate-400">No deposit requests.</p> : 
                    allDeposits.map(dep => (
                      <div key={dep.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
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
                              fetchAllAdminData();
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
            </div>
          ) : activeTab === 'wallet' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-400">Wallet & Transactions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200">Add Deposit</h3>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm">
                    <p className="text-xs text-slate-400 mb-1">Send money to our company personal number:</p>
                    <p className="font-bold text-blue-400">{depositMethod}: {gateways[depositMethod.toLowerCase()] || gateways.bkash}</p>
                  </div>
                  <form onSubmit={handleDepositSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Method</label>
                      <select 
                        value={depositMethod} 
                        onChange={(e)=>setDepositMethod(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
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
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Transaction ID (TrxID)</label>
                      <input 
                        type="text" 
                        required 
                        value={depositTrxId} 
                        onChange={(e)=>setDepositTrxId(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-white text-sm">
                      Submit Deposit
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200">Request Withdrawal</h3>
                  <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Method</label>
                      <select 
                        value={withdrawMethod} 
                        onChange={(e)=>setWithdrawMethod(e.target.value)}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
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
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Account Number</label>
                      <input 
                        type="text" 
                        required 
                        value={withdrawAccount} 
                        onChange={(e)=>setWithdrawAccount(e.target.value)} 
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded font-bold text-white text-sm">
                      Request Withdraw
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === 'membership' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-amber-400">Membership Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{pkg.name}</h3>
                      <p className="text-2xl font-bold text-blue-400 mt-2">৳{pkg.price}</p>
                      <p className="text-xs text-slate-400 mt-1">Duration: {pkg.duration}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (!user) { setShowAuthModal(true); return; }
                        handleBuyPackage(pkg);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 rounded font-bold text-white text-sm"
                    >
                      Activate Package
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <p className="text-sm text-slate-400">{t[lang].depositWallet}</p>
                  <h3 className="text-2xl font-bold text-blue-400 mt-2">৳ {userData ? userData.depositWallet : 0}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <p className="text-sm text-slate-400">{t[lang].earningsWallet}</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-2">৳ {userData ? userData.earningsWallet : 0}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <p className="text-sm text-slate-400">{t[lang].activePackage}</p>
                  <h3 className="text-lg font-bold text-amber-400 mt-2">
                    {userData?.package ? userData.package : t[lang].noPackage}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Available Tasks</h3>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <div>
                        <h4 className="font-medium text-slate-200">{task.title}</h4>
                        <span className="text-xs text-blue-400 font-semibold">Reward: ৳{task.reward}</span>
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
                          setTimer(25);
                          setTimerActive(true);
                          setTaskCompletedMsg('');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded text-white"
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

      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-100">{selectedTask.title}</h3>
            <div className="text-4xl font-mono text-blue-400 font-bold py-4">
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-white shadow-lg"
              >
                Collect Reward (৳{selectedTask.reward})
              </button>
            ) : (
              <p className="text-sm text-slate-400">Please wait while the task timer completes...</p>
            )}
            <button 
              onClick={() => setSelectedTask(null)}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
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
++                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Mobile Number</label>
                    <input 
                      type="text" 
                      required 
                      value={phone} 
                      onChange={(e)=>setPhone(e.target.value)} 
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value= {email} 
                  onChange={(e)=>setEmail(e.target.value)} 
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white shadow-lg"
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
