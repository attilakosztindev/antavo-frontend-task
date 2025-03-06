<script lang="ts" setup>
import pkg from 'lodash'
import { useCart } from '~/stores/cartStore'
import { formatCurrency } from '~/utils/formatCurrency'
import { useProducts } from '~/composables/useProducts'
import type { Product } from '~/types/inventory'

const { debounce } = pkg
const cart = useCart()
const { fetchSingleProduct, fetchProducts } = useProducts()

const emit = defineEmits(['update:isActive', 'conflict-resolved'])
const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const updatedProducts = ref(new Map<string, number>())
const conflicts = ref<Set<string>>(new Set())
const batchUpdate = ref<Map<string, number>>(new Map())

const closeDropdown = () => {
  emit('update:isActive', false)
}

const checkQuantityConflicts = async () => {
  const newConflicts = new Set<string>()
  
  const products = await fetchProducts()
  const productsMap = new Map(products.map(product => [product.id, product]))
  
  for (const cartItem of cart.items) {
    const updatedproduct = productsMap.get(cartItem.id)
    if (!updatedproduct) continue
    
    if (cartItem.maxQuantity !== updatedproduct.maxQuantity) {
      cartItem.maxQuantity = updatedproduct.maxQuantity
      cartItem.lastSynchronized = new Date().toLocaleString('hu-HU')
    }

    if (cartItem.quantity > updatedproduct.maxQuantity) newConflicts.add(cartItem.id)
  }
  
  cart.saveToLocalStorage()
  conflicts.value = newConflicts
}

const handleRemoveFromCart = async (id: string) => {
  cart.removeFromCart(id)
  conflicts.value.delete(id)
  emit('conflict-resolved', id)
}

const handleCheckout = debounce(async () => {
  await checkQuantityConflicts()
  if (conflicts.value.size > 0) return
  alert('Checkout successful')
}, 150)

const updatecart = async () => {
  for (const item of cart.items) {
    const product = await fetchSingleProduct(item.id)
    if (product) updatedProducts.value.set(item.id, product.maxQuantity || 0)
  }
}

const isItemUnavailable = (product: Product) => product.quantity >= product.maxQuantity

const handleInput = debounce(async (product: Product, event: Event) => {
  const input = event.target as HTMLInputElement
  let newQuantity = parseInt(input.value) || 1

  if (newQuantity > 100) {
    newQuantity = 100  
    input.value = '100'
  }
  const updatedProduct = await cart.updateQuantity(product.id, newQuantity)

  if (newQuantity > updatedProduct.maxQuantity) conflicts.value.add(product.id)
  else conflicts.value.delete(product.id)
}, 150)

const handleDecrement = debounce(async (product: Product) => {
  if (!product.quantity) return

  const updatedProduct = await cart.updateQuantity(product.id, product.quantity - 1)
  product.quantity = Math.min(updatedProduct.quantity, updatedProduct.maxQuantity)

  if (updatedProduct.quantity <= updatedProduct.maxQuantity) conflicts.value.delete(product.id)
}, 150)

const handleIncrement = debounce(async (product: Product) => {
  if (!product.quantity) return

  const updatedProduct = await cart.updateQuantity(product.id, product.quantity + 1)
  product.quantity = updatedProduct.quantity
  
  if (updatedProduct.quantity > updatedProduct.maxQuantity) conflicts.value.add(product.id)
  else conflicts.value.delete(product.id)
}, 150)

const processBatchUpdate = debounce(async () => {
  const updates = Array.from(batchUpdate.value.entries())
  for (const [id, quantity] of updates) await cart.updateQuantity(id, quantity)
  batchUpdate.value.clear()
}, 150)

const handleQuantityChange = (id: string, quantity: number) => {
  batchUpdate.value.set(id, quantity)
  processBatchUpdate()
}

watch(() => props.isActive, async (newVal) => {
  if (newVal) {
    await updatecart()
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
    .cart__counter(:class="{ 'cart__counter--visible': cart.itemCount > 0 }") {{ cart.itemCount > 99 ? '99+' : cart.itemCount }}
  transition(name="fade")
    .cart__dropdown(v-if="isActive")
      .cart__items(v-if="cart.items.length > 0")
        .cart-item(
          v-for="item in cart.items"
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
                    @click="handleDecrement(item)"
                    :disabled="item.quantity <= 1"
                  ) -
                  input.cart-item__quantity-input(
                    type="number"
                    inputmode="numeric"
                    :value="item.quantity"
                    @input="(e) => handleInput(item, e)"
                    min="1"
                  )
                  button.cart-item__quantity-btn(
                    @click="handleIncrement(item)"
                    :disabled="item.quantity >= 100"
                  ) +
                .cart-item__sync-status(v-if="item.lastSynchronized")
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
        .cart__total(v-if="cart.items.length > 0")
          span Total:
          span {{ formatCurrency(cart.subtotal) }}
        .cart__checkout(v-if="cart.items.length > 0")
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
    padding: 2px
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
    padding: 10px 10px 10px 10px

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
  transition: background-color .3s
  
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
    box-shadow: inset 0 0 0 1px rgba(255, 0, 0, 0.2) !important

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