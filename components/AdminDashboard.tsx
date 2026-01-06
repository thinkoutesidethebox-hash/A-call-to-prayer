import React, { useState, useEffect } from 'react';
import { MONTH_NAMES, PRAYER_ORDER, PRAYER_NAMES_AR, getTodayStr } from '../constants';
import { User, UserRole, PrayerType } from '../types';
import { getStudentData, calculateScore, calculateDayScore, resetStudentData, getUsers, addUser, calculatePrayerStats, checkStudentRisk } from '../services/storageService';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';
import { PrayerBoard } from './PrayerBoard';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Add Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<User | null>(null);
  
  // View/Edit Detail State
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);

  // Risk/Notification State
  const [atRiskStudents, setAtRiskStudents] = useState<{ student: User, days: number }[]>([]);
  
  // Default report range based on Simulated Date
  const todayStr = getTodayStr();
  const simulatedDate = new Date(todayStr);
  const firstDayOfMonthStr = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), 1).toISOString().split('T')[0];
  
  const [reportStartDate, setReportStartDate] = useState(firstDayOfMonthStr);
  const [reportEndDate, setReportEndDate] = useState(todayStr);
  
  const [reportStats, setReportStats] = useState<ReturnType<typeof calculatePrayerStats> | null>(null);

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'primary' | 'danger';
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {}
  });

  useEffect(() => {
    const studentUsers = getUsers().filter(u => u.role === UserRole.STUDENT);
    setUsers(studentUsers);

    // Calculate Risk
    const riskList = studentUsers.map(u => {
      const risk = checkStudentRisk(u.id);
      return { student: u, ...risk };
    }).filter(r => r.isAtRisk);
    
    setAtRiskStudents(riskList);

  }, [refreshKey, showAddModal, viewingStudent]); // Refresh when closing view modal to update list scores

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleResetClick = (studentId: string, studentName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Student Data',
      message: `Are you sure you want to permanently delete all prayer records for ${studentName}? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Yes, Reset Data',
      onConfirm: () => {
        resetStudentData(studentId);
        setRefreshKey(prev => prev + 1);
        closeConfirm();
      }
    });
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newUsername || !newPassword) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Confirm New Student',
      message: `Are you sure you want to create a new account for "${newStudentName}" with username "${newUsername}"?`,
      variant: 'primary',
      confirmLabel: 'Create Account',
      onConfirm: () => {
        const newStudent: User = {
          id: `student-${Date.now()}`,
          name: newStudentName.trim(),
          username: newUsername.trim(),
          password: newPassword,
          role: UserRole.STUDENT
        };

        addUser(newStudent);
        setShowAddModal(false);
        // Reset form
        setNewStudentName('');
        setNewUsername('');
        setNewPassword('');
        closeConfirm();
      }
    });
  };

  const openReportModal = (student: User) => {
    setSelectedStudentForReport(student);
    setReportStats(null);
    setShowReportModal(true);
  };

  const handleGenerateReport = () => {
    if (!selectedStudentForReport) return;
    
    const data = getStudentData(selectedStudentForReport.id);
    const stats = calculatePrayerStats(data, reportStartDate, reportEndDate);
    setReportStats(stats);
  };

  const currentMonthIdx = simulatedDate.getMonth();
  const currentYear = simulatedDate.getFullYear();
  const todayStrForScore = getTodayStr();

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <header className="bg-slate-900 text-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400 border border-slate-700">
               <svg className="w-6 h-6 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
               </svg>
           </div>
           <div>
             <h1 className="text-xl font-bold">Admin Portal</h1>
             <p className="text-xs text-slate-400">Manage Students & System</p>
           </div>
         </div>
         <div className="flex gap-2 items-center">
            {/* Notification Badge */}
            {atRiskStudents.length > 0 && (
               <div className="relative mr-2 group cursor-pointer">
                  <div className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1 border border-slate-900">
                    {atRiskStudents.length}
                  </div>
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Tooltipish Dropdown on Hover */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 p-3 hidden group-hover:block">
                     <p className="text-xs font-bold text-slate-500 mb-2 border-b pb-1">At Risk Students</p>
                     <ul className="space-y-1">
                        {atRiskStudents.slice(0, 5).map(r => (
                           <li key={r.student.id} className="text-sm flex justify-between">
                              <span>{r.student.name}</span>
                              <span className="text-rose-600 font-bold">{r.days} days</span>
                           </li>
                        ))}
                        {atRiskStudents.length > 5 && <li className="text-xs text-center text-slate-400 pt-1">and {atRiskStudents.length - 5} more...</li>}
                     </ul>
                  </div>
               </div>
            )}

            <Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-slate-800" onClick={() => setShowAddModal(true)}>
              + Add Student
            </Button>
            <Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-slate-800" onClick={() => setShowSettings(true)}>
              Settings
            </Button>
            <Button variant="secondary" onClick={onLogout}>Logout</Button>
         </div>
       </header>

       <main className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full">
         
         {/* Risk Alert Banner */}
         {atRiskStudents.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-amber-800 text-lg">Attention Required</h3>
                      <p className="text-amber-700 text-sm mb-3">
                        The following students have missed prayers for <span className="font-bold">3 or more consecutive days</span>.
                      </p>
                   </div>
                   <Button variant="ghost" className="text-amber-700 hover:bg-amber-100 h-8 text-xs" onClick={() => setAtRiskStudents([])}>Dismiss</Button>
                </div>
                
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {atRiskStudents.map(item => (
                      <div key={item.student.id} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex justify-between items-center">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-700 block truncate" title={item.student.name}>{item.student.name}</span>
                          <span className="text-xs text-rose-500 font-medium">{item.days} Days Inactive</span>
                        </div>
                        <Button className="text-xs px-2 py-1 h-auto" variant="secondary" onClick={() => openReportModal(item.student)}>Report</Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
         )}

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-slate-700">Student Records</h2>
                    <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded">Total: {users.length}</span>
                </div>
                <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold">Username</th>
                    <th className="p-4 font-semibold">Password</th>
                    <th className="p-4 font-semibold text-center">Today's Score</th>
                    <th className="p-4 font-semibold">Monthly Score</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(student => {
                    const data = getStudentData(student.id);
                    const monthlyScore = calculateScore(data.records, currentMonthIdx, currentYear);
                    const dailyScore = calculateDayScore(data.records[todayStrForScore], todayStrForScore);
                    const isAtRisk = atRiskStudents.some(r => r.student.id === student.id);
                    
                    return (
                      <tr key={student.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isAtRisk ? 'bg-amber-50/50' : ''}`}>
                        <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                           {student.name}
                           {isAtRisk && <span className="w-2 h-2 rounded-full bg-rose-500" title="At Risk"></span>}
                        </td>
                        <td className="p-4 text-slate-500">{student.username}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{student.password}</td>
                        <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${dailyScore.total < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                {dailyScore.total} pts
                            </span>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                             <div className="w-full max-w-[100px] h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${monthlyScore.percentage >= 80 ? 'bg-emerald-500' : monthlyScore.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${monthlyScore.percentage}%` }}
                                ></div>
                             </div>
                             <span className="text-sm font-bold text-slate-700">{monthlyScore.scoreOutOf10}/10</span>
                           </div>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                           <Button variant="secondary" onClick={() => setViewingStudent(student)} className="text-sm py-1 px-3">
                             View
                           </Button>
                           <Button variant="secondary" onClick={() => openReportModal(student)} className="text-sm py-1 px-3">
                             Report
                           </Button>
                           <Button variant="danger" onClick={() => handleResetClick(student.id, student.name)} className="text-sm py-1 px-3">
                             Reset
                           </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        {users.length === 0 ? "No students found. Add one to get started." : "No matching students found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
       </main>

       {/* View/Edit Student Modal */}
       {viewingStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <div>
                     <h3 className="text-xl font-bold text-slate-800">{viewingStudent.name}</h3>
                     <p className="text-xs text-slate-500">
                        Student ID: <span className="font-mono text-slate-700">{viewingStudent.username}</span> | 
                        Password: <span className="font-mono text-slate-700">{viewingStudent.password}</span> | 
                        <span className="text-emerald-600 font-bold ml-1">Admin Mode</span>
                     </p>
                   </div>
                   <Button variant="ghost" onClick={() => setViewingStudent(null)}>Close View</Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                   <PrayerBoard 
                      studentId={viewingStudent.id} 
                      studentName={viewingStudent.name} 
                      isAdmin={true} // Enable Admin Mode overrides
                   />
                </div>
             </div>
          </div>
       )}

       {/* Add Student Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
               <h3 className="text-xl font-bold text-slate-800 mb-4">Add New Student</h3>
               <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input required type="text" className="w-full border rounded p-2" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Username</label>
                    <input required type="text" className="w-full border rounded p-2" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input required type="text" className="w-full border rounded p-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit">Create Account</Button>
                  </div>
               </form>
            </div>
         </div>
       )}

       {/* Generate Report Modal */}
       {showReportModal && selectedStudentForReport && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
               <h3 className="text-xl font-bold text-slate-800 mb-2">Student Report</h3>
               <p className="text-sm text-slate-500 mb-4">Generate statistical report for <span className="font-bold">{selectedStudentForReport.name}</span></p>
               
               <div className="flex flex-col sm:flex-row items-end gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
                  <div className="w-full">
                     <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
                     <input 
                       type="date" 
                       value={reportStartDate}
                       onChange={(e) => setReportStartDate(e.target.value)}
                       className="w-full border rounded px-3 py-1 text-sm"
                     />
                  </div>
                  <div className="w-full">
                     <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
                     <input 
                       type="date" 
                       value={reportEndDate}
                       onChange={(e) => setReportEndDate(e.target.value)}
                       className="w-full border rounded px-3 py-1 text-sm"
                     />
                  </div>
                  <Button onClick={handleGenerateReport} className="text-sm h-full self-end">
                    Generate
                  </Button>
               </div>

               {reportStats && (
                 <div className="space-y-6 animate-in fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                        <div className="text-2xl font-bold text-emerald-700">{reportStats.total.adaa}</div>
                        <div className="text-sm text-emerald-600 font-medium">أداء (Adaa)</div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                        <div className="text-2xl font-bold text-amber-700">{reportStats.total.qada}</div>
                        <div className="text-sm text-amber-600 font-medium">قضاء (Qada)</div>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 text-center">
                        <div className="text-2xl font-bold text-rose-700">{reportStats.total.missed}</div>
                        <div className="text-sm text-rose-600 font-medium">فائتة (Missed)</div>
                      </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                           <tr>
                             <th className="p-3 text-right">الصلاة</th>
                             <th className="p-3 text-center text-emerald-600">أداء</th>
                             <th className="p-3 text-center text-amber-600">قضاء</th>
                             <th className="p-3 text-center text-rose-600">فائتة</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {PRAYER_ORDER.map(p => (
                              <tr key={p}>
                                 <td className="p-3 font-medium text-slate-800 text-right">{PRAYER_NAMES_AR[p]}</td>
                                 <td className="p-3 text-center font-bold text-slate-600">{reportStats.byPrayer[p].adaa}</td>
                                 <td className="p-3 text-center font-bold text-slate-600">{reportStats.byPrayer[p].qada}</td>
                                 <td className="p-3 text-center font-bold text-slate-600">{reportStats.byPrayer[p].missed}</td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={() => setShowReportModal(false)}>Close</Button>
               </div>
            </div>
         </div>
       )}

       {/* System Settings Modal */}
       {showSettings && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
               <h3 className="text-xl font-bold text-slate-800 mb-4">System Settings</h3>
               <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                     <span className="text-sm font-medium text-slate-700">Maintenance Mode</span>
                     <div className="w-10 h-5 bg-slate-300 rounded-full relative cursor-pointer"><div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                     <span className="text-sm font-medium text-slate-700">Strict Time Locking</span>
                     <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer"><div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1"></div></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                     <span className="text-sm font-medium text-slate-700 block mb-2">Prayer Calculation Method</span>
                     <select className="w-full text-sm p-1 border rounded bg-white">
                        <option>Standard (Fixed Time)</option>
                        <option>Solar Calculation (Auto)</option>
                     </select>
                  </div>
               </div>
               <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowSettings(false)}>Close</Button>
                  <Button onClick={() => setShowSettings(false)}>Save Changes</Button>
               </div>
            </div>
         </div>
       )}

       {/* Global Confirmation Modal */}
       <ConfirmationModal 
         isOpen={confirmConfig.isOpen}
         title={confirmConfig.title}
         message={confirmConfig.message}
         variant={confirmConfig.variant}
         onConfirm={confirmConfig.onConfirm}
         onCancel={closeConfirm}
         confirmLabel={confirmConfig.confirmLabel}
       />
    </div>
  );
};