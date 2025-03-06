import { defineStore } from 'pinia'
import { useProducts } from '~/composables/useProducts'
import type { Product } from '~/types/inventory'

export const useCart = defineStore('cart', {
  state: () => ({
    items: [] as Product[],
    pendingUpdates: new Map<string, number>()
  }),

  hydrate(state) {
    if (process.client) {
      const savedCart = localStorage.getItem('cart')

      if (savedCart) {
        state.items = JSON.parse(savedCart).map((item: Product) => ({
          ...item,
          lastSynchronized: item.lastSynchronized || new Date().toLocaleString('hu-HU')
        }))
      }
    }
  },

  getters: {
    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        const price = item.price.special || item.price.normal
        return sum + (price * (item.quantity || 0))
      }, 0)
    },

    itemCount: (state) => {
      return state.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    }
  },

  actions: {
    saveToLocalStorage() {
      if (process.client) localStorage.setItem('cart', JSON.stringify(this.items))
    },

    initializeCart() {
      if (process.client) {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          this.items = parsedCart.map((item: Product) => ({
            ...item,
            lastSynchronized: item.lastSynchronized || new Date().toLocaleString('hu-HU')
          }))
          this.saveToLocalStorage()
        }
      }
    },

    async addToCart(product: Product, quantity: number = 1) {
      const { fetchSingleProduct } = useProducts()
      const updatedProduct = await fetchSingleProduct(product.id)
      const existingItem = this.items.find(item => item.id === product.id)

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + quantity
        if (updatedProduct && updatedProduct.maxQuantity !== existingItem.maxQuantity) {
          existingItem.maxQuantity = updatedProduct.maxQuantity
          existingItem.lastSynchronized = new Date().toLocaleString('hu-HU')
        }
      } else {
        const newItem = {
          ...product,
          quantity,
          maxQuantity: updatedProduct?.maxQuantity ?? product.maxQuantity,
          lastSynchronized: new Date().toLocaleString('hu-HU')
        }
        this.items.push(newItem)
      }

      this.saveToLocalStorage()
    },

    removeFromCart(productId: string) {
      this.items = this.items.filter(item => item.id !== productId)
      this.saveToLocalStorage()
    },

    async updateQuantity(productId: string, quantity: number): Promise<Product> {
      const product = this.items.find(product => product.id === productId)
      if (!product || !product.quantity) throw new Error(`Product ${productId} not found in cart or has invalid quantity`)
      
      try {
        const { fetchSingleProduct } = useProducts()
        const updatedProduct = await fetchSingleProduct(productId)
        
        product.maxQuantity = updatedProduct.maxQuantity
        product.lastSynchronized = new Date().toLocaleString('hu-HU')
        product.quantity = quantity
        
        this.saveToLocalStorage()
        return product
      } catch (error) {
        console.error(`Failed to update product ${productId}:`, error)
        return product
      }
    },

    getCartItem(productId: string) {
      return this.items.find(item => item.id === productId)
    },

    async processBatchUpdates() {
      const updates = Array.from(this.pendingUpdates.entries())
      await Promise.all(
        updates.map(([id, quantity]) => this.updateQuantity(id, quantity))
      )
      this.pendingUpdates.clear()
    },

    queueUpdate(productId: string, quantity: number) {
      this.pendingUpdates.set(productId, quantity)
      this.processBatchUpdates()
    }
  }
}) 