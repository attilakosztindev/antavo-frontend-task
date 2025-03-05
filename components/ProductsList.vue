<script setup lang="ts">
import type { PropType } from 'vue'
import type { Product } from '~/types/inventory'

defineProps({
  products: {
    type: Array as PropType<Product[]>,
    required: true
  }
})
</script>

<template lang="pug">
.products-list-block(v-if="products")
  ProductCard(
    v-for="product in products"
    :key="product.id"
    :product="product"
  )
</template>

<style lang="sass">
.products-list-block
  opacity: 1
  justify-content: center
  max-width: 1518px
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(357px, 0fr))
  grid-gap: 30px
  position: relative
  width: 100%
  
  @media (max-width: 759px)
    grid-gap: 25px
    
  @media (max-width: 599px)
    display: flex
    flex-direction: column
    align-items: center
    gap: 51px
</style>