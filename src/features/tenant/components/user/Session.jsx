import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Monitor, Smartphone, Globe, Shield, ShieldCheck, ShieldAlert, X, Eye, Clock, Calendar, User, ChevronLeft, ChevronRight, LogOut, Info } from 'lucide-react';
import { useSessions, useRevokeSession } from '../../queries/users/sessionsQuery';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const Session = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: sessionsData, isLoading, isError, error } = useSessions({
    page: currentPage,
    page_size: 20,
    search: debouncedSearch
  });

  const revokeMutation = useRevokeSession();

  const sessions = sessionsData?.results || [];
  const totalCount = sessionsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  const getPaginationRange = () => {
    const range = [];
    range.push(1);
    if (currentPage > 2) range.push('...');
    if (currentPage !== 1) range.push(currentPage);
    if (totalPages > currentPage + 1) range.push('...');
    if (totalPages > currentPage && totalPages !== 1) range.push(totalPages);
    return range;
  };

  const stats = [
    { label: "ACTIVE SESSIONS", value: totalCount, sub: "Currently authenticated", color: "blue" },
    { label: "UNIQUE DEVICES", value: new Set(sessions.map(s => s.user_agent)).size, sub: "Known endpoints", color: "green" },
  ];

  const handleOpenDetailModal = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handleRevoke = () => {
    if (!selectedSession) return;

    if (window.confirm(`Are you sure you want to terminate the session for @${selectedSession.username || 'user'}?`)) {
      revokeMutation.mutate(selectedSession.id, {
        onSuccess: () => {
          handleCloseModal();
          // Success toast could be triggered here
        },
        onError: (err) => {
          window.alert(err.message || "Failed to revoke session");
        }
      });
    }
  };

  return (
    <div className="p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden flex flex-col relative font-sans text-slate-900">
      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        <div className="w-1/4">
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight uppercase">Active Sessions</h1>
          <p className="text-gray-500 text-sm tracking-tight">Monitor real-time user authentication</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search by username, email or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
            >
              <RotateCcw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-28"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}:</span>
                <span className={`text-[18px] font-black ${stat.color === 'blue' ? 'text-[#0052CC]' : 'text-green-600'}`}>{stat.value}</span>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15 border-b border-gray-50">
            {/* Quick Filters Placeholder */}
            <div className="flex items-center gap-3 px-5 py-2">
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block px-5" />

            <div className="flex items-center gap-2 px-5 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
              >
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {getPaginationRange().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-1 text-gray-400 font-bold select-none text-xs">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100'
                            : 'bg-white border border-gray-100 text-[#172B4D] hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || !sessionsData?.next || isLoading}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl mt-0">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User Identification</th>
                <th className="px-6 py-4">Login Metadata</th>
                <th className="px-6 py-4">Endpoint / IP</th>
                <th className="px-6 py-4">Security Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-6">
                      <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Monitor size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active sessions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((session, idx) => (
                  <tr key={session.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center text-white">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 leading-none mb-1">@{session.username || 'unknown'}</span>
                          <span className="text-[10px] text-gray-400 font-bold italic line-clamp-1">{session.email || 'System Account'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tighter flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-300" />
                          {session.login_at ? formatDate(session.login_at) : 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-300" />
                          {session.login_at ? new Date(session.login_at).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-gray-500 font-bold tracking-tighter flex items-center gap-1.5">
                          <Globe size={11} className="text-gray-400" />
                          {session.ip_address || '0.0.0.0'}
                        </span>
                        <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1.5 truncate max-w-40 font-bold uppercase">
                          {session.device_type === 'DESKTOP' ? <Monitor size={11} /> : <Smartphone size={11} />}
                          {session.device_type || 'Unknown Device'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleOpenDetailModal(session)}
                        className="p-2.5 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-bold text-[#172B4D]">{sessions.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> items
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-7 bg-linear-to-r from-[#0052CC] to-[#0747A6] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Session Insight</h3>
                <p className="text-[10px] text-blue-100 font-bold opacity-80 uppercase tracking-widest mt-0.5">Reference ID: {selectedSession.id}</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Identity Header */}
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0052CC]">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#172B4D]">@{selectedSession.username}</h4>
                  <p className="text-sm text-gray-400 font-bold">{selectedSession.email}</p>
                </div>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Login Timestamp</p>
                  <p className="text-xs font-bold text-gray-900">{formatDateTime(selectedSession.login_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Network Source</p>
                  <p className="text-xs font-bold text-gray-900 font-mono">{selectedSession.ip_address || '0.0.0.0'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hardware Type</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    {selectedSession.device_type === 'DESKTOP' ? <Monitor size={14} /> : <Smartphone size={14} />}
                    <span className="uppercase">{selectedSession.device_type}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Auth Integrity</p>
                  <div className="flex items-center gap-2 text-green-600">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-black uppercase tracking-tighter">Verified</span>
                  </div>
                </div>
              </div>

              {/* User Agent Block */}
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={12} />
                  Device Agent Signature
                </p>
                <p className="text-xs font-mono text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100 italic">
                  {selectedSession.user_agent || 'Standard authentication provider signature.'}
                </p>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={handleRevoke}
                disabled={revokeMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all group disabled:opacity-50"
              >
                {revokeMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                ) : (
                  <LogOut size={16} />
                )}
                Terminate Session
              </button>

              <button
                onClick={handleCloseModal}
                className="px-8 py-3 bg-[#0052CC] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-[#0747A6] transition-all"
              >
                Keep Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Session;
