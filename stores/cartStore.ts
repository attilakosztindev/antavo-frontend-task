import { defineStore } from 'pinia'
import { useProducts } from '~/composables/useProducts'
import { useNuxtApp } from '#app'
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
        this.items.push(newItem)
      }

      this.saveToLocalStorage()
    },

    removeFromCart(productId: string) {
      this.items = this.items.filter(item => item.id !== productId)
      this.saveToLocalStorage()
    },

    async updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(item => item.id === productId)
      if (!item) return
      
      const { fetchSingleProduct } = useProducts()
      const updatedProduct = await fetchSingleProduct(productId)
      
      if (updatedProduct) {
        item.maxQuantity = updatedProduct.maxQuantity
        item.quantity = quantity
      } else item.quantity = quantity

      if (item.quantity <= 0) this.removeFromCart(productId)
      
      this.saveToLocalStorage()
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