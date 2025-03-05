import { mockInventory } from './inventory'

export default defineEventHandler((event) => {
  const id = event.context.params?.id
  const product = mockInventory.find(item => item.id === id)
  
  if (!product) {
    throw createError({
      statusCode: 404,
      message: `Product ${id} not found`
    })
  }

  return product
}) 