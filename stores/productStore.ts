import { defineStore } from 'pinia'
import type { Product, PatchResponse, UpdateQuantityPayload, SyncStatus } from '~/types/inventory'

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
    syncStatus: {
      lastSynced: new Date().toISOString(),
      syncing: false,
      conflicts: []
    } as SyncStatus
  }),

  actions: {
    async updateQuantity(payload: UpdateQuantityPayload) {
      const item = this.items.find(i => i.id === payload.id)
      if (!item) return

      const previousQuantity = item.quantity
      item.quantity = payload.quantity
      item.lastUpdated = new Date().toISOString()

      try {
        const response = await $fetch<PatchResponse>(`/api/products/${payload.id}`, {
          method: 'PATCH',
          body: payload
        })

        if (response.conflict) {
          item.quantity = previousQuantity
          this.syncStatus.conflicts.push(payload.id)
        }
      } catch (error) {
        item.quantity = previousQuantity
        console.error('Failed to update quantity:', error)
      }
    },

    async syncWithServer() {
      this.syncStatus.syncing = true
      try {
        const items = await $fetch<Product[]>('/api/products')
        this.items = items
        this.syncStatus.lastSynced = new Date().toISOString()
      } catch (error) {
        console.error('Failed to sync with server:', error)
      } finally {
        this.syncStatus.syncing = false
      }
    }
  }
}) 