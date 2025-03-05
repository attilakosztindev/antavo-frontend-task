import { defineEventHandler, readBody, createError } from 'h3'
import { mockInventory } from './inventory'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const body = await readBody(event)
  const product = mockInventory.find(item => item.id === id)
  
  if (!product) throw createError({ statusCode: 404, message: `Product ${id} not found` })

  if (body.lastUpdated === product.lastUpdated) return null

  return product
}) 