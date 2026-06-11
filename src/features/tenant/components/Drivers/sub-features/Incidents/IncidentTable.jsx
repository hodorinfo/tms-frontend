import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { SEVERITY_STYLES, INCIDENT_TYPE_STYLES, STATUS_STYLES } from '../../common/constants';
import { getInitials } from '../../common/utils';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const IncidentTable = ({ incidents, onEdit, onView, showDriver = false, driverMap = {}, vehicleMap = {}, tripMap = {}, userMap = {}, currentUser = null }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime(dateStr);
  };

  const headers = [
    { key: 'incident_type', label: 'Incident Type' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'trip_id', label: 'Trip Number' },
    { key: 'incident_date', label: 'Incident Date' },
    { key: 'location', label: 'Location' },
    { key: 'severity', label: 'Severity' },
    { key: 'resolution_status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {headers.map(h => (
              <th key={h.key} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map(inc => (
            <tr 
              key={inc.id} 
              onClick={() => onView && onView(inc)}
              className="hover:bg-[#f7f9ff] transition-colors group cursor-pointer"
            >
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[inc.driver]?.name || inc.driver_name || '-')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[inc.driver]?.name || inc.driver_name || '-'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[inc.driver]?.employee_id || inc.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.incident_type_display ?? inc.incident_type}
                  styles={INCIDENT_TYPE_STYLES[inc.incident_type]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#0052CC]">
                <span className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {vehicleMap[inc.vehicle] || inc.vehicle_registration || inc.vehicle || '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-bold">
                {tripMap[inc.trip_id] || inc.trip_id || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {formatDate(inc.incident_date)}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 truncate whitespace-nowrap">
                {inc.location ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.severity_display ?? inc.severity}
                  styles={SEVERITY_STYLES[inc.severity]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.resolution_status_display ?? inc.resolution_status}
                  styles={STATUS_STYLES[inc.resolution_status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TableActions
                  onEdit={() => onEdit(inc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentTable;
