import type { Product } from '~/types/inventory'

export function useProducts() {
  const error = ref<string | null>(null)
  const loading = ref<boolean>(false)

  const productCache = new Map<string, { data: Product; timestamp: number; maxAge: number }>()
  
  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Product[]>('/api/inventory')
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error has occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  const pendingRequests = new Map<string, Promise<Product>>()

  const fetchSingleProduct = async (id: string, force: boolean = false) => {
    const isCached = productCache.get(id)
    const now = Date.now()
    
    if (!force && isCached && (now - isCached.timestamp) < isCached.maxAge) return isCached.data
  
    if (pendingRequests.has(id)) return pendingRequests.get(id)
    
    const request = $fetch<Product>(`/api/inventory/${id}`, {
      method: 'POST',
      body: { lastUpdated: isCached?.data.lastUpdated }
    })
    
    pendingRequests.set(id, request)
    
    try {
      const response = await request
      if (response) {
        productCache.set(id, {
          data: response,
          timestamp: now,
          maxAge: 6000000
        })
      }
      
      return response
    } finally {
      pendingRequests.delete(id)
    }
  }
  

  return {
    error,
    loading,
    fetchProducts,
    fetchSingleProduct,
  }
} 