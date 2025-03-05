import { defineEventHandler, H3Event, readBody, createError } from 'h3'
import { mockInventory, simulateDelay, simulateConflict } from './inventory'

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Id is missing' })
  }
  const body = await readBody(event)
  
  await simulateDelay()

  const item = mockInventory.find(i => i.id === id)
  if (!item) {
    throw createError({ statusCode: 404, message: 'Item is not found' })
  }

  if (simulateConflict()) {
    const updatedQuantity = Math.floor(Math.random() * 200)
    item.quantity = updatedQuantity
    item.lastUpdated = new Date().toISOString()
    
    return {
      conflict: true,
      message: 'Product state has changed',
      updatedProduct: item
    }
  }

  item.maxQuantity = body.maxQuantity
  item.lastUpdated = new Date().toISOString()

  return {
    conflict: false,
    item
  }
}) 