import type { Product } from '~/types/inventory'

export function useProducts() {
  const error = ref<string | null>(null)
  const loading = ref<boolean>(false)
  
  const productCache = ref(new Map<string, { lastUpdated: string; maxQuantity: number }>())

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

  const fetchSingleProduct = async (id: string, lastUpdated?: string) => {
    loading.value = true
    error.value = null
    try {
      const cachedProduct = productCache.value.get(id)
      
      const response = await $fetch<Product>(`/api/inventory/${id}`, {
        method: 'POST',
        body: {
          lastUpdated: lastUpdated || cachedProduct?.lastUpdated
        }
      })

      if (!response) {
        return cachedProduct ? { ...cachedProduct, id, maxQuantity: cachedProduct.maxQuantity } : null
      }

      const newCacheEntry = { 
        lastUpdated: response.lastUpdated || new Date().toISOString(),
        maxQuantity: response.maxQuantity || 0
      }
      
      productCache.value.set(id, newCacheEntry)
      return response

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error has occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    error,
    loading,
    fetchProducts,
    fetchSingleProduct,
  }
} 