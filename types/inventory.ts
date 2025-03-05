export interface Product {
  id: string
  name: string
  imageUrl: string
  quantity: number
  lastUpdated: string
  lastSynchronized?: string
  badges: Array<{ title: string; background_color: string }>
  price: {
    normal: number
    special: number | null
  }
  variants: string[]
  category: {
    id: string
    title: string
  }
  in_stock: boolean
}

export interface FilterType {
  label: string
  val: string
} 

export interface UpdateQuantityPayload {
  id: string
  quantity: number
}

export interface PatchResponse {
  conflict: boolean
  item?: Product
  updatedItem?: Product
  message?: string
}

export interface SyncStatus {
  lastSynced: string
  syncing: boolean
  conflicts: string[]
}

export interface Price {
  regular: number
  special: number | null
}

export interface Badge {
  title?: string
  bgColor: string;
  ariaLabel?: string;
}

export interface Category {
  id: string
  title: string
}