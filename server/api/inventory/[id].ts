import { defineEventHandler, readBody, createError } from 'h3'
import { mockInventory } from './inventory'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id

  if (!id) throw createError({ statusCode: 400, message: 'Id is missing' })

  const product = mockInventory.find(item => item.id === id)
  
  if (!product) throw createError({ statusCode: 404, message: `Product ${id} not found` })

  return product
})