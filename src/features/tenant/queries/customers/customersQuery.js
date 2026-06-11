import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  customersApi, 
  consignorsApi, 
  consigneesApi, 
  brokersApi,
  agentsApi
} from '../../api/customers/customersEndpoint'

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const customerKeys = {
  all: ['customers'],
  stats: () => [...customerKeys.all, 'stats'],
  lists: () => [...customerKeys.all, 'list'],
  list: (params) => [...customerKeys.lists(), { params }],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
  
  consignors: () => ['consignors'],
  consignees: () => ['consignees'],
  brokers: () => ['brokers'],
  agents: () => ['agents'],
}

import { flattenValidationErrors } from '../../components/customers/Common/customerCreatePayload'

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
const handleApiError = (error, customMessage) => {
  const data = error.response?.data;

  if (error.response?.status === 400) {
    const fieldErrors = flattenValidationErrors(data);
    if (fieldErrors) {
      const first = Object.values(fieldErrors)[0];
      toast.error(first || customMessage);
      console.error(`Validation Error [${customMessage}]:`, fieldErrors);
      return;
    }
  }

  const message = data?.message || data?.detail || error.message || customMessage;
  toast.error(typeof message === 'string' ? message : customMessage);
  console.error(`API Error [${customMessage}]:`, error);
};

// ─── 1. CUSTOMER HOOKS ───────────────────────────────────────────────────────

export const useCustomers = (params) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.list(params),
  })
}

export const useCustomer = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  })
}

export const useCustomerStats = () => {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: () => customersApi.stats(),
    staleTime: 60 * 1000,
  });
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
      toast.success('Customer created successfully')
    },
    onError: (err) => handleApiError(err, 'Could not create customer'),
  })
}


export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
      toast.success('Customer deleted')
    },
    onError: (err) => handleApiError(err, 'Could not delete customer'),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
      toast.success('Customer updated')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

// ─── Sub-resource Hooks ──────────────────────────────────────────────────

export const useCustomerAddresses = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'addresses'],
    queryFn: () => customersApi.addresses.list(customerId),
    enabled: !!customerId,
  })
}

export const useCreateCustomerAddress = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.addresses.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'addresses'] })
      toast.success('Address added')
    },
    onError: (err) => handleApiError(err, 'Could not add address')
  })
}

export const useUpdateCustomerAddress = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.addresses.update(customerId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'addresses'] })
      toast.success('Address updated')
    },
    onError: (err) => handleApiError(err, 'Could not update address')
  })
}

export const useDeleteCustomerAddress = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.addresses.delete(customerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'addresses'] })
      toast.success('Address removed')
    },
    onError: (err) => handleApiError(err, 'Could not remove address')
  })
}

export const useCustomerContacts = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'contacts'],
    queryFn: () => customersApi.contacts.list(customerId),
    enabled: !!customerId,
  })
}

export const useCreateCustomerContact = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.contacts.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contacts'] })
      toast.success('Contact added')
    },
    onError: (err) => handleApiError(err, 'Could not add contact')
  })
}

export const useUpdateCustomerContact = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.contacts.update(customerId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contacts'] })
      toast.success('Contact updated')
    },
    onError: (err) => handleApiError(err, 'Could not update contact')
  })
}

export const useDeleteCustomerContact = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.contacts.delete(customerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contacts'] })
      toast.success('Contact removed')
    },
    onError: (err) => handleApiError(err, 'Could not remove contact')
  })
}

export const useCustomerDocuments = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'documents'],
    queryFn: () => customersApi.documents.list(customerId),
    enabled: !!customerId,
  })
}

export const useCreateCustomerDocument = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.documents.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'documents'] })
      toast.success('Document uploaded')
    },
    onError: (err) => handleApiError(err, 'Upload failed')
  })
}

export const useUpdateCustomerDocument = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.documents.update(customerId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'documents'] })
      toast.success('Document updated')
    },
    onError: (err) => handleApiError(err, 'Update failed')
  })
}

export const useDeleteCustomerDocument = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.documents.delete(customerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'documents'] })
      toast.success('Document deleted')
    },
    onError: (err) => handleApiError(err, 'Delete failed')
  })
}

export const useCustomerContracts = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'contracts'],
    queryFn: () => customersApi.contracts.list(customerId),
    enabled: !!customerId,
  })
}

export const useCreateCustomerContract = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.contracts.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contracts'] })
      toast.success('Contract created')
    },
    onError: (err) => handleApiError(err, 'Could not create contract')
  })
}

export const useUpdateCustomerContract = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.contracts.update(customerId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contracts'] })
      toast.success('Contract updated')
    },
    onError: (err) => handleApiError(err, 'Could not update contract')
  })
}

export const useDeleteCustomerContract = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.contracts.delete(customerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'contracts'] })
      toast.success('Contract deleted')
    },
    onError: (err) => handleApiError(err, 'Could not delete contract')
  })
}

export const useCustomerCreditHistory = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'credit-history'],
    queryFn: () => customersApi.creditHistory(customerId),
    enabled: !!customerId,
  })
}

export const useCustomerNotes = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.detail(customerId), 'notes'],
    queryFn: () => customersApi.notes.list(customerId),
    enabled: !!customerId,
  })
}

export const useCreateCustomerNote = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.notes.create(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'notes'] })
      toast.success('Note added')
    },
    onError: (err) => handleApiError(err, 'Could not add note')
  })
}

export const useUpdateCustomerNote = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.notes.update(customerId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'notes'] })
      toast.success('Note updated')
    },
    onError: (err) => handleApiError(err, 'Could not update note')
  })
}

export const useDeleteCustomerNote = (customerId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.notes.delete(customerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...customerKeys.detail(customerId), 'notes'] })
      toast.success('Note removed')
    },
    onError: (err) => handleApiError(err, 'Could not remove note')
  })
}

// ─── 2. CONSIGNOR HOOKS ──────────────────────────────────────────────────────

export const useConsignors = (params) => {
  return useQuery({
    queryKey: [...customerKeys.consignors(), params],
    queryFn: () => consignorsApi.list(params),
  })
}

export const useCreateConsignor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => consignorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignors() })
      toast.success('Consignor created')
    },
    onError: (err) => handleApiError(err, 'Failed to create consignor'),
  })
}

export const useUpdateConsignor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // List UI reads `customer.status`; consignor PATCH often does not persist it — update customer too.
    mutationFn: async ({ id, customerId, data }) => {
      const { status, ...consignorPayload } = data
      const result = await consignorsApi.update(id, consignorPayload)
      const cid = customerId ?? id
      if (status !== undefined && cid != null && cid !== '') {
        await customersApi.update(cid, { status })
      }
      return result
    },
    onSuccess: (_, { id, customerId }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignors() })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() })
      const cid = customerId ?? id
      if (cid != null && cid !== '') {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(cid) })
      }
      toast.success('Consignor updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update consignor'),
  })
}

export const useDeleteConsignor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => consignorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignors() })
      toast.success('Consignor deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete consignor'),
  })
}

// ─── 3. CONSIGNEE HOOKS ──────────────────────────────────────────────────────

export const useConsignees = (params) => {
  return useQuery({
    queryKey: [...customerKeys.consignees(), params],
    queryFn: () => consigneesApi.list(params),
  })
}

export const useCreateConsignee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => consigneesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignees() })
      toast.success('Consignee profile created')
    },
    onError: (err) => handleApiError(err, 'Failed to create consignee'),
  })
}

export const useUpdateConsignee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => consigneesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignees() })
      toast.success('Consignee profile updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update consignee'),
  })
}

export const useDeleteConsignee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => consigneesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignees() })
      toast.success('Consignee deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete consignee'),
  })
}

// ─── 4. BROKER HOOKS ─────────────────────────────────────────────────────────

export const useBrokers = (params) => {
  return useQuery({
    queryKey: [...customerKeys.brokers(), params],
    queryFn: () => brokersApi.list(params),
  })
}

export const useBroker = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.brokers(), customerId],
    queryFn: () => brokersApi.get(customerId),
    enabled: !!customerId,
  })
}

export const useCreateBroker = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => brokersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.brokers() })
      toast.success('Broker profile created')
    },
    onError: (err) => handleApiError(err, 'Failed to create broker'),
  })
}

export const useUpdateBroker = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => brokersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.brokers() })
      toast.success('Broker profile updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update broker'),
  })
}

export const useDeleteBroker = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => brokersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.brokers() })
      toast.success('Broker profile deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete broker'),
  })
}

// ─── 5. AGENT HOOKS ──────────────────────────────────────────────────────────

export const useAgents = (params) => {
  return useQuery({
    queryKey: [...customerKeys.agents(), params],
    queryFn: () => agentsApi.list(params),
  })
}

export const useAgent = (customerId) => {
  return useQuery({
    queryKey: [...customerKeys.agents(), customerId],
    queryFn: () => agentsApi.get(customerId),
    enabled: !!customerId,
  })
}

export const useCreateAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => agentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.agents() })
      toast.success('Agent profile created')
    },
    onError: (err) => handleApiError(err, 'Failed to create agent'),
  })
}

export const useUpdateAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => agentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.agents() })
      toast.success('Agent profile updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update agent'),
  })
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.agents() })
      toast.success('Agent profile deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete agent'),
  })
}