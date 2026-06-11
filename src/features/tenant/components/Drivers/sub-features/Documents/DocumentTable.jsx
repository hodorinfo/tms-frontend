import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES as VERIFICATION_STYLES } from '../../common/constants';
import { getExpiryColor, getInitials } from '../../common/utils';
import { AlertCircle } from 'lucide-react';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const DocumentTable = ({ documents, onView, onEdit, showDriver = false, driverMap = {}, userMap = {}, currentUser = null }) => {
  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {[
              'Document Type', 'Document Number', 'Expiry Date', 
              'Issuing Authority', 'Verification', 
              'File URL', 'Actions'
            ].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {documents.map(doc => {
            const isLicense = doc.document_type === 'LICENSE' || (doc.document_type_display && doc.document_type_display.toLowerCase().includes('license'));
            const daysToExpiry = doc.expiry_date ? Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const isExpiringSoon = isLicense && daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0;
            const isAlreadyExpired = isLicense && daysToExpiry !== null && daysToExpiry <= 0;

            return (
              <tr 
                key={doc.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => onView(doc)}
              >
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[doc.driver]?.name || doc.driver_name || '-')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[doc.driver]?.name || doc.driver_name || '-'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[doc.driver]?.employee_id || doc.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                {doc.document_type_display ?? doc.document_type}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {doc.document_number ?? '—'}
                </span>
              </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-600 font-medium">
                      {doc.expiry_date ? formatDate(doc.expiry_date) : '—'}
                    </span>
                    {isExpiringSoon && (
                      <div className="relative group/tooltip">
                        <AlertCircle size={14} className="text-red-500 animate-pulse" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                          <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-gray-700">
                            Expiring in {daysToExpiry} days!
                          </div>
                          <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                        </div>
                      </div>
                    )}
                    {isAlreadyExpired && (
                       <AlertCircle size={14} className="text-red-700" title="Already Expired!" />
                    )}
                  </div>
                </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issuing_authority ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={doc.verification_status_display ?? doc.verification_status}
                  styles={VERIFICATION_STYLES[doc.verification_status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                {doc.file_url 
                  ? (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#0052CC] hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View File
                    </a>
                  )
                  : <span className="text-gray-400">—</span>
                }
              </td>
               <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TableActions
                  onEdit={() => onEdit(doc)}
                />
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;
