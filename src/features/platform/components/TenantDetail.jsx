// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useQueryClient } from '@tanstack/react-query'  
// import {
//   useTenants,
//   useTenant,
//   useTenantStats,
//   useSuspendTenant,
//   useActivateTenant,
//   useCreateTenant,
//   useUpdateTenant,
//   useDeleteTenant,

// } from '../queries/tenantQuery'

// // ── Status badge colors ──────────────────────────────────────
// const STATUS_STYLES = {
//   ACTIVE:               'bg-green-100 text-green-700',
//   INACTIVE:             'bg-gray-100 text-gray-500',
//   SUSPENDED:            'bg-red-100 text-red-600',
//   PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
//   BLOCKED:              'bg-red-200 text-red-800',
// }

// const VERIFICATION_STYLES = {
//   VERIFIED: 'bg-blue-100 text-blue-700',
//   PENDING:  'bg-yellow-100 text-yellow-600',
//   REJECTED: 'bg-red-100 text-red-600',
// }

// const BUSINESS_TYPE_STYLES = {
//   LOGISTICS:  'bg-indigo-100 text-indigo-700',
//   TRANSPORT:  'bg-cyan-100 text-cyan-700',
//   FREIGHT:    'bg-orange-100 text-orange-700',
//   COURIER:    'bg-purple-100 text-purple-700',
//   OTHER:      'bg-gray-100 text-gray-600',
// }



// // ── Small reusable Badge ─────────────────────────────────────
// function Badge({ label, styleClass }) {
//   return (
//     <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${styleClass}`}>
//       {label}
//     </span>
//   )
// }

// // ── Stat card at the top ─────────────────────────────────────
// function StatCard({ label, value, sub, valueColor }) {
//   return (
//     <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
//       <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{label}</p>
//       <p className={`text-4xl font-bold ${valueColor ?? 'text-gray-800'}`}>{value ?? '—'}</p>
//       <p className="text-xs text-gray-400">{sub}</p>
//     </div>
//   )
// }

// // ── Confirm dialog for suspend/activate ─────────────────────
// function ConfirmDialog({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, showReason, reason, onReasonChange }) {
//   if (!open) return null
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
//         <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
//         <p className="text-sm text-gray-500">{message}</p>
//         {showReason && (
//           <textarea
//             className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
//             rows={3}
//             placeholder="Enter reason..."
//             value={reason}
//             onChange={e => onReasonChange(e.target.value)}
//           />
//         )}
//         <div className="flex justify-end gap-3 pt-2">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={onConfirm}
//             className={`px-4 py-2 rounded-lg text-sm text-white font-medium ${confirmClass}`}
//           >
//             {confirmLabel}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ── Main Page ────────────────────────────────────────────────
// export default function TenantsPage() {
//   const navigate = useNavigate()

//   // Filters & pagination state
//   const [search, setSearch]     = useState('')
//   const [status, setStatus]     = useState('')
//   const [verification, setVerification] = useState('')
//   const [page, setPage]         = useState(1)
//   const PAGE_SIZE = 10

//   // Dialog state
//   const [dialog, setDialog] = useState({
//     open: false,
//     type: null,       // 'suspend' | 'activate'
//     tenant: null,
//     reason: '',
//   })

//   // ── API Calls ──────────────────────────────────────────────
//   const { data, isLoading, isError } = useTenants({
//     page,
//     page_size: PAGE_SIZE,
//     ...(search       && { search }),
//     ...(status       && { status }),
//     ...(verification && { verification_status: verification }),
//   })

//   const { data: stats, isLoading: statsLoading } = useTenantStats()

//   const { mutate: suspend, isPending: suspending } = useSuspendTenant()
//   const { mutate: activate, isPending: activating } = useActivateTenant()

//   const tenants    = data?.results ?? []
//   const totalCount = data?.count   ?? 0
//   const totalPages = Math.ceil(totalCount / PAGE_SIZE)

//   // ── Handlers ──────────────────────────────────────────────
//   const handleReset = () => {
//     setSearch('')
//     setStatus('')
//     setVerification('')
//     setPage(1)
//   }

//   const openSuspend = (tenant) =>
//     setDialog({ open: true, type: 'suspend', tenant, reason: '' })

//   const openActivate = (tenant) =>
//     setDialog({ open: true, type: 'activate', tenant, reason: '' })

//   const closeDialog = () =>
//     setDialog({ open: false, type: null, tenant: null, reason: '' })

//   const handleConfirm = () => {
//     if (dialog.type === 'suspend') {
//       suspend(
//         { id: dialog.tenant.id, reason: dialog.reason },
//         { onSuccess: closeDialog }
//       )
//     } else if (dialog.type === 'activate') {
//       activate(dialog.tenant.id, { onSuccess: closeDialog })
//     }
//   }

//   // ── Render ────────────────────────────────────────────────
//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
//           <p className="text-sm text-gray-400 mt-0.5">Manage all registered tenants on the platform</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => navigate('/admin/dashboard/tenants/new')}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
//         >
//           <span className="text-lg leading-none">+</span> New Tenant
//         </button>
//       </div>

//       {/* Stat Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard
//           label="Total Tenants"
//           value={statsLoading ? '...' : stats?.total}
//           sub="All registered"
//           valueColor="text-gray-800"
//         />
//         <StatCard
//           label="Active"
//           value={statsLoading ? '...' : stats?.active}
//           sub="Currently running"
//           valueColor="text-green-600"
//         />
//         <StatCard
//           label="Pending Verify"
//           value={statsLoading ? '...' : stats?.pending_verify}
//           sub="Awaiting review"
//           valueColor="text-yellow-500"
//         />
//         <StatCard
//           label="Suspended"
//           value={statsLoading ? '...' : stats?.suspended}
//           sub="Access blocked"
//           valueColor="text-red-500"
//         />
//       </div>

//       {/* Filters */}
//       <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
//         <input
//           type="text"
//           placeholder="Search by name, code, email..."
//           value={search}
//           onChange={e => { setSearch(e.target.value); setPage(1) }}
//           className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <select
//           value={status}
//           onChange={e => { setStatus(e.target.value); setPage(1) }}
//           className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">All Status</option>
//           <option value="ACTIVE">Active</option>
//           <option value="INACTIVE">Inactive</option>
//           <option value="SUSPENDED">Suspended</option>
//           <option value="PENDING_VERIFICATION">Pending</option>
//         </select>
//         <select
//           value={verification}
//           onChange={e => { setVerification(e.target.value); setPage(1) }}
//           className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">All Verification</option>
//           <option value="VERIFIED">Verified</option>
//           <option value="PENDING">Pending</option>
//           <option value="REJECTED">Rejected</option>
//         </select>
//         <button
//           type="button"
//           onClick={handleReset}
//           className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
//         >
//           ↺ Reset
//         </button>
//       </div>

//       {/* Table */}
//       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
//         {isLoading ? (
//           <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
//             Loading tenants...
//           </div>
//         ) : isError ? (
//           <div className="flex items-center justify-center py-20 text-red-400 text-sm">
//             Failed to load tenants. Check your connection.
//           </div>
//         ) : tenants.length === 0 ? (
//           <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
//             No tenants found.
//           </div>
//         ) : (
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
//                 <th className="px-5 py-3 text-left font-medium">Company</th>
//                 <th className="px-5 py-3 text-left font-medium">Tenant Code</th>
//                 <th className="px-5 py-3 text-left font-medium">Contact</th>
//                 <th className="px-5 py-3 text-left font-medium">Business Type</th>
//                 <th className="px-5 py-3 text-left font-medium">Status</th>
//                 <th className="px-5 py-3 text-left font-medium">Verification</th>
//                 <th className="px-5 py-3 text-left font-medium">Created</th>
//                 <th className="px-5 py-3 text-left font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {tenants.map(tenant => (
//                 <tr key={tenant.id} className="hover:bg-gray-50 transition">
//                   {/* Company */}
//                   <td className="px-5 py-3.5">
//                     <p className="font-medium text-gray-800">{tenant.company_name}</p>
//                     <p className="text-xs text-gray-400">{tenant.trading_name ?? tenant.schema_name}</p>
//                   </td>

//                   {/* Tenant Code */}
//                   <td className="px-5 py-3.5">
//                     <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
//                       {tenant.tenant_code}
//                     </span>
//                   </td>

//                   {/* Contact */}
//                   <td className="px-5 py-3.5">
//                     <p className="text-gray-700">{tenant.primary_contact_email}</p>
//                     {tenant.primary_contact_name && (
//                       <p className="text-xs text-gray-400">{tenant.primary_contact_name}</p>
//                     )}
//                   </td>

//                   {/* Business Type */}
//                   <td className="px-5 py-3.5">
//                     {tenant.business_type ? (
//                       <Badge
//                         label={tenant.business_type}
//                         styleClass={BUSINESS_TYPE_STYLES[tenant.business_type] ?? 'bg-gray-100 text-gray-600'}
//                       />
//                     ) : (
//                       <span className="text-gray-300">—</span>
//                     )}
//                   </td>
//                   <td className="px-5 py-3.5">
//                     {tenant.status ? (
//                       <Badge
//                         label={tenant.status}
//                         styleClass={STATUS_STYLES[tenant.status] ?? 'bg-gray-100 text-gray-600'}
//                       />
//                     ) : (
//                       <span className="text-gray-300">—</span>
//                     )}
//                   </td>
//                   <td className="px-5 py-3.5">
//                     {tenant.verification_status ? (
//                       <Badge
//                         label={tenant.verification_status}
//                         styleClass={VERIFICATION_STYLES[tenant.verification_status] ?? 'bg-gray-100 text-gray-600'}
//                       />
//                     ) : (
//                       <span className="text-gray-300">—</span>
//                     )}
//                   </td>

//                   {/* Status */}
//                   {/* <td className="px-5 py-3.5">
//                     <Badge
//                       label={tenant.status}
//                       styleClass={STATUS_STYLES[tenant.status] ?? 'bg-gray-100 text-gray-500'}
//                     />
//                   </td>

//                   {/* Verification */}
//                   {/* <td className="px-5 py-3.5">
//                     <Badge
//                       label={tenant.verification_status}
//                       styleClass={VERIFICATION_STYLES[tenant.verification_status] ?? 'bg-gray-100 text-gray-500'}
//                     />
//                   </td> */} 

//                   {/* Created */}
//                   <td className="px-5 py-3.5 text-gray-400 text-xs">
//                     {new Date(tenant.created_at).toLocaleDateString('en-IN', {
//                       day: '2-digit', month: 'short', year: 'numeric'
//                     })}
//                   </td>

//                   {/* Actions */}
//                   <td className="px-5 py-3.5">
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() => navigate(`${tenant.id}`)}
//                         className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
//                       >
//                         View
//                       </button>
//                       {tenant.status === 'SUSPENDED' ? (
//                         <button
//                           type="button"
//                           onClick={() => openActivate(tenant)}
//                           className="px-3 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
//                         >
//                           Activate
//                         </button>
//                       ) : tenant.status === 'ACTIVE' ? (
//                         <button
//                           type="button"
//                           onClick={() => openSuspend(tenant)}
//                           className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
//                         >
//                           Suspend
//                         </button>
//                       ) : null}
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
//             <span>
//               Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
//             </span>
//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={() => setPage(p => Math.max(1, p - 1))}
//                 disabled={page === 1}
//                 className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
//               >
//                 ← Prev
//               </button>
//               <span className="font-medium text-gray-700">{page} / {totalPages}</span>
//               <button
//                 type="button"
//                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
//                 disabled={page === totalPages}
//                 className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
//               >
//                 Next →
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Confirm Dialog */}
//       <ConfirmDialog
//         open={dialog.open}
//         title={dialog.type === 'suspend' ? `Suspend ${dialog.tenant?.company_name}?` : `Activate ${dialog.tenant?.company_name}?`}
//         message={
//           dialog.type === 'suspend'
//             ? 'This will immediately block all logins for this tenant.'
//             : 'This will restore full access for this tenant.'
//         }
//         confirmLabel={
//           suspending || activating
//             ? 'Please wait...'
//             : dialog.type === 'suspend' ? 'Yes, Suspend' : 'Yes, Activate'
//         }
//         confirmClass={dialog.type === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
//         showReason={dialog.type === 'suspend'}
//         reason={dialog.reason}
//         onReasonChange={(val) => setDialog(d => ({ ...d, reason: val }))}
//         onConfirm={handleConfirm}
//         onCancel={closeDialog}
//       />
//     </div>
//   )
// }

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useTenants,
  useTenantStats,
  useSuspendTenant,
  useActivateTenant,
  useTenant,
  useDeleteTenant
} from '../queries/tenantQuery'
import { formatDateShort } from '@/utils/dateFormat'

// ── Status badge colors ──────────────────────────────────────
const STATUS_STYLES = {
  ACTIVE:               'bg-green-100 text-green-700',
  INACTIVE:             'bg-gray-100 text-gray-500',
  SUSPENDED:            'bg-red-100 text-red-600',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
  BLOCKED:              'bg-red-200 text-red-800',
}

const VERIFICATION_STYLES = {
  VERIFIED: 'bg-blue-100 text-blue-700',
  PENDING:  'bg-yellow-100 text-yellow-600',
  REJECTED: 'bg-red-100 text-red-600',
}

const BUSINESS_TYPE_STYLES = {
  LOGISTICS:  'bg-indigo-100 text-indigo-700',
  TRANSPORT:  'bg-cyan-100 text-cyan-700',
  FREIGHT:    'bg-orange-100 text-orange-700',
  COURIER:    'bg-purple-100 text-purple-700',
  OTHER:      'bg-gray-100 text-gray-600',
}

// ── Badge ────────────────────────────────────────────────────
function Badge({ label, styleClass }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${styleClass}`}>
      {label}
    </span>
  )
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{label}</p>
      <p className={`text-4xl font-bold ${valueColor ?? 'text-gray-800'}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

// ── Info Row (used inside modal) ─────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  )
}

// ── Tenant Detail Modal ──────────────────────────────────────
function TenantDetailModal({ tenantId, onClose, onEdit }) {
  const { data: tenant, isLoading } = useTenant(tenantId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tenant Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-6">
          {isLoading ? (
            <p className="text-center text-gray-400 text-sm py-10">Loading...</p>
          ) : !tenant ? (
            <p className="text-center text-red-400 text-sm py-10">Failed to load details.</p>
          ) : (
            <>
              {/* Company Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{tenant.company_name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{tenant.trading_name ?? tenant.schema_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {tenant.status && (
                    <Badge label={tenant.status} styleClass={STATUS_STYLES[tenant.status] ?? 'bg-gray-100 text-gray-600'} />
                  )}
                  {tenant.verification_status && (
                    <Badge label={tenant.verification_status} styleClass={VERIFICATION_STYLES[tenant.verification_status] ?? 'bg-gray-100 text-gray-600'} />
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold border-b pb-1">Company</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Tenant Code"   value={tenant.tenant_code} />
                  <InfoRow label="Business Type" value={tenant.business_type} />
                  <InfoRow label="Company Size"  value={tenant.company_size} />
                  <InfoRow label="Member Since"  value={formatDateShort(tenant.created_at)} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold border-b pb-1">Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Contact Person" value={tenant.primary_contact_person} />
                  <InfoRow label="Email"          value={tenant.primary_contact_email} />
                  <InfoRow label="Phone"          value={tenant.primary_contact_phone} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold border-b pb-1">Address</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Line 1"      value={tenant.registered_address?.line1} />
                  <InfoRow label="City"        value={tenant.registered_address?.city} />
                  <InfoRow label="Country"     value={tenant.registered_address?.country} />
                  <InfoRow label="Postal Code" value={tenant.registered_address?.postal_code} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {tenant && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => { onClose(); onEdit(tenant.id) }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Tenant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Confirm Dialog ───────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, showReason, reason, onReasonChange }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
        {showReason && (
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter reason..."
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm text-white font-medium ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function TenantsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch]             = useState('')
  const [status, setStatus]             = useState('')
  const [verification, setVerification] = useState('')
  const [page, setPage]                 = useState(1)
  const PAGE_SIZE = 10

  // ✅ Modal state — stores selected tenant id
  const [viewTenantId, setViewTenantId] = useState(null)

  const [dialog, setDialog] = useState({
    open: false, type: null, tenant: null, reason: '',
  })

  // ── Queries ────────────────────────────────────────────────
  const { data, isLoading, isError } = useTenants({
    page,
    page_size: PAGE_SIZE,
    ...(search       && { search }),
    ...(status       && { status }),
    ...(verification && { verification_status: verification }),
  })

  const { data: stats, isLoading: statsLoading } = useTenantStats()
  const { mutate: suspend,  isPending: suspending  } = useSuspendTenant()
  const { mutate: deleteTenant, isPending: deleting } = useDeleteTenant()
  const { mutate: activate, isPending: activating  } = useActivateTenant()

  const tenants    = data?.results ?? []
  const totalCount = data?.count   ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // ── Handlers ──────────────────────────────────────────────
  const handleReset  = () => { setSearch(''); setStatus(''); setVerification(''); setPage(1) }
  const openSuspend  = (t) => setDialog({ open: true, type: 'suspend',  tenant: t, reason: '' })
  const openActivate = (t) => setDialog({ open: true, type: 'activate', tenant: t, reason: '' })
  const openDelete = (t) => setDialog({ open: true, type: 'delete', tenant: t, reason: '' })
  const closeDialog  = ()  => setDialog({ open: false, type: null, tenant: null, reason: '' })

  const handleConfirm = () => {
    const onSuccess = () => {
      queryClient.refetchQueries({ queryKey: ['tenants'],      type: 'active' })
      queryClient.refetchQueries({ queryKey: ['tenant-stats'], type: 'active' })
      closeDialog()
    }
    const onError = () => closeDialog()
    if (dialog.type === 'suspend') {
      suspend({ id: dialog.tenant.id, reason: dialog.reason }, { onSuccess, onError })
    } else if (dialog.type === 'activate') {
      activate(dialog.tenant.id, { onSuccess, onError })
    }
     else if (dialog.type === 'delete') {
  deleteTenant(dialog.tenant.id, { onSuccess, onError })
}
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all registered tenants on the platform</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard/tenants/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <span className="text-lg leading-none">+</span> New Tenant
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tenants"  value={statsLoading ? '...' : stats?.total}          sub="All registered"    valueColor="text-gray-800"   />
        <StatCard label="Active"         value={statsLoading ? '...' : stats?.active}         sub="Currently running" valueColor="text-green-600"  />
        <StatCard label="Pending Verify" value={statsLoading ? '...' : stats?.pending_verify} sub="Awaiting review"   valueColor="text-yellow-500" />
        <StatCard label="Suspended"      value={statsLoading ? '...' : stats?.suspended}      sub="Access blocked"    valueColor="text-red-500"    />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, code, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING_VERIFICATION">Pending</option>
        </select>
        <select value={verification} onChange={e => { setVerification(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="button" onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition">
          ↺ Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading tenants...</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-red-400 text-sm">Failed to load tenants. Check your connection.</div>
        ) : tenants.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">No tenants found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Tenant Code</th>
                <th className="px-5 py-3 text-left font-medium">Contact</th>
                <th className="px-5 py-3 text-left font-medium">Business Type</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Verification</th>
                <th className="px-5 py-3 text-left font-medium">Created</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition">

                  {/* ✅ Company name click → open modal */}
                  <td className="px-5 py-3.5">
                    <p
                      className="font-medium text-gray-800 hover:text-blue-600 cursor-pointer transition"
                      onClick={() => setViewTenantId(tenant.id)}
                    >
                      {tenant.company_name}
                    </p>
                    <p className="text-xs text-gray-400">{tenant.trading_name ?? tenant.schema_name}</p>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{tenant.tenant_code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700">{tenant.primary_contact_email}</p>
                    {tenant.primary_contact_name && <p className="text-xs text-gray-400">{tenant.primary_contact_name}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    {tenant.business_type
                      ? <Badge label={tenant.business_type} styleClass={BUSINESS_TYPE_STYLES[tenant.business_type] ?? 'bg-gray-100 text-gray-600'} />
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {tenant.status
                      ? <Badge label={tenant.status} styleClass={STATUS_STYLES[tenant.status] ?? 'bg-gray-100 text-gray-600'} />
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {tenant.verification_status
                      ? <Badge label={tenant.verification_status} styleClass={VERIFICATION_STYLES[tenant.verification_status] ?? 'bg-gray-100 text-gray-600'} />
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {formatDateShort(tenant.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => navigate(`${tenant.id}`)}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
                        Edit
                      </button>
                      <button type="button" onClick={() => openDelete(tenant)}
  className="px-3 py-1 text-xs rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 border border-gray-200 transition">
  Delete
</button>
                      {tenant.status === 'SUSPENDED' ? (
                        <button type="button" onClick={() => openActivate(tenant)}
                          className="px-3 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white transition">
                          Activate
                        </button>
                      ) : tenant.status === 'ACTIVE' ? (
                        <button type="button" onClick={() => openSuspend(tenant)}
                          className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white transition">
                          Suspend
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                ← Prev
              </button>
              <span className="font-medium text-gray-700">{page} / {totalPages}</span>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Tenant Detail Modal */}
      {viewTenantId && (
        <TenantDetailModal
          tenantId={viewTenantId}
          onClose={() => setViewTenantId(null)}
          onEdit={(id) => navigate(`${id}`)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
  open={dialog.open}
  title={
    dialog.type === 'suspend' ? `Suspend ${dialog.tenant?.company_name}?` :
    dialog.type === 'delete'  ? `Delete ${dialog.tenant?.company_name}?`  :
    `Activate ${dialog.tenant?.company_name}?`
  }
  message={
    dialog.type === 'suspend' ? 'This will immediately block all logins for this tenant.' :
    dialog.type === 'delete'  ? 'This will permanently delete this tenant. This cannot be undone.' :
    'This will restore full access for this tenant.'
  }
  confirmLabel={
    suspending || activating || deleting ? 'Please wait...' :
    dialog.type === 'suspend' ? 'Yes, Suspend' :
    dialog.type === 'delete'  ? 'Yes, Delete'  :
    'Yes, Activate'
  }
  confirmClass={
    dialog.type === 'delete'  ? 'bg-red-600 hover:bg-red-700' :
    dialog.type === 'suspend' ? 'bg-red-500 hover:bg-red-600' :
    'bg-green-500 hover:bg-green-600'
  }
  showReason={dialog.type === 'suspend'}
  reason={dialog.reason}
  onReasonChange={(val) => setDialog(d => ({ ...d, reason: val }))}
  onConfirm={handleConfirm}
  onCancel={closeDialog}
/>
    </div>
  )
}
