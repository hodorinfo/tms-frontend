import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  ordersApi, 
  tripsApi, 
  cargoApi, 
  cargoMovementsApi,
  deliveriesApi,
} from '../../api/orders/ordersEndpoint'

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (params) => [...orderKeys.lists(), { params }],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id],

   trips: () => ['trips'],
   tripList: (params) => [...orderKeys.trips(), 'list', { params }],
   tripDetail: (id) => [...orderKeys.trips(), 'detail', id],
   tripStops: (id, params = {}) => [...orderKeys.tripDetail(id), 'stops', { params }],
   tripStatusHistory: (id, params = {}) => [...orderKeys.tripDetail(id), 'status-history', { params }],
   tripDocuments: (id) => [...orderKeys.tripDetail(id), 'documents'],
   tripExpenses: (id) => [...orderKeys.tripDetail(id), 'expenses'],
   tripCharges: (id) => [...orderKeys.tripDetail(id), 'charges'],

  cargo: () => ['cargo'],
  cargoList: (params) => [...orderKeys.cargo(), 'list', { params }],
  cargoDetail: (id) => [...orderKeys.cargo(), 'detail', id],
  cargoMovements: (cargoId, params) => [...orderKeys.cargo(), 'movements', cargoId, { params }],

  deliveries: () => ['deliveries'],
  deliveryList: (params) => [...orderKeys.deliveries(), 'list', { params }],
  deliveryDetail: (id) => [...orderKeys.deliveries(), 'detail', id],
}

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
const formatError = (error) => {
  if (!error) return 'An unexpected error occurred.';
  const data = error.response?.data;
  if (!data) return error.message || 'An unexpected error occurred.';
  const errObj = data.error || data;
  
  // Mapping technical phrases to human-friendly ones
  const friendlyMap = {
    "Must be a valid UUID.": "Please select a valid option from the list.",
    "This field may not be blank.": "This field is required.",
    "This field is required.": "This field is required.",
  };

  if (errObj.message && typeof errObj.message === 'string' && !errObj.details) {
    let msg = errObj.message;
    Object.entries(friendlyMap).forEach(([tech, friendly]) => {
      msg = msg.replace(tech, friendly);
    });
    return msg;
  }

  if (errObj.details && typeof errObj.details === 'object') {
    const messages = [];
    const extract = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        let fieldName = key.replace(/_/g, ' ');
        if (key === 'order_id') fieldName = 'order';
        const label = prefix ? `${prefix} ${fieldName}` : fieldName;
        if (Array.isArray(value)) {
          const valStr = value.map(v => {
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return friendlyMap[s] || s;
          }).join(' ');
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${valStr}`);
        } else if (typeof value === 'object' && value !== null) {
          extract(value, fieldName === 'driver' || fieldName === 'user' ? '' : label);
        } else {
          const s = String(value);
          const valStr = friendlyMap[s] || s;
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${valStr}`);
        }
      });
    };
    extract(errObj.details);
    if (messages.length > 0) return messages.join(' | ');
  }
  return errObj.message || data.message || error.message || 'An unexpected error occurred.';
};

const handleApiError = (error, customMessage) => {
  const message = formatError(error);
  toast.error(`${customMessage}: ${message}`, { duration: 5000 })
  console.error(`Order Service Error [${customMessage}]:`, JSON.stringify(error.response?.data || error, null, 2))
}

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

/** Shared cache tuning for trip surfaces (reduces flicker on LR switch / refocus). */
const TRIP_QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  placeholderData: keepPreviousData,
}

// ─── 1. ORDER (LR) HOOKS ─────────────────────────────────────────────────────

export const useOrders = (params) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch orders'),
  })
}

export const useOrderDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch order details'),
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      toast.success('Order (LR) created successfully')
    },
    onError: (err) => handleApiError(err, 'Could not create order'),
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // logic to switch between patch (update) and put (replace) if needed
    mutationFn: ({ id, data, fullReplace = false }) => 
      fullReplace ? ordersApi.replace(id, data) : ordersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      toast.success('Order updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Order cancelled')
    },
    onError: (err) => handleApiError(err, 'Failed to cancel order'),
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Order deleted successfully')
    },
    onError: (err) => handleApiError(err, 'Failed to delete order'),
  })
}

export const useAssignTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ordersApi.assignTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('Trip assigned to order successfully')
    },
    onError: (err) => handleApiError(err, 'Trip assignment failed'),
  })
}

// ─── 2. TRIP HOOKS ───────────────────────────────────────────────────────────

export const useTrips = (params) => {
  return useQuery({
    queryKey: orderKeys.tripList(params),
    queryFn: () => tripsApi.list(params),
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trips'),
  })
}

export const useTripDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.tripDetail(id),
    queryFn: () => tripsApi.get(id),
    enabled: !!id,
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trip details'),
  })
}

export const useCreateTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.create(data),
    onSuccess: (trip, variables) => {
      const orderIds = [
        ...(trip?.order_ids || []),
        ...(variables?.order_ids || []),
        ...(trip?.order_id ? [trip.order_id] : []),
        ...(variables?.order_id ? [variables.order_id] : []),
      ].filter(Boolean);
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      Array.from(new Set(orderIds)).forEach((orderId) => {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      })
      toast.success('Trip created successfully')
    },
    onError: (err) => handleApiError(err, 'Trip creation failed'),
  })
}

export const useUpdateTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data, fullReplace = false }) => {
      return fullReplace ? tripsApi.replace(id, data) : tripsApi.update(id, data)
    },
    onSuccess: (trip, { id, data }) => {
      const orderIds = [
        ...(trip?.order_ids || []),
        ...(data?.order_ids || []),
        ...(trip?.order_id ? [trip.order_id] : []),
        ...(data?.order_id ? [data.order_id] : []),
      ].filter(Boolean)
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDetail(id) })
      queryClient.invalidateQueries({ queryKey: [...orderKeys.tripDetail(id), 'stops'] })
      queryClient.invalidateQueries({ queryKey: [...orderKeys.tripDetail(id), 'status-history'] })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      Array.from(new Set(orderIds)).forEach((orderId) => {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      })
      toast.success('Trip updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useDeleteTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => tripsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      if (id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.tripDetail(id) })
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Trip deleted successfully')
    },
    onError: (err) => handleApiError(err, 'Failed to delete trip'),
  })
}

// ─── 2.1 TRIP SUB-RESOURCE HOOKS ─────────────────────────────────────────────

export const useTripStops = (tripId, params = {}) => {
  const { order_id, ...rest } = params || {}
  const apiParams = order_id ? { order_id, ...rest } : rest
  return useQuery({
    queryKey: orderKeys.tripStops(tripId, apiParams),
    queryFn: async () => normalizeListResponse(await tripsApi.listStops(tripId, apiParams)),
    enabled: !!tripId,
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trip stops'),
  })
}

export const useCreateTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createStop(tripId, { ...data, order_id: data?.order_id || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...orderKeys.tripDetail(tripId), 'stops'] })
      toast.success('Trip stop added')
    },
    onError: (err) => handleApiError(err, 'Failed to add trip stop'),
  })
}

export const useUpdateTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stopId, data }) => tripsApi.updateStop(tripId, stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...orderKeys.tripDetail(tripId), 'stops'] })
      toast.success('Trip stop updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update trip stop'),
  })
}

export const useDeleteTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stopId) => tripsApi.deleteStop(tripId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...orderKeys.tripDetail(tripId), 'stops'] })
      toast.success('Trip stop deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete trip stop'),
  })
}

export const useTripStatusHistory = (tripId, params = {}) => {
  const { order_id, ...rest } = params || {}
  const apiParams = order_id ? { order_id, ...rest } : rest
  return useQuery({
    queryKey: orderKeys.tripStatusHistory(tripId, apiParams),
    queryFn: async () => normalizeListResponse(await tripsApi.listStatusHistory(tripId, apiParams)),
    enabled: !!tripId,
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trip history'),
  })
}

export const useTripDocuments = (tripId, params = {}) => {
  return useQuery({
    queryKey: [...orderKeys.tripDocuments(tripId), params],
    queryFn: async () => normalizeListResponse(await tripsApi.listDocuments(tripId, params)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip documents'),
  })
}

export const useTripPodDocuments = (tripId, orderId) => {
  const params = { document_type: 'POD' }
  if (orderId) params.order_id = orderId
  return useTripDocuments(tripId, params)
}

export const useCreateTripDocument = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createDocument(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tripId) })
      toast.success('Document uploaded')
    },
    onError: (err) => handleApiError(err, 'Failed to upload document'),
  })
}

export const useUploadTripPod = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData) => tripsApi.uploadPod(tripId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tripId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('POD copy uploaded')
    },
    onError: (err) => handleApiError(err, 'Failed to upload POD'),
  })
}

export const useUpdateTripDocument = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, data }) => tripsApi.updateDocument(tripId, documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tripId) })
      toast.success('Document updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update document'),
  })
}

export const useDeleteTripDocument = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId) => tripsApi.deleteDocument(tripId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tripId) })
      toast.success('Document deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete document'),
  })
}

export const useTripExpenses = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripExpenses(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listExpenses(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip expenses'),
  })
}

export const useCreateTripExpense = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createExpense(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripExpenses(tripId) })
      toast.success('Expense recorded')
    },
    onError: (err) => handleApiError(err, 'Failed to record expense'),
  })
}

export const useUpdateTripExpense = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, data }) => tripsApi.updateExpense(tripId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripExpenses(tripId) })
      toast.success('Expense updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update expense'),
  })
}

export const useDeleteTripExpense = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expenseId) => tripsApi.deleteExpense(tripId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripExpenses(tripId) })
      toast.success('Expense deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete expense'),
  })
}

export const useTripCharges = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripCharges(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listCharges(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip charges'),
  })
}

export const useCreateTripCharge = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createCharge(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripCharges(tripId) })
      toast.success('Charge added')
    },
    onError: (err) => handleApiError(err, 'Failed to add charge'),
  })
}

export const useUpdateTripCharge = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ chargeId, data }) => tripsApi.updateCharge(tripId, chargeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripCharges(tripId) })
      toast.success('Charge updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update charge'),
  })
}

export const useDeleteTripCharge = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chargeId) => tripsApi.deleteCharge(tripId, chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripCharges(tripId) })
      toast.success('Charge deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete charge'),
  })
}


// ─── 3. CARGO HOOKS ──────────────────────────────────────────────────────────

export const useCargoItems = (params) => {
  return useQuery({
    queryKey: orderKeys.cargoList(params),
    queryFn: () => cargoApi.list(params),
    enabled: params !== undefined,
    onError: (err) => handleApiError(err, 'Failed to fetch cargo items'),
  })
}

export const useTripCargoItems = (tripId, params) => {
  return useQuery({
    queryKey: [...orderKeys.trips(), 'cargo', tripId, { params }],
    queryFn: () => tripsApi.listCargo(tripId, params),
    enabled: !!tripId,
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trip cargo items'),
  })
}

export const useCargoDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.cargoDetail(id),
    queryFn: () => cargoApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch cargo detail'),
  })
}

export const useCreateCargo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => cargoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      toast.success('Cargo item added')
    },
    onError: (err) => handleApiError(err, 'Failed to add cargo'),
  })
}

export const useUpdateCargo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, fullReplace = false }) => 
      fullReplace ? cargoApi.replace(id, data) : cargoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      queryClient.invalidateQueries({ queryKey: orderKeys.cargoDetail(id) })
      toast.success('Cargo item updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useDeleteCargo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => cargoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      toast.success('Cargo item deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete cargo'),
  })
}

export const useTransitionCargoStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newStatus }) => cargoApi.transitionStatus(id, newStatus),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      queryClient.invalidateQueries({ queryKey: orderKeys.cargoDetail(id) })
      toast.success('Cargo status updated')
    },
    onError: (err) => handleApiError(err, 'Failed to transition cargo status'),
  })
}

export const useCargoMovements = (cargoId, params) => {
  return useQuery({
    queryKey: orderKeys.cargoMovements(cargoId, params),
    queryFn: () => cargoMovementsApi.list(cargoId, params),
    enabled: !!cargoId,
    onError: (err) => handleApiError(err, 'Failed to fetch cargo movements'),
  })
}

export const useCreateCargoMovement = (cargoId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => cargoMovementsApi.create(cargoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...orderKeys.cargo(), 'movements', cargoId] })
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      toast.success('Cargo movement recorded')
    },
    onError: (err) => handleApiError(err, 'Failed to record cargo movement'),
  })
}

// ─── 4. DELIVERY (POD) HOOKS ─────────────────────────────────────────────────

export const useDeliveries = (params) => {
  return useQuery({
    queryKey: orderKeys.deliveryList(params),
    queryFn: () => deliveriesApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch POD records'),
  })
}

export const useTripDeliveries = (tripId) => {
  return useQuery({
    queryKey: [...orderKeys.deliveries(), 'trip', tripId],
    queryFn: async () => {
      const raw = await tripsApi.listPodDocuments(tripId ? { trip_id: tripId } : {})
      return normalizeListResponse(raw)
    },
    enabled: !!tripId,
    ...TRIP_QUERY_OPTIONS,
    onError: (err) => handleApiError(err, 'Failed to fetch trip POD copies'),
  })
}

export const useDeliveryDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.deliveryDetail(id),
    queryFn: () => deliveriesApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch delivery record'),
  })
}

export const useCreatePOD = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ trip_id, tripId, file, order_id, orderId, ...rest }) => {
      const tid = trip_id || tripId
      if (!tid || !file) {
        throw new Error('trip_id and file are required for POD upload')
      }
      const formData = new FormData()
      formData.append('file', file)
      const oid = order_id || orderId
      if (oid) formData.append('order_id', oid)
      Object.entries(rest).forEach(([k, v]) => {
        if (v != null && v !== '') formData.append(k, v)
      })
      return tripsApi.uploadPod(tid, formData)
    },
    onSuccess: (_, vars) => {
      const tid = vars?.trip_id || vars?.tripId
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      queryClient.invalidateQueries({ queryKey: [...orderKeys.deliveries(), 'trip'] })
      if (tid) queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tid) })
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('POD copy uploaded')
    },
    onError: (err) => handleApiError(err, 'Failed to upload POD'),
  })
}

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tripId, trip_id, data }) => {
      const tid = tripId || trip_id || data?.trip
      if (!tid) throw new Error('tripId is required to update POD document')
      return tripsApi.updateDocument(tid, id, data)
    },
    onSuccess: (_, { id, tripId, trip_id }) => {
      const tid = tripId || trip_id
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      queryClient.invalidateQueries({ queryKey: [...orderKeys.deliveries(), 'trip'] })
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveryDetail(id) })
      if (tid) queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tid) })
      toast.success('POD updated')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useDeleteDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tripId, trip_id }) => {
      const tid = tripId || trip_id
      if (!tid) throw new Error('tripId is required to delete POD document')
      return tripsApi.deleteDocument(tid, id)
    },
    onSuccess: (_, { tripId, trip_id }) => {
      const tid = tripId || trip_id
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      if (tid) queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tid) })
      toast.success('POD copy removed')
    },
    onError: (err) => handleApiError(err, 'Failed to delete POD'),
  })
}