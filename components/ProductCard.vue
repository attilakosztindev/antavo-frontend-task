<script setup lang="ts">
import { formatCurrency } from '~/utils/formatCurrency'
import { useCart } from '~/composables/useCart'
import { useProducts } from '~/composables/useProducts'
import type { Product } from '~/types/inventory'

const { $isClient } = useNuxtApp()
const { addToCart, cartItems } = useCart()
const { fetchSingleProduct } = useProducts()

const maxAvailableQuantity = ref<number | null>(null)
const isActive = ref<boolean>(false)
const isUnavailable = ref<boolean>(false)
const selectedQuantity = ref<number>(1)

const props = defineProps({
  product: {
    type: Object as PropType<Product>,
    required: true
  }
})

const isOutOfStock = computed(() => {
  return maxAvailableQuantity.value === 0 || !props.product.in_stock
})

const remainingQuantity = computed(() => {
  if (maxAvailableQuantity.value === null) return props.product.quantity
  
  const cartItem = cartItems.value.find(item => item.id === props.product.id)
  const cartQuantity = cartItem?.quantity || 0
  
  if (cartQuantity >= maxAvailableQuantity.value) {
    isUnavailable.value = true
    selectedQuantity.value = 0
    return 0
  }
  
  return maxAvailableQuantity.value - cartQuantity
})

const checkTotalQuantity = async () => {
  const updatedProduct = await fetchSingleProduct(props.product.id)

  if (!updatedProduct) return props.product.quantity

  const cartItem = cartItems.value.find(item => item.id === props.product.id)
  const cartQuantity = cartItem?.quantity || 0
  maxAvailableQuantity.value = updatedProduct.quantity
  
  if (cartQuantity >= updatedProduct.quantity) {
    isUnavailable.value = true
    selectedQuantity.value = 0
    return 0
  }
  
  return updatedProduct.quantity - cartQuantity
}

const handleAddToCart = async () => {
  if (!props.product.in_stock) return
  addToCart({ ...props.product }, selectedQuantity.value)
  selectedQuantity.value = 1
}

const resetState = async () => {
  const updatedProduct = await fetchSingleProduct(props.product.id)
  if (!updatedProduct) return
  
  const cartItem = cartItems.value.find(item => item.id === props.product.id)
  
  if (!cartItem) {
    isUnavailable.value = false
    selectedQuantity.value = 1
  }
}

const getBgColor = (title: string) => {
  const badge = props.product.badges.find(badge => badge.title === title)
  return badge?.background_color || '#000000'
}


watch(remainingQuantity, async (newValue) => {
  if (newValue <= 0) {
    isUnavailable.value = true
    selectedQuantity.value = 0
  } else {
    isUnavailable.value = false
    if (selectedQuantity.value === 0) {
      selectedQuantity.value = 1
    }
  }
})

watch(cartItems, async (newItems) => {
  const currentProduct = props.product
  const cartItem = newItems.find(item => item.id === currentProduct.id)
  
  const updatedProduct = await fetchSingleProduct(currentProduct.id)
  if (!updatedProduct) return
  
  maxAvailableQuantity.value = updatedProduct.quantity
  
  if (!cartItem) {
    isUnavailable.value = false
    selectedQuantity.value = 1
  } else if (cartItem.quantity >= updatedProduct.quantity) {
    isUnavailable.value = true
    selectedQuantity.value = 0
  }
}, { deep: true })

onMounted(async () => {
  await checkTotalQuantity()
  if ($isClient) {
    window.addEventListener('max-quantity-reached', ((event: CustomEvent) => {
      if (event.detail.productId === props.product.id) {
        isUnavailable.value = true
        selectedQuantity.value = 0
      }
    }) as EventListener)
  }
})

onUnmounted(() => {
  if ($isClient) {
    window.removeEventListener('max-quantity-reached', ((event: CustomEvent) => {
      if (event.detail.productId === props.product.id) {
        isUnavailable.value = true
        selectedQuantity.value = 0
      }
    }) as EventListener)
  }
})
</script>

<template lang="pug">
section.product-card(
  :class="{'product-card--active': isActive, 'product-card--has-variants': product.variants.length > 0}"
  @mouseleave="isActive = false"
)
  .product-card__overlay(
    :class="{'product-card__overlay--active': isActive}"
    tabindex="0"
  )
  article.product-card__container(
    :class="{'product-card__container--active': isActive, 'product-card__container--has-variants': product.variants.length > 0}"
    :aria-label="product.name" 
    @mouseover="isActive = true"
  )
    button.product-card__favorite(aria-label="Favourite")
      AppImg.product-card__favorite-icon(
        alt="Favorite icon"
        asset="icon_favourite.svg"
      )
    .product-card__badges
      ProductBadge(
        v-if="product.badges"
        v-for="(badge, index) in product.badges"
        :bg-color="getBgColor(badge.title)"
        :key="index"
        :aria-label="badge.title"
      ) {{ badge.title }}
    section.product-card__content
      .product-card__image-wrapper
        AppImg.product-card__image(
          :asset="product.imageUrl"
          :alt="product.name"
          type="picture"
        )
      .product-card__info
        h2.product-card__name {{ product.name }}
        .product-card__price-wrapper
          p.product-card__price
            span.product-card__price--special(v-if="product.price.special") {{ formatCurrency(product.price.special) }}
            span.product-card__price--regular(
              v-if="product.price.normal"
              :class="{'product-card__price--regular-discounted': product.price.special}"
            ) {{ formatCurrency(product.price.normal) }}
          ul.product-card__variants(
            :class="{'product-card__variants--active': isActive, 'product-card__variants--visible': product.variants.length > 0}"
            role="list"
          )
            li.product-card__variant(
              v-for="(color, index) in product.variants"
              :key="index" 
              :style="{backgroundColor: color}"
              role="listitem"
              aria-label="Color Variant"
            )
    .product-card__actions(
      :class="{ 'product-card__actions--active': isActive, 'product-card__actions--out-of-stock': isOutOfStock }"
      role="list"
    )
      template(v-if="!isOutOfStock")
        ProductCounter(
          :quantity="remainingQuantity"
          v-model="selectedQuantity"
          :is-unavailable="isUnavailable"
          :max-allowed="100"
        )
      AppButton(
        icon="icon_buy.svg"
        aria-label="Add to Cart"
        :is-out-of-stock="isOutOfStock"
        :is-unavailable="isUnavailable"
        disabled-label="out of stock"
        label="ADD TO CART"
        @click="handleAddToCart"
      )
</template>

<style lang="sass" scoped>
@mixin vertical-line($nth-child)
  &:not(:last-child):not(:nth-child(#{$nth-child}))::after
    content: ""
    position: absolute
    top: 0
    bottom: 0
    width: 1px
    background-color: $custom-light-gray
    right: -4.6%

.product-card
  opacity: 1
  position: relative
  width: 357px
  height: 500px
  z-index: 1
  transition: z-index .1s ease-in-out

  &--active
    z-index: 9

  @media (max-width: 599px)
    width: 280px
    height: 436px

    &--has-variants
      height: 468px

  @media (min-width: 1600px)
    @include vertical-line(4n)

  @media (max-width: 1599px) and (min-width: 1240px)
    @include vertical-line(3n)

  @media (max-width: 1239px) and (min-width: 855px)
    @include vertical-line(2n)

  @media (max-width: 854px)
    &:not(:last-child)::after
      content: ""
      position: absolute
      height: 1px
      width: 100%
      bottom: -15px
      z-index: -1
      background-color: $custom-light-gray

  @media (max-width: 599px)
    &:not(:last-child)::after
      bottom: -25px

  .product-card__overlay
    width: 100%
    position: absolute
    transition: all .3s ease-in-out
    padding: 0
    top: 0
    left: 50%
    will-change: transform
    transform: translate(-50%, 0)
    height: 500px
    background-color: $custom-light
    border-radius: 10px
    border: 1px solid transparent
    @extend .border
    @extend .box-shadow

    &--active
      height: 600px
      width: 387px
      top: -16px

    @media (max-width: 599px)
      display: none
      top: 0
      width: 357px
      height: 568px

  .product-card__container
    width: 357px
    display: flex
    flex-direction: column
    align-items: center
    justify-content: space-between
    position: relative
    padding: 0
    top: 0
    left: 50%
    will-change: transform
    transform: translate(-50%, 0)
    height: 568px
    background-color: transparent

    @media (max-width: 599px)
      width: 280px
      height: 436px

      &.product-card__container--has-variants
        height: 468px

    .product-card__badges
      display: flex
      gap: 2px
      position: absolute
      left: 0
      top: 0

      :first-child
        border-radius: 10px 0 0 0

    .product-card__variants
      width: 100%
      justify-content: center
      display: flex
      gap: 20px
      height: 12px

      &:not(.product-card__variants--visible)
        @media (max-width: 599px)
          display: none

      .product-card__variant
        opacity: 0
        transition: visibility .3s ease-in-out, opacity .3s ease-in-out
        border-radius: 50%
        height: 12px
        width: 12px
        visibility: hidden

        &:nth-child(2)
          box-shadow: 0 0 0 3px $custom-light-gray

        @media (max-width: 599px)
          opacity: 1
          visibility: visible
      
      &--active
        .product-card__variant
          opacity: 1
          visibility: visible

    .product-card__favorite
      display: flex
      align-items: center
      justify-content: center
      margin: 6px 6px 0 0
      cursor: pointer
      position: absolute
      right: 0
      top: 0
      padding: 0

      &-icon
        width: 24px
        height: 24px
    
    .product-card__content
      display: flex
      flex-direction: column

      .product-card__image
        cursor: pointer
        border-radius: 10px 10px 0 0
        overflow: hidden
        object-fit: cover
        width: 357px
        height: 357px
        display: flex

        :not(source)
          width: 100%

        @media (max-width: 599px)
          width: 280px
          height: 280px

      .product-card__info
        display: flex
        flex-direction: column
        align-items: center
        justify-content: space-between
        gap: 15px
        padding: 15px 20px 18px 20px
        min-height: 150px

        @media (max-width: 599px)
          padding: 15px 20px 15px 20px
          gap: 20px

        .product-card__name
          font-size: 16px
          line-height: 26px
          font-weight: 400
          text-align: center

          @media (max-width: 599px)
            font-size: 14px
            line-height: 20px

        .product-card__price-wrapper
          display: flex
          flex-direction: column
          align-items: center
          gap: 10px

          .product-card__price
            display: flex
            gap: 20px
            font-size: 20px
            font-weight: 900
            line-height: 28px

            @media (max-width: 599px)
              font-size: 18px
              line-height: 26px

            .product-card__price--special
              color: $custom-red

            .product-card__price--regular
              color: $custom-dark
              text-decoration: unset

              &-discounted
                font-weight: 400
                color: $custom-gray
                text-decoration: line-through

    .product-card__actions
      opacity: 0
      visibility: hidden
      display: flex
      justify-content: center
      width: 100%
      gap: 20px
      transition: all .3s ease-in-out

      @media (max-width: 599px)
        justify-content: space-between
        visibility: visible
        opacity: 1

      &--active
        opacity: 1 !important
        visibility: visible !important

      &--out-of-stock
        @media (max-width: 599px)
          justify-content: center !important
</style>
