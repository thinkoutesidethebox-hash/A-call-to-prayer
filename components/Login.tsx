import React, { useState, useEffect } from 'react';
import { getUsers } from '../services/storageService';
import { User } from '../types';
import { Button } from './Button';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users from storage on mount
    setUsers(getUsers());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username);
    
    // Validate unique credentials
    if (user && user.password === password) {
       onLogin(user);
    } else {
       setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>

          <div className="text-center mb-8 pt-4">
             <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100 shadow-sm relative group">
                {/* Decorative Star */}
                <span className="absolute top-4 right-5 text-emerald-400 text-lg opacity-80 group-hover:scale-125 transition-transform duration-500">✦</span>
                <svg className="w-10 h-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
             </div>
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-serif">A Call to Prayer</h1>
             <div className="mt-2 space-y-1">
                <p className="text-emerald-700 text-lg font-medium font-serif tracking-wide">ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ</p>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-sans">Guide us to the straight path</p>
             </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
               <input 
                 type="text" 
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                 placeholder="Enter username"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                 placeholder="Enter password"
               />
             </div>
             
             {error && <p className="text-rose-500 text-sm text-center bg-rose-50 py-1 rounded border border-rose-100">{error}</p>}

             <Button type="submit" className="w-full py-3 text-lg shadow-md hover:shadow-lg">
               Sign In
             </Button>
          </form>
       </div>
    </div>
  );
};