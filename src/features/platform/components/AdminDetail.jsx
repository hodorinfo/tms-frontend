import React, { useState } from 'react';
import { Search, RotateCcw, Plus, Eye, ShieldAlert, Trash2, Edit, X, User, Mail, Lock, Phone, CheckCircle2 } from 'lucide-react';
import { useAdmins, useDeleteAdmin, useUpdateAdmin, useCreateAdmin } from '../queries/adminsQuery';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const AdminDetail = () => {
  const { data: adminsData, isLoading, isError, error } = useAdmins(1);
  const deleteMutation = useDeleteAdmin();
  const updateMutation = useUpdateAdmin();
  const createMutation = useCreateAdmin();


  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'view'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    phone: ''
  });

  const stats = [
    { label: "TOTAL ADMINS", value: adminsData?.count || 0, sub: "All registered", border: "border-gray-100" },
  ];

  const admins = adminsData?.results || [];

  const handleOpenModal = (type, admin = null) => {
    setModalType(type);
    setSelectedAdmin(admin);
    if (type === 'edit' && admin) {
      setFormData({
        username: admin.username,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        phone: admin.phone || ''
      });
    } else if (type === 'create') {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        phone: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedAdmin(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number (10-15 digits)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (modalType === 'create') {
      createMutation.mutate(formData, {
        onSuccess: () => handleCloseModal()
      });
    } else if (modalType === 'edit') {
      updateMutation.mutate({ id: selectedAdmin.id, ...formData }, {
        onSuccess: () => handleCloseModal()
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteMutation.mutate(id);
    }
  };

  // Shimmer Components
  const ShimmerRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-3 bg-gray-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
      <td className="px-6 py-4"><div className="flex gap-2 justify-end"><div className="h-8 w-8 bg-gray-100 rounded"></div><div className="h-8 w-8 bg-gray-100 rounded"></div></div></td>
    </tr>
  );

  const ShimmerCard = () => (
    <div className="bg-white p-6 rounded-xl border-b-4 border-gray-50 shadow-sm animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-16 mb-4"></div>
      <div className="h-8 bg-gray-300 rounded w-10 mb-2"></div>
      <div className="h-3 bg-gray-100 rounded w-24"></div>
    </div>
  );

  return (
    <main className="p-8 bg-[#F4F5F7] min-h-screen relative">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">Platform Admins</h2>
          <p className="text-gray-500 text-sm">Manage administrative access and roles</p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="bg-[#0052CC] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-colors shadow-sm"
        >
          <Plus size={18} /> New Admin
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isLoading
          ? Array(1).fill(0).map((_, i) => <ShimmerCard key={i} />)
          : stats.map((stat, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl border-b-4 ${stat.border} shadow-sm transition-transform hover:scale-[1.02]`}>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${stat.textColor || 'text-[#172B4D]'}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
            </div>
          ))
        }
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search admins..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 font-medium">
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Admin Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <ShimmerRow key={i} />)
              ) : isError ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-red-500">Error: {error.message}</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors group">
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleOpenModal('view', admin)}
                    >
                      <p className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{admin.first_name} {admin.last_name}</p>
                      <p className="text-xs text-gray-400">@{admin.username}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-[#0052CC] text-[10px] font-bold px-2 py-1 rounded border border-blue-100">SUPER ADMIN</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-400 font-medium">{admin.created_at ? formatDate(admin.created_at) : 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenModal('edit', admin)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500 border border-red-100 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-xl font-bold text-[#172B4D]">
                {modalType === 'create' ? 'Create New Admin' : modalType === 'edit' ? 'Update Admin' : 'Admin Details'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {modalType === 'view' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-[#0052CC] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedAdmin?.first_name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#172B4D]">{selectedAdmin?.first_name} {selectedAdmin?.last_name}</h4>
                      <p className="text-sm text-gray-500">@{selectedAdmin?.username}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                      <p className="text-sm font-semibold text-[#172B4D] mt-1">{selectedAdmin?.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                      <p className="text-sm font-semibold text-[#172B4D] mt-1">{selectedAdmin?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</label>
                      <p className="text-sm font-semibold text-[#172B4D] mt-1">Platform Super Admin</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="adminForm" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="text"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">@</span>
                      <input
                        type="text"
                        name="username"
                        required
                        disabled={modalType === 'edit'}
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="johndoe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                        placeholder="john@platform.com"
                      />
                    </div>
                    {formErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.email}</p>}
                  </div>

                  {modalType === 'create' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="password"
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    {formErrors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.phone}</p>}
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              {modalType !== 'view' && (
                <button
                  type="submit"
                  form="adminForm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {modalType === 'create' ? 'Create Admin' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDetail;

