import { defineEventHandler, readBody } from 'h3'
import { mockInventory } from './inventory'
import { randomUUID } from 'crypto'
import type { Product } from '~/types/inventory'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const newProduct: Product = {
    id: randomUUID(),
    name: body.name,
    imageUrl: body.imageUrl,
    maxQuantity: body.quantity || 0,
    lastUpdated: new Date().toISOString(),
    badges: [],
    price: {
      normal: body.price?.normal || 0,
      special: body.price?.special || null
    },
    variants: body.variants || [],
    category: {
      id: body.category?.id || '0',
      title: body.category?.title || 'Uncategorized'
    },
    in_stock: body.quantity > 0
  }

  mockInventory.push(newProduct)
  return newProduct
}) 