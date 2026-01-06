import React, { useState } from 'react';
import { User, UserRole } from './types';
import { Login } from './components/Login';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Protected Route: Admin Only
  if (currentUser.role === UserRole.ADMIN) {
    return (
      <div className="h-screen w-full font-sans text-slate-900 bg-slate-50">
        <AdminDashboard onLogout={handleLogout} />
      </div>
    );
  }

  // Protected Route: Student Only
  if (currentUser.role === UserRole.STUDENT) {
    return (
      <div className="h-screen w-full font-sans text-slate-900 bg-slate-50">
        <StudentDashboard user={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  // Fallback: Access Denied for unknown roles
  return (
    <div className="h-screen w-full font-sans text-slate-900 bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-rose-100 max-w-sm w-full">
         <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
         </div>
         <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
         <p className="text-slate-500 mb-6">Your user account does not have a recognized role for this application.</p>
         <button 
           onClick={handleLogout} 
           className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
         >
           Return to Login
         </button>
      </div>
    </div>
  );
};

export default App;