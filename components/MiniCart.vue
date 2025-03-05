<script lang="ts" setup>
import { useCart } from '~/composables/useCart'
import { formatCurrency } from '~/utils/formatCurrency'
import { useProducts } from '~/composables/useProducts'
import type { Product } from '~/types/inventory'
const { cartItems, removeFromCart, updateQuantity, subtotal, itemCount } = useCart()
const { fetchSingleProduct } = useProducts()

const emit = defineEmits(['update:isActive', 'conflict-resolved'])
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const updatedQuantities = ref(new Map<string, number>())
const conflicts = ref<Set<string>>(new Set())

const closeDropdown = () => {
  emit('update:isActive', false)
}

const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const checkQuantityConflicts = async () => {
  const newConflicts = new Set<string>()
  
  for (const item of cartItems.value) {
    const updatedProduct = await fetchSingleProduct(item.id)
    if (!updatedProduct) continue
    
    if (item.quantity > updatedProduct.quantity) {
      newConflicts.add(item.id)
    }
  }
  
  conflicts.value = newConflicts
}

const handleQuantityUpdate = async (id: string, newQuantity: number) => {
  if (newQuantity < 1) return
  
  const updatedProduct = await fetchSingleProduct(id)
  if (!updatedProduct) return
  
  const currentItem = cartItems.value.find(item => item.id === id)
  if (!currentItem) return

  const maxQuantity = Math.min(updatedProduct.quantity, 100)
  
  if (newQuantity > maxQuantity) {
    await updateQuantity(id, maxQuantity)
    cartItemInputs.value.set(id, maxQuantity.toString())
  } else {
    await updateQuantity(id, newQuantity)
    cartItemInputs.value.set(id, newQuantity.toString())
  }

  const finalQuantity = newQuantity > maxQuantity ? maxQuantity : newQuantity
  if (finalQuantity > updatedProduct.quantity) {
    conflicts.value.add(id)
  } else {
    conflicts.value.delete(id)
  }
}

const handleRemoveFromCart = async (id: string) => {
  removeFromCart(id)
  conflicts.value.delete(id)
  emit('conflict-resolved', id)
}

const handleCheckout = async () => {
  await checkQuantityConflicts()
  if (conflicts.value.size > 0) {
    return
  }
  alert('Checkout successful')
}

const updateQuantities = async () => {
  for (const item of cartItems.value) {
    const updatedProduct = await fetchSingleProduct(item.id)
    if (updatedProduct) {
      updatedQuantities.value.set(item.id, updatedProduct.quantity)
    }
  }
}

const isItemUnavailable = (item: Product) => {
  const updatedQuantity = updatedQuantities.value.get(item.id) || 0
  return item.quantity >= updatedQuantity
}

const debouncedQuantityUpdate = debounce(handleQuantityUpdate, 200)

const handleInput = async (id: string, event: Event) => {
  const input = event.target as HTMLInputElement
  cartItemInputs.value.set(id, input.value)
  
  if (input.value === '') return
  
  const value = parseInt(input.value)
  if (isNaN(value)) {
    const currentItem = cartItems.value.find(item => item.id === id)
    if (currentItem) {
      cartItemInputs.value.set(id, currentItem.quantity.toString())
    }
    return
  }

  const updatedProduct = await fetchSingleProduct(id)
  if (!updatedProduct) return

  const maxQuantity = Math.min(updatedProduct.quantity, 100)
  const validValue = Math.min(Math.max(value, 1), maxQuantity)
  
  if (value !== validValue) {
    cartItemInputs.value.set(id, validValue.toString())
  }
  
  debouncedQuantityUpdate(id, validValue)
}

const handleBlur = async (id: string, event: Event) => {
  const input = event.target as HTMLInputElement
  const currentItem = cartItems.value.find(item => item.id === id)
  if (!currentItem) return
  
  if (input.value === '' || isNaN(parseInt(input.value))) {
    cartItemInputs.value.set(id, currentItem.quantity.toString())
    return
  }
  
  const updatedProduct = await fetchSingleProduct(id)
  if (!updatedProduct) {
    cartItemInputs.value.set(id, currentItem.quantity.toString())
    return
  }
  
  const value = parseInt(input.value)
  const maxQuantity = Math.min(updatedProduct.quantity, 100)
  const validValue = Math.min(Math.max(value, 1), maxQuantity)
  
  cartItemInputs.value.set(id, validValue.toString())
  await handleQuantityUpdate(id, validValue)
}

const handleDecrement = async (id: string, currentQuantity: number) => {
  if (currentQuantity <= 1) return
  const newQuantity = currentQuantity - 1
  await handleQuantityUpdate(id, newQuantity)
}

const handleIncrement = async (id: string, currentQuantity: number) => {
  const updatedProduct = await fetchSingleProduct(id)
  if (!updatedProduct) return
  
  const maxQuantity = Math.min(updatedProduct.quantity, 100)
  if (currentQuantity >= maxQuantity) {
    if (currentQuantity > maxQuantity) {
      conflicts.value.add(id)
    }
    return
  }
  
  const newQuantity = currentQuantity + 1
  await handleQuantityUpdate(id, newQuantity)
  await updateQuantities()
}

watch(() => props.isActive, async (newValue) => {
  if (newValue) {
    await updateQuantities()
  }
}, { immediate: true })

const cartItemInputs = ref(new Map<string, string>())

watch(() => cartItems.value, (items) => {
  items.forEach(item => {
    cartItemInputs.value.set(item.id, item.quantity.toString())
  })
}, { immediate: true })

watch(() => props.isActive, async (newValue) => {
  if (newValue) {
    await checkQuantityConflicts()
  }
}, { immediate: true })
</script>

<template lang="pug">
.cart
  button.cart__toggle(
    @click="$emit('update:isActive', !isActive)"
    :aria-expanded="isActive"
    aria-haspopup="listbox"
  )
    AppImg.cart__icon(
      asset="icon_cart.svg"
      alt="Cart"
    )
    ClientOnly
      span.cart__counter(:class="{ 'cart__counter--visible': itemCount > 0 }") {{ itemCount }}
  transition(name="fade")
    .cart__dropdown(v-if="isActive")
      .cart__items(v-if="cartItems.length > 0")
        .cart-item(
          v-for="item in cartItems"
          :key="item.id"
          :class="{ 'cart-item--conflict': conflicts.has(item.id) }"
        )
          .cart-item__content
            .cart-item__image-wrapper
              AppImg.cart-item__image(
                :asset="item.imageUrl"
                :alt="item.name"
              )
            .cart-item__details
              h3.cart-item__name {{ item.name }}
              .cart-item__price {{ formatCurrency(item.price.special || item.price.normal) }}
              .cart-item__subtotal Subtotal: {{ formatCurrency((item.price.special || item.price.normal) * item.quantity) }}
              .cart-item__controls
                .cart-item__quantity
                  button.cart-item__quantity-btn(
                    @click="handleDecrement(item.id, item.quantity)"
                    :disabled="item.quantity <= 1"
                  ) -
                  input.cart-item__quantity-input(
                    type="number"
                    inputmode="numeric"
                    :value="cartItemInputs.get(item.id)"
                    @input="(e) => handleInput(item.id, e)"
                    @blur="(e) => handleBlur(item.id, e)"
                    :max="100"
                    min="1"
                    :disabled="conflicts.has(item.id)"
                  )
                  button.cart-item__quantity-btn(
                    @click="handleIncrement(item.id, item.quantity)"
                    :disabled="isItemUnavailable(item) || item.quantity >= 100 || conflicts.has(item.id)"
                  ) +
                .cart-item__sync-status
                  span Last synced:
                  span {{ item.lastSynchronized }}
                button.cart-item__remove(@click="handleRemoveFromCart(item.id)")
                  AppImg.cart-item__remove-icon(
                    asset="icon_delete.svg"
                    alt="Delete"
                  )
          .cart-item__warning(v-if="conflicts.has(item.id)")
            span The maximum quantity has been exceeded, please decrease the quantity or remove the item
      .cart__summary
        .cart__total(v-if="cartItems.length > 0")
          span Total:
          span {{ formatCurrency(subtotal) }}
        .cart__checkout(v-if="cartItems.length > 0")
          AppButton(
            label="CHECKOUT"
            @click="handleCheckout"
            :isUnavailable="conflicts.size > 0"
          )
        .cart__empty(v-else)
          p Your cart is empty
</template>

<style lang="sass" scoped>
.cart
  position: relative
  max-width: 100%
  z-index: 10

  .cart__dropdown
    @media (max-width: 599px)
      max-width: 100dvw;
      max-height: calc(100dvh - 200px);
      top: 50px;
      left: 50%;
      transform: translateX(-50%);

  &__toggle
    background: none
    border: none
    display: inline-flex
    align-items: center
    padding: 0 !important

  &__icon
    width: 32px
    height: 32px
    transition: transform .3s

  &__dropdown
    transition: all .3s linear
    transform: translateY(20px)
    opacity: 1
    position: absolute
    background-color: #fff
    right: 0
    width: 475px
    border-radius: 4px
    will-change: transform
    @extend .border
    @extend .box-shadow

  &__counter
    position: absolute
    top: -8px
    right: -8px
    background-color: $custom-red
    color: white
    border-radius: 50%
    min-width: 20px
    height: 20px
    display: flex
    align-items: center
    justify-content: center
    font-size: 12px
    opacity: 0
    visibility: hidden
    transition: opacity 0.2s, visibility 0.2s

    &--visible
      opacity: 1
      visibility: visible

  &__items
    max-height: 400px
    overflow-y: auto
    padding: 10px 0 10px 10px

    @media (max-width: 599px)
      padding: 10px 5px 10px 10px

  &__summary
    padding: 15px
    border-top: 2px solid #eee
    position: sticky
    bottom: 0
    background: white

    @media (max-width: 599px)
      border-bottom: 1px solid #eee

  &__total
    display: flex
    justify-content: space-between
    font-weight: bold
    font-size: 16px
    padding-bottom: 15px

  &__empty
    padding: 30px 20px
    text-align: center
    color: $custom-gray

  &__checkout
    padding-top: 15px
    border-top: 1px solid #eee
    display: flex
    justify-content: center

.cart-item
  display: flex
  flex-direction: column
  padding: 10px
  
  &:not(:last-child)
    border-bottom: 1px solid #eee
  
  &__content
    display: flex
    align-items: center
    gap: 12px

  &__image-wrapper
    width: 75px
    height: 75px
    flex-shrink: 0

  &__image
    width: 100%
    height: 100%
    object-fit: cover
    border-radius: 4px

  &__details
    flex: 1
    display: flex
    flex-direction: column
    gap: 4px

  &__name
    font-size: 14px
    margin: 0
    font-weight: 600

  &__price
    font-weight: bold
    color: $custom-dark

  &__subtotal
    font-size: 13px
    color: $custom-gray
    margin-top: 2px

  &__controls
    display: flex
    align-items: center
    justify-content: space-between
    gap: 10px

  &__quantity
    display: flex
    align-items: center
    gap: 6px
    margin: 4px 0
    min-width: 100px

  &__quantity-input
    width: 40px
    text-align: center
    border: 1px solid #ddd
    border-radius: 4px
    padding: 2px 4px
    outline: none
    font-size: 14px
    -moz-appearance: textfield
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button
      -webkit-appearance: none
      margin: 0

  &__sync-status
    font-size: 12px
    font-weight: 400

    @media (max-width: 599px)
      text-align: center

      :first-child
        display: none

  &__quantity-btn
    padding: 2px 8px
    border: 1px solid #ddd
    background: none
    border-radius: 4px
    cursor: pointer
    
    &:disabled
      cursor: not-allowed
      opacity: 0.5
    
    &:hover:not(:disabled)
      background-color: #f5f5f5

  &__remove
    min-width: 20px
    min-height: 20px

    &:hover
      text-decoration: underline

  &--conflict
    background-color: rgba(255, 0, 0, 0.05)
    border: 1px solid rgba(255, 0, 0, 0.2) !important

  &__warning
    color: $custom-red
    font-size: 12px
    padding-top: 4px
    width: 100%
    text-align: left

.fade-enter-active, .fade-leave-active
  transition: opacity .3s

.fade-enter, .fade-leave-to
  opacity: 0
</style>