import type { Product } from '~/types/inventory'
import { useProducts } from '~/composables/useProducts'

const cartItems = ref<Product[]>([])

export const useCart = () => {
  const saveToLocalStorage = () => {
    if (process.client) {
      localStorage.setItem('cart', JSON.stringify(cartItems.value))
    }
  }

  const initializeCart = () => {
    if (process.client) {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        cartItems.value = parsedCart.map((item: Product) => ({
          ...item,
          lastSynchronized: item.lastSynchronized || new Date().toLocaleString('hu-HU')
        }))
        saveToLocalStorage()
      }
    }
  }

  initializeCart()

  const addToCart = async (product: Product, quantity: number = 1) => {
    const { fetchSingleProduct } = useProducts()
    const updatedProduct = await fetchSingleProduct(product.id)
    const existingItem = cartItems.value.find(item => item.id === product.id)

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + quantity
      if (updatedProduct) {
        existingItem.lastSynchronized = new Date().toLocaleString('hu-HU')
        existingItem.maxQuantity = updatedProduct.maxQuantity
      }
    } else {
      const newItem = {
        ...product,
        quantity,
        lastSynchronized: new Date().toLocaleString('hu-HU')
      }
      cartItems.value = [...cartItems.value, newItem]
    }

    await nextTick()
    saveToLocalStorage()
  }

  const removeFromCart = (productId: string) => {
    cartItems.value = cartItems.value.filter(item => item.id !== productId)
    saveToLocalStorage()
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    const item = cartItems.value.find(item => item.id === productId)
    if (!item) return
    
    const { fetchSingleProduct } = useProducts()
    const updatedProduct = await fetchSingleProduct(productId, item.lastSynchronized)
    
    if (updatedProduct) {
      item.maxQuantity = updatedProduct.maxQuantity
      item.quantity = quantity
    } else {
      item.quantity = quantity
    }

    if (item.quantity <= 0) {
      removeFromCart(productId)
    }
    
    saveToLocalStorage()
  }

  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => {
      const price = item.price.special || item.price.normal
      return sum + (price * (item.quantity || 0))
    }, 0)
  })

  const itemCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
  })

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    itemCount
  }
} 