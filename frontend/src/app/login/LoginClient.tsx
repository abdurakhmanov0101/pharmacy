'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, Shield, UserCheck, ShoppingCart, Pill } from 'lucide-react';
import { fetcher } from '@/utils/fetcher';
import { API_BASE } from '@/utils/config';

const DEMO_ACCOUNTS = [
  { email: 'admin@apteka.uz', password: 'Admin1234', role: 'ADMIN', name: 'Admin Rahimov', icon: Shield, color: '#ef4444' },
  { email: 'manager@apteka.uz', password: 'Manager123', role: 'MANAGER', name: 'Sardor Karimov', icon: UserCheck, color: '#f59e0b' },
  { email: 'sotuvchi1@apteka.uz', password: 'Sotuvchi1', role: 'SOTUVCHI', name: 'Aziz Toshmatov', icon: ShoppingCart, color: '#22c55e' },
  { email: 'sotuvchi2@apteka.uz', password: 'Sotuvchi2', role: 'SOTUVCHI', name: 'Malika Yusupova', icon: ShoppingCart, color: '#06b6d4' },
  { email: 'farmatsevt@apteka.uz', password: 'Farma123', role: 'FARMATSEVT', name: 'Dilnoza Nazarova', icon: Pill, color: '#8b5cf6' },
];

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Xato email yoki parol');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.mustChangePassword) {
        setMustChangePassword(true);
      } else {
        router.push('/pos');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Parollar mos kelmadi!');
      return;
    }

    if (newPassword.length < 6) {
      setError("Parol kamida 6 ta belgi bo'lishi kerak");
      return;
    }

    setLoading(true);
    try {
      await fetcher(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
      });
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(user));
      }

      router.push('/pos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
        
        {/* Left — Demo Accounts */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">🔑 Tezkor Kirish</h2>
          <p className="text-white/50 text-sm mb-4">Rolni tanlang va tizimga kiring</p>
          
          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: isSelected ? `${acc.color}20` : 'rgba(255,255,255,0.03)',
                    border: isSelected ? `2px solid ${acc.color}` : '2px solid transparent',
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${acc.color}25` }}>
                    <Icon className="w-5 h-5" style={{ color: acc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{acc.name}</p>
                    <p className="text-white/40 text-xs">{acc.role} · {acc.email}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: acc.color }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="w-full lg:w-[380px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <span className="text-2xl">💊</span>
            </div>
            <h1 className="text-xl font-bold text-white">AptekaOS</h1>
            <p className="text-white/50 text-sm mt-1">
              {mustChangePassword 
                ? "Xavfsizlik uchun parolni o'zgartiring"
                : 'Tizimga kirish'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!mustChangePassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 text-sm transition-all"
                    placeholder="email@apteka.uz"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 text-sm"
              >
                {loading ? 'Tekshirilmoqda...' : 'Tizimga Kirish →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Yangi Parol</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 text-sm transition-all"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Parolni Tasdiqlang</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 text-sm transition-all"
                    placeholder="Parolni qayta kiriting"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 text-sm"
              >
                {loading ? 'Saqlanmoqda...' : 'Saqlash va Davom etish →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
