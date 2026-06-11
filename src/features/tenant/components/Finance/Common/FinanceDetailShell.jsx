import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FinanceDetailShell({
  backTo,
  backLabel = 'Back',
  title,
  subtitle,
  summaryItems = [],
  tabs = [],
  activeTab,
  onTabChange,
  actions,
  children,
}) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-5">
        <button
          type="button"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0052CC] hover:underline"
        >
          <ArrowLeft size={14} /> {backLabel}
        </button>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#172B4D]">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {summaryItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                  <div className={`text-sm font-black mt-1 ${item.className || 'text-[#172B4D]'}`}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tabs.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#0052CC] text-[#0052CC] bg-white'
                    : 'border-transparent text-gray-500 hover:text-[#172B4D]'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px]">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
