import type { Product } from '~/types/inventory'
import { useProducts } from '~/composables/useProducts'

interface CartItem extends Product {
  quantity: number
}

const cartItems = ref<CartItem[]>([])

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
        cartItems.value = parsedCart.map((item: CartItem) => ({
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
      existingItem.quantity += quantity
      
      if (updatedProduct && updatedProduct.lastUpdated !== existingItem.lastUpdated) {
        existingItem.lastSynchronized = new Date().toLocaleString('hu-HU')
        Object.assign(existingItem, {
          ...updatedProduct,
          quantity: existingItem.quantity
        })
      }
      cartItems.value = [...cartItems.value]
    } else {
      cartItems.value = [...cartItems.value, { 
        ...(updatedProduct || product), 
        quantity,
        lastSynchronized: new Date().toLocaleString('hu-HU')
      }]
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
    
    item.quantity = quantity

    const { fetchSingleProduct } = useProducts()
    const updatedProduct = await fetchSingleProduct(productId)

    if (updatedProduct && updatedProduct.lastUpdated !== item.lastUpdated) {
      if (updatedProduct.quantity < quantity) {
        item.quantity = updatedProduct.quantity
      }
      
      item.lastSynchronized = new Date().toLocaleString('hu-HU')
      Object.assign(item, { ...updatedProduct,quantity: item.quantity })
    }

    if (item.quantity <= 0) {
      removeFromCart(productId)
    }
    
    saveToLocalStorage()
  }

  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => {
      const price = item.price.special || item.price.normal
      return sum + (price * item.quantity)
    }, 0)
  })

  const itemCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
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