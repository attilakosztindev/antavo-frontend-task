import { defineEventHandler, H3Event, readBody, createError } from 'h3'
import { mockInventory } from './inventory'

export default defineEventHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Id is missing' })

  const body = await readBody(event)
  const item = mockInventory.find(i => i.id === id)

  if (!item) throw createError({ statusCode: 404, message: 'Item is not found' })

  item.maxQuantity = body.maxQuantity
  item.lastUpdated = new Date().toISOString()

  return {
    conflict: false,
    item
  }
}) 