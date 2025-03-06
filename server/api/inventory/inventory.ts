import type { Product } from '~/types/inventory'

const getRandomQuantity = () => Math.floor(Math.random() * 99 + 1)

export const mockInventory: Product[] = [
  {
    id: '1',
    name: 'Organic Single-Origin Ethiopian Yirgacheffe Coffee Beans',
    imageUrl: '/product.jpg',
    maxQuantity: 50,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [{ title: 'New', background_color: '#2E7D32' }],
    price: {
      normal: 19,
      special: 0
    },
    variants: ['#D8D8D8', '#1C4C5B', '#FFFFFF'],
    category: { id: '1', title: 'Kitchen' },
    in_stock: true
  },
  {
    id: '2',
    name: 'Premium Earl Grey Imperial Blend Tea Bags',
    imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&q=80',
    maxQuantity: 20,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [],
    price: {
      normal: 10,
      special: 0
    },
    variants: ['#D8D8D8', '#1C4C5B', '#FFFFFF'],
    category: { id: '2', title: 'DIY' },
    in_stock: true
  },
  {
    id: '3',
    name: 'Artisanal Raw Cane Sugar Crystal Collection',
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=500&q=80',
    maxQuantity: 200,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [{ title: 'New', background_color: '#2E7D32' }],
    price: {
      normal: 5,
      special: 0
    },
    variants: ['#D8D8D8', '#1C4C5B', '#FFFFFF'],
    category: { id: '3', title: 'Garden' },
    in_stock: true
  },
  {
    id: '4',
    name: 'Artisanal Hand-Crafted Chocolate-Dipped Biscotti Collection',
    imageUrl: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=500&q=80',
    maxQuantity: 45,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [{ title: '-25%', background_color: '#C62828' }],
    price: {
      normal: 24,
      special: 19
    },
    variants: ['#8B4513', '#D2691E', '#A0522D'],
    category: { id: '4', title: 'Gourmet Treats' },
    in_stock: true
  },
  {
    id: '5',
    name: 'Ultimate Barista Pro Deluxe Coffee Grinder 3000',
    imageUrl: '',
    maxQuantity: 75,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [],
    price: {
      normal: 299,
      special: 249
    },
    variants: ['#000000', '#CC0000', '#666666'],
    category: { id: '5', title: 'Equipment' },
    in_stock: true
  },
  {
    id: '6',
    name: 'Midnight Mystery Limited Reserve Single-Origin Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
    maxQuantity: 90,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [{ title: 'New', background_color: '#2E7D32' }],
    price: {
      normal: 49,
      special: 0
    },
    variants: ['#000000'],
    category: { id: '1', title: 'Category 1' },
    in_stock: false
  },
  {
    id: '7',
    name: 'Rainbow Unicorn Birthday Cake Flavored Coffee Pods',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&q=80',
    maxQuantity: 95,
    quantity: 0,
    lastUpdated: new Date().toISOString(),
    badges: [],
    price: {
      normal: 15,
      special: 12
    },
    variants: ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'],
    category: { id: '6', title: 'Specialty Flavors' },
    in_stock: true
  }
]

setInterval(() => {
  mockInventory.forEach(item => {
    item.maxQuantity = getRandomQuantity()
    item.quantity = 0
    item.lastUpdated = new Date().toISOString()
  })
}, 60000)

export default defineEventHandler((event) => {
  const id = event.context.params?.id
  
  if (event.path.endsWith('/timestamp')) {
    const item = mockInventory.find(item => item.id === id)
    
    if (!item) throw createError({ statusCode: 404, message: 'Product not found'})
    return { lastUpdated: item.lastUpdated }
  }

  if (id) {
    const item = mockInventory.find(item => item.id === id)

    if (!item) throw createError({ statusCode: 404, message: 'Product not found' })
    return item
  }
  
  return mockInventory
})