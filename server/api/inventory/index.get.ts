import { defineEventHandler } from 'h3'
import { mockInventory } from './inventory'

export default defineEventHandler(async () => {
	return mockInventory
})