import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import Userdetail from '../components/user/Userdetail'
import UserProfile from '../components/user/UserProfile'
import Vehicles from '../components/Vehicles/List/VehiclesList'
import VehicleDetail from '../components/Vehicles/Details/VehicleDetail';
import VehicleTypes from '../components/Vehicles/Features/VehicleTypes';
import VehiclesDocument from '../components/Vehicles/Features/Documents';
import VehicleInsurance from '../components/Vehicles/Features/Insurance';
import MaintenanceSchedules from '../components/Vehicles/Features/Maintenance'
import VehicleInspections from '../components/Vehicles/Features/Inspections';
import FuelLogsDashboard from '../components/Vehicles/Features/Fuel';
import TiresDashboard from '../components/Vehicles/Features/Tires';
import DriversList from '../components/Drivers/DriversList'
import DriverDetail from '../components/Drivers/DriverDetail'
import CustomersDashboard from '../components/customers/customers'
import Consigners from '../components/customers/consigners'
import Consignees from '../components/customers/consignees'
import Brokers from '../components/customers/brokers';

import Agents from '../components/customers/agents';
import CustomerDetail from '../components/customers/Details/CustomerDetail';

import OrdersDashboard from '../components/orders/Orders';
import OrderDetail from '../components/orders/OrderDetail';
import TripsDashboard from '../components/orders/Trips';
import TripDetail from '../components/orders/TripDetail';
import TripNestedSubResource from '../components/orders/TripNestedSub-Resource';
import CreateTripPage from '../components/orders/CreateTripPage';

import CargoDashboard from '../components/orders/Cargo';
import CargoDetail from '../components/orders/CargoDetail';
import ErrorBoundary from '../components/orders/ErrorBoundary';

// Global Driver Views
import AllDocuments from '../components/Drivers/all/AllDocuments';
import AllContacts from '../components/Drivers/all/AllContacts';
import AllTraining from '../components/Drivers/all/AllTraining';
import AllMedical from '../components/Drivers/all/AllMedical';
import AllPerformance from '../components/Drivers/all/AllPerformance';
import AllIncidents from '../components/Drivers/all/AllIncidents';
import AllAttendance from '../components/Drivers/all/AllAttendance';
import AllAssignments from '../components/Drivers/all/AllAssignments';
import AllSalaryStructures from '../components/Drivers/all/AllSalaryStructures';

import Roles from '../components/user/Roles'
import Permission from '../components/user/Permission'
import Activities from '../components/user/Activities'
import Session from '../components/user/Session'
import AccessoriesDashboard from '../components/Vehicles/Features/Accessories';
import VehicleTollTagsDashboard from '../components/Vehicles/Features/TollTags';
import VehicleOwnershipDashboard from '../components/Vehicles/Features/Ownership';
import InvoicesDashboard from '../components/Finance/Invoices/InvoicesDashboard';
import CustomerPaymentsDashboard from '../components/Finance/Payments/CustomerPaymentsDashboard';
import OwnerPaymentsDashboard from '../components/Finance/Payments/OwnerPaymentsDashboard';
import PayrollDashboard from '../components/Finance/Payroll/PayrollDashboard';
import TDSDashboard from '../components/Finance/TDS/TDSDashboard';
import FinanceLedgerPage from '../components/Finance/Ledger/FinanceLedgerPage';
import ReconciliationsPage from '../components/Finance/Reconciliations/ReconciliationsPage';
import AdvancesDashboard from '../components/Finance/Advances/AdvancesDashboard';
import InvoiceDetail from '../components/Finance/Invoices/InvoiceDetail';
import AdvanceDetail from '../components/Finance/Advances/AdvanceDetail';
import FinanceReportsDashboard from '../components/Finance/Reports/FinanceReportsDashboard';
import FinancePeriodsPage from '../components/Finance/Periods/FinancePeriodsPage';
import PayrollEntriesPage from '../components/Finance/Payroll/PayrollEntriesPage';
import FinanceDashboard from '../components/Finance/FinanceDashboard';
import VehicleCostsPage from '../components/Finance/VehicleCosts/VehicleCostsPage';
import TripFinanceList from '../components/Finance/TripFinance/TripFinanceList';
import TripFinanceDetail from '../components/Finance/TripFinance/TripFinanceDetail';
import CustomerBillingList from '../components/Finance/CustomerBilling/CustomerBillingList';
import CustomerBillingDetail from '../components/Finance/CustomerBilling/CustomerBillingDetail';
import DriverFinanceList from '../components/Finance/DriverFinance/DriverFinanceList';
import DriverFinanceDetail from '../components/Finance/DriverFinance/DriverFinanceDetail';
import ExpensesDashboard from '../components/Finance/Expenses/ExpensesDashboard';
import ExpenseDetail from '../components/Finance/Expenses/ExpenseDetail';
import SettlementHub from '../components/Finance/Settlement/SettlementHub';
import TripSettlementDetail from '../components/Finance/Settlement/TripSettlementDetail';
import DriverSettlementDetail from '../components/Finance/Settlement/DriverSettlementDetail';
import LRRecordsPage from '../components/orders/LRRecordsPage';
import GeographyDashboard from '../components/MasterData/GeographyDashboard';
import RateCardsDashboard from '../components/MasterData/RateCardsDashboard';
import VehicleTypesMasterDashboard from '../components/MasterData/VehicleTypesMasterDashboard';
import SystemConfigDashboard from '../components/MasterData/SystemConfigDashboard';
import DeviceInventoryDashboard from '../components/Tracking/DeviceInventoryDashboard';
import DeviceAssignmentsDashboard from '../components/Tracking/DeviceAssignmentsDashboard';

const Routing = () => {
  return (
    <Routes>
      <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="dashboard"
        element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>}
      >
        {/* Default child route */}
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DashboardOverview />} />
        <Route path="users" element={<Userdetail />} />
        <Route path="users/:userid" element={<UserProfile />} />
        <Route path="users/roles" element={<Roles />} />
        <Route path="users/permission" element={<Permission />} />
        <Route path="users/activities" element={<Activities />} />
        <Route path="users/session" element={<Session />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="drivers" element={<DriversList />} />

        {/* Global Driver Routes */}
        <Route path="drivers/documents" element={<AllDocuments />} />
        <Route path="drivers/emergency-contacts" element={<AllContacts />} />
        <Route path="drivers/training" element={<AllTraining />} />
        <Route path="drivers/medical" element={<AllMedical />} />
        <Route path="drivers/performance" element={<AllPerformance />} />
        <Route path="drivers/incidents" element={<AllIncidents />} />
        <Route path="drivers/attendance" element={<AllAttendance />} />
        <Route path="drivers/vehicle-assignments" element={<AllAssignments />} />
        <Route path="drivers/salary" element={<AllSalaryStructures />} />

        {/* Specific Driver Detail Route (Must be last to avoid catching sub-paths as IDs) */}
        <Route path="drivers/:id" element={<DriverDetail />} />
        <Route path="vehicles/types" element={<VehicleTypes />} />
        <Route path="vehicles/documents" element={<VehiclesDocument />} />
        <Route path="vehicles/insurance" element={<VehicleInsurance />} />
        <Route path="vehicles/maintenance" element={<MaintenanceSchedules />} />
        <Route path="vehicles/inspections" element={<VehicleInspections />} />
        <Route path="vehicles/tires" element={<TiresDashboard />} />
        <Route path="vehicles/accessories" element={<AccessoriesDashboard />} />
        <Route path="vehicles/fuel" element={<FuelLogsDashboard />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="vehicles/:id/edit" element={<VehicleDetail />} />
        <Route path="vehicles/toll-tags" element={<VehicleTollTagsDashboard />} />
        <Route path="vehicles/toll-tags/:id" element={<VehicleTollTagsDashboard />} />
        <Route path="vehicles/ownership" element={<VehicleOwnershipDashboard />} />
        <Route path="vehicles/ownership/:id" element={<VehicleOwnershipDashboard />} />

        {/* Customer Routes */}
        <Route path="customers/:id" element={<CustomerDetail />} />

        {/* Specific Customer Detail Route (Must be last to avoid catching sub-paths as IDs) */}

        <Route path="customers" element={<CustomersDashboard />} />
        <Route path="customers/consignors" element={<Consigners />} />
        <Route path="customers/consigners" element={<Navigate to="/tenant/dashboard/customers/consignors" replace />} />
        <Route path="customers/consignees" element={<Consignees />} />
        <Route path="customers/brokers" element={<Brokers />} />
        <Route path="customers/agents" element={<Agents />} />


        {/* Dynamic Detail Routes */}
        <Route path="orders" element={<ErrorBoundary><OrdersDashboard /></ErrorBoundary>} />
        <Route path="orders/lr-records" element={<LRRecordsPage />} />

        <Route path="orders/trips" element={<ErrorBoundary><TripsDashboard /></ErrorBoundary>} />
        <Route path="orders/trips/new" element={<ErrorBoundary><CreateTripPage /></ErrorBoundary>} />
        <Route path="orders/trips/:id" element={<ErrorBoundary><TripDetail /></ErrorBoundary>} />

        <Route path="orders/cargo" element={<ErrorBoundary><CargoDashboard /></ErrorBoundary>} />
        <Route path="orders/cargo/:id" element={<ErrorBoundary><CargoDetail /></ErrorBoundary>} />

        <Route path="orders/deliveries" element={<Navigate to="/tenant/dashboard/orders/trips" replace />} />
        <Route path="orders/deliveries/:id" element={<Navigate to="/tenant/dashboard/orders/trips" replace />} />

        <Route path="orders/:id" element={<ErrorBoundary><OrderDetail /></ErrorBoundary>} />
        <Route path="orders/:id/trips" element={<ErrorBoundary><TripNestedSubResource /></ErrorBoundary>} />
        <Route path="orders/trip-manager" element={<Navigate to="/tenant/dashboard/orders/trips" replace />} />
        {/* Finance */}
        <Route path="finance" element={<FinanceDashboard />} />
        <Route path="finance/trips" element={<TripFinanceList />} />
        <Route path="finance/trips/:tripId" element={<TripFinanceDetail />} />
        <Route path="finance/billing" element={<CustomerBillingList />} />
        <Route path="finance/billing/:customerId" element={<CustomerBillingDetail />} />
        <Route path="finance/drivers" element={<DriverFinanceList />} />
        <Route path="finance/drivers/:driverId" element={<DriverFinanceDetail />} />
        <Route path="finance/invoices" element={<InvoicesDashboard />} />
        <Route path="finance/invoices/:id" element={<InvoiceDetail />} />
        <Route path="finance/periods" element={<FinancePeriodsPage />} />
        <Route path="finance/customer-ledger" element={<Navigate to="/tenant/dashboard/finance/billing" replace />} />
        <Route path="finance/customer-ledger/:customerId" element={<Navigate to="/tenant/dashboard/finance/billing" replace />} />
        <Route path="finance/vehicle-costs" element={<VehicleCostsPage />} />
        <Route path="finance/vehicle-costs/:vehicleId" element={<VehicleCostsPage />} />

        <Route path="finance/ledger" element={<FinanceLedgerPage />} />
        <Route path="finance/reconciliations" element={<ReconciliationsPage />} />
        <Route path="finance/customer-payments" element={<CustomerPaymentsDashboard />} />
        <Route path="finance/owner-payments" element={<OwnerPaymentsDashboard />} />
        <Route path="finance/payroll/:periodId/entries" element={<PayrollEntriesPage />} />
        <Route path="finance/payroll" element={<PayrollDashboard />} />
        <Route path="finance/tds" element={<TDSDashboard />} />
        <Route path="finance/advances" element={<AdvancesDashboard />} />
        <Route path="finance/advances/:id" element={<AdvanceDetail />} />
        <Route path="finance/expenses" element={<ExpensesDashboard />} />
        <Route path="finance/expenses/:id" element={<ExpenseDetail />} />
        <Route path="finance/settlement" element={<SettlementHub />} />
        <Route path="finance/settlement/trip/:tripId" element={<TripSettlementDetail />} />
        <Route path="finance/settlement/driver/:driverId" element={<DriverSettlementDetail />} />
        <Route path="finance/reports" element={<FinanceReportsDashboard />} />

        {/* Master Data */}
        <Route path="master-data/geography" element={<GeographyDashboard />} />
        <Route path="master-data/rate-cards" element={<RateCardsDashboard />} />
        <Route path="master-data/vehicle-types" element={<VehicleTypesMasterDashboard />} />
        <Route path="master-data/system-config" element={<SystemConfigDashboard />} />

        {/* Tracking */}
        <Route path="tracking/devices" element={<DeviceInventoryDashboard />} />
        <Route path="tracking/device-assignments" element={<DeviceAssignmentsDashboard />} />




      </Route>
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  )
}

export default Routing