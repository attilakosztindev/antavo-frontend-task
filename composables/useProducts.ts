import type { Product } from '~/types/inventory'

export function useProducts() {
  const error = ref<string | null>(null)
  const loading = ref<boolean>(false)
  
  const productCache = ref(new Map<string, { lastUpdated: string }>())

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

  const fetchSingleProduct = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const timestampResponse = await $fetch<{ lastUpdated: string }>(`/api/inventory/${id}/timestamp`)
      const cachedProduct = productCache.value.get(id)

      if (cachedProduct && cachedProduct.lastUpdated === timestampResponse.lastUpdated) {
        loading.value = false
        return null
      }

      const response = await $fetch<Product>(`/api/inventory/${id}`)

      if (response && typeof response.quantity === 'number') {
        productCache.value.set(id, { lastUpdated: response.lastUpdated })
        return response
      }

      throw new Error('Invalid product data received')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error has occurred'
      console.error('Failed to fetch product:', err)
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