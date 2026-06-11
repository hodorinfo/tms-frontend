import React, { useState } from 'react';
import {
  LayoutGrid, Users, Globe, Truck, FileText, Shield,
  Wrench, Search, Fuel, Settings, Plug, Tag, ScrollText,
  ChevronDown, ChevronsRight, ChevronsLeft, UserCheck, Phone, GraduationCap,
  HeartPulse, BarChart2, AlertTriangle, CalendarClock, Car, Banknote, UserPlus, UserMinus, Briefcase, Building2,
  Package, MapPinned, GitMerge,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const vehicleSubItems = [
  { name: 'All Vehicles', icon: <Truck size={13} />, path: '/tenant/dashboard/vehicles', badge: null },
  { name: 'Documents', icon: <FileText size={13} />, path: '/tenant/dashboard/vehicles/documents', badge: 2, badgeVariant: 'danger' },
  { name: 'Insurance', icon: <Shield size={13} />, path: '/tenant/dashboard/vehicles/insurance', badge: null },
  { name: 'Maintenance', icon: <Wrench size={13} />, path: '/tenant/dashboard/vehicles/maintenance', badge: 3, badgeVariant: 'warn' },
  { name: 'Inspections', icon: <Search size={13} />, path: '/tenant/dashboard/vehicles/inspections', badge: null },
  { name: 'Fuel Logs', icon: <Fuel size={13} />, path: '/tenant/dashboard/vehicles/fuel', badge: null },
  { name: 'Tires', icon: <Settings size={13} />, path: '/tenant/dashboard/vehicles/tires', badge: null },
  { name: 'Accessories', icon: <Plug size={13} />, path: '/tenant/dashboard/vehicles/accessories', badge: null },
  { name: 'Toll Tags', icon: <Tag size={13} />, path: '/tenant/dashboard/vehicles/toll-tags', badge: null },
  { name: 'Ownership', icon: <ScrollText size={13} />, path: '/tenant/dashboard/vehicles/ownership', badge: null },
];

const driverSubItems = [
  { name: 'All Drivers', icon: <UserCheck size={13} />, path: '/tenant/dashboard/drivers', badge: null },
  { name: 'Documents', icon: <FileText size={13} />, path: '/tenant/dashboard/drivers/documents', badge: null },
  { name: 'Emergency Contacts', icon: <Phone size={13} />, path: '/tenant/dashboard/drivers/emergency-contacts', badge: null },
  { name: 'Training Records', icon: <GraduationCap size={13} />, path: '/tenant/dashboard/drivers/training', badge: null },
  { name: 'Medical Records', icon: <HeartPulse size={13} />, path: '/tenant/dashboard/drivers/medical', badge: null },
  { name: 'Performance', icon: <BarChart2 size={13} />, path: '/tenant/dashboard/drivers/performance', badge: null },
  { name: 'Incidents', icon: <AlertTriangle size={13} />, path: '/tenant/dashboard/drivers/incidents', badge: 1, badgeVariant: 'danger' },
  { name: 'Attendance', icon: <CalendarClock size={13} />, path: '/tenant/dashboard/drivers/attendance', badge: null },
  { name: 'Vehicle Assignments', icon: <Car size={13} />, path: '/tenant/dashboard/drivers/vehicle-assignments', badge: null },
  { name: 'Salary Structures', icon: <Banknote size={13} />, path: '/tenant/dashboard/drivers/salary', badge: null },
];

const userSubItems = [
  { name: 'All Users', icon: <Users size={13} />, path: '/tenant/dashboard/users', badge: null },
  { name: 'Roles', icon: <Shield size={13} />, path: '/tenant/dashboard/users/roles', badge: null },
  { name: 'Permissions', icon: <Shield size={13} />, path: '/tenant/dashboard/users/permission', badge: null },
  { name: 'Activities', icon: <Shield size={13} />, path: '/tenant/dashboard/users/activities', badge: null },
  { name: 'Session', icon: <Shield size={13} />, path: '/tenant/dashboard/users/session', badge: null },
];

const customerSubItems = [
  { name: 'All Customers', icon: <Users size={13} />, path: '/tenant/dashboard/customers', badge: null },
  { name: 'Consignors', icon: <UserPlus size={13} />, path: '/tenant/dashboard/customers/consignors', badge: null },
  { name: 'Consignees', icon: <UserMinus size={13} />, path: '/tenant/dashboard/customers/consignees', badge: null },
  { name: 'Brokers', icon: <Briefcase size={13} />, path: '/tenant/dashboard/customers/brokers', badge: null },
  { name: 'Agents', icon: <Globe size={13} />, path: '/tenant/dashboard/customers/agents', badge: null },
];

const ORDERS_ROOT = '/tenant/dashboard/orders';
const ORDER_MODULE_RESERVED = new Set(['trips', 'cargo', 'lr-records']);
const orderSubItems = [
  { name: 'LR Bookings', icon: <FileText size={13} />, path: '/tenant/dashboard/orders', badge: null },
  { name: 'Trips', icon: <MapPinned size={13} />, path: '/tenant/dashboard/orders/trips', badge: null },
  { name: 'Cargo', icon: <Package size={13} />, path: '/tenant/dashboard/orders/cargo', badge: null },
  { name: 'LR Records', icon: <FileText size={13} />, path: '/tenant/dashboard/orders/lr-records', badge: null },
];

const financeSubItems = [
  { name: 'Dashboard', icon: <BarChart2 size={13} />, path: '/tenant/dashboard/finance', badge: null },
  { name: 'Trips & LR Finance', icon: <GitMerge size={13} />, path: '/tenant/dashboard/finance/trips', badge: null },
  { name: 'Customer Billing', icon: <FileText size={13} />, path: '/tenant/dashboard/finance/billing', badge: null },
  { name: 'Driver Finance', icon: <Users size={13} />, path: '/tenant/dashboard/finance/drivers', badge: null },
  { name: 'Vehicle Costs', icon: <Truck size={13} />, path: '/tenant/dashboard/finance/vehicle-costs', badge: null },
  { name: 'TDS & Compliance', icon: <Shield size={13} />, path: '/tenant/dashboard/finance/tds', badge: null },
  { name: 'Ledger & Journals', icon: <BarChart2 size={13} />, path: '/tenant/dashboard/finance/ledger', badge: null },
  { name: 'Finance Periods', icon: <ScrollText size={13} />, path: '/tenant/dashboard/finance/periods', badge: null },
  { name: 'Reports', icon: <BarChart2 size={13} />, path: '/tenant/dashboard/finance/reports', badge: null },
];

const EXACT_MATCH_PATHS = new Set([
  '/tenant/dashboard/vehicles',
  '/tenant/dashboard/drivers',
  '/tenant/dashboard/users',
  '/tenant/dashboard/customers',
  '/tenant/dashboard/orders',
]);

/** Orders area root (order list/detail + related operational modules). */
function isOrdersNavActive(pathname) {
  if (pathname === ORDERS_ROOT) return true;
  const m = pathname.match(/^\/tenant\/dashboard\/orders\/([^/]+)(\/.*)?$/);
  if (!m) return false;
  return !ORDER_MODULE_RESERVED.has(m[1]);
}

const SubMenu = ({ items, onNavigate }) => (
  <div className="ml-5 mt-1 mb-1 space-y-0.5">
    {items.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}

        onClick={onNavigate}

        end={EXACT_MATCH_PATHS.has(item.path)}

        className={({ isActive }) =>
          `flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[12.5px] transition-all border ${isActive
            ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF] font-semibold'
            : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700 font-normal'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={isActive ? 'text-[#0052CC]' : 'text-gray-400'}>{item.icon}</span>
            <span className="flex-1">{item.name}</span>
          </>
        )}
      </NavLink>
    ))}
  </div>
);

const NavItem = ({ icon, label, isOpen, setIsOpen, isActive, subItems, title, onClick, isCollapsed, setIsCollapsed }) => (
  <div className="relative group">
    <button
      onClick={() => {
        if (onClick) {
          onClick();
          if (isCollapsed && setIsCollapsed) setIsCollapsed(false);
        } else if (!isCollapsed) {
          setIsOpen((o) => !o);
        } else if (isCollapsed) {
          if (setIsCollapsed) setIsCollapsed(false);
          setIsOpen(true);
        }
      }}
      className={`w-full flex ${isCollapsed ? 'flex-col items-center justify-center py-3' : 'items-center gap-3 px-3 py-2.5'} rounded-lg transition-all border ${isActive
        ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF]'
        : 'text-gray-600 hover:bg-gray-100 border-transparent'
        }`}
      title={isCollapsed ? "" : title}
    >
      <div className={`${isActive ? 'text-[#0052CC]' : 'text-gray-400'} ${isCollapsed ? 'mb-1.5' : ''} flex items-center justify-center`}>
        {React.cloneElement(icon, { size: isCollapsed ? 24 : 18 })}
      </div>
      {!isCollapsed ? (
        <>
          <span className="text-sm font-semibold flex-1 text-left animate-in fade-in duration-500">{label}</span>
          {subItems.length > 0 && (
            <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'} ${isActive ? 'text-[#0052CC]' : 'text-gray-400'}`} />
          )}
        </>
      ) : (
        <span className="text-[10px] font-bold text-gray-500 text-center leading-none">{label}</span>
      )}
    </button>

    {/* Expanded Submenu (for desktop/expanded state) */}
    {!isCollapsed && (
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <SubMenu items={subItems} onNavigate={() => setIsCollapsed?.(false)} />
      </div>
    )}

    {/* Floating Submenu for Collapsed State */}
    {isCollapsed && (
      <div className="absolute left-[calc(100%+8px)] top-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] py-2 animate-in fade-in slide-in-from-left-2 duration-200">
        <div className="px-3 py-2 border-b border-gray-100 mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <SubMenu items={subItems} onNavigate={() => setIsCollapsed?.(false)} />
      </div>
    )}
  </div>
);

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isVehiclePath = location.pathname.startsWith('/tenant/dashboard/vehicles');
  const isDriverPath = location.pathname.startsWith('/tenant/dashboard/drivers');
  const isUserPath = location.pathname.startsWith('/tenant/dashboard/users');
  const isCustomerPath = location.pathname.startsWith('/tenant/dashboard/customers');
  const isFinancePath = location.pathname.startsWith('/tenant/dashboard/finance');
  const ordersNavActive = isOrdersNavActive(location.pathname);
  const isOrderPath = location.pathname.startsWith(ORDERS_ROOT);

  const [vehiclesOpen, setVehiclesOpen] = useState(isVehiclePath);
  const [driversOpen, setDriversOpen] = useState(isDriverPath);
  const [usersOpen, setUsersOpen] = useState(isUserPath);
  const [customersOpen, setCustomersOpen] = useState(isCustomerPath);
  const [financeOpen, setFinanceOpen] = useState(isFinancePath);
  const [ordersOpen, setOrdersOpen] = useState(isOrderPath);

  return (
    <aside className={`${isCollapsed ? 'w-24' : 'w-64'} h-screen bg-[#F8FAFC] border-r border-gray-200 flex flex-col p-4 sticky top-0 z-50 transition-all duration-300 ease-in-out`}>
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        {/* Logo Section */}
        <div className={`flex items-center gap-3 px-2 mb-8 ${isCollapsed ? 'flex-col justify-center mb-6' : ''}`}>
          <div className="w-10 h-10 bg-[#0052CC] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <LayoutGrid className="text-white" size={24} />
          </div>
          {!isCollapsed ? (
            <div className="animate-in fade-in duration-500">
              <h1 className="font-bold text-[#172B4D] text-sm leading-tight">Tenant Admin</h1>
              <p className="text-[10px] text-gray-500 font-medium">Management Console</p>
            </div>
          ) : (
            <div className="text-[9px] font-bold text-[#0052CC] mt-1.5 text-center uppercase tracking-wider">Admin</div>
          )}
        </div>

        {/* Navigation Area */}
        <div className="flex-1 -mx-2 px-2">
          <div className="mb-4">
            {!isCollapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 animate-in fade-in duration-500">Main</p>}
            <nav className="space-y-1 mt-2">
              <NavItem
                icon={<LayoutGrid />}
                label="Dashboard"
                isOpen={false}
                setIsOpen={() => { }}
                isActive={location.pathname === '/tenant/dashboard' || location.pathname === '/tenant/dashboard/overview'}
                subItems={[]}
                title="Dashboard Overview"
                onClick={() => {
                  navigate('/tenant/dashboard/overview');
                }}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<Users />}
                label="Users"
                isOpen={usersOpen}
                setIsOpen={setUsersOpen}
                isActive={isUserPath}
                subItems={userSubItems}
                title="Users Management"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<Truck />}
                label="Vehicles"
                isOpen={vehiclesOpen}
                setIsOpen={setVehiclesOpen}
                isActive={isVehiclePath}
                subItems={vehicleSubItems}
                title="Vehicles Management"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<Users />}
                label="Drivers"
                isOpen={driversOpen}
                setIsOpen={setDriversOpen}
                isActive={isDriverPath}
                subItems={driverSubItems}
                title="Drivers Management"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<Building2 />}
                label="Customers"
                isOpen={customersOpen}
                setIsOpen={setCustomersOpen}
                isActive={isCustomerPath}
                subItems={customerSubItems}
                title="Customers Management"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<FileText />}
                label="LR Operations"
                isOpen={ordersOpen}
                setIsOpen={setOrdersOpen}
                isActive={ordersNavActive}
                subItems={orderSubItems}
                title="LR & Trip Operations"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
              <NavItem
                icon={<Banknote />}
                label="Accounting" // finance is not a good name for this module, change this to Accounting
                isOpen={financeOpen}
                setIsOpen={setFinanceOpen}
                isActive={isFinancePath}
                subItems={financeSubItems}
                title="Finance Operations"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Toggle Section */}
      {setIsCollapsed && (
        <div className={`mt-2 pt-4 border-t border-gray-200 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all shadow-sm active:scale-95 border border-transparent hover:border-blue-100"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
