import { defineEventHandler } from 'h3'
import { mockInventory, simulateDelay } from './inventory'

export default defineEventHandler(async () => {
	await simulateDelay()
	return mockInventory
})