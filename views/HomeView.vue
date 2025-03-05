<script lang="ts" setup>
import { useProducts } from '~/composables/useProducts'
import { useFilterType } from '~/composables/useFilterType'
import { onMounted, ref, computed } from 'vue'
import type { Product } from '~/types/inventory'

const { fetchProducts, loading } = useProducts()
const { filterType } = useFilterType()
const selectedCategoryId = ref<string>('0')
const products = ref<Product[]>([])

const categories = ref([
  { id: '0', title: 'All'},
  { id: '1', title: 'Kitchen'},
  { id: '2', title: 'DIY'},
  { id: '3', title: 'Garden'}
])

const filteredProducts = computed(() => {
  let filtered = products.value
  if (selectedCategoryId.value !== '0') {
    filtered = filtered.filter(product => product.category.id === selectedCategoryId.value)
  }

  if (filterType.value.val === 'new') {
    filtered = filtered.filter(product => product.badges.some(badge => badge.title === 'New'))
  } else if (filterType.value.val === 'discounted') {
    filtered = filtered.filter(product => product.price.special !== null)
  }
  return filtered
})

onMounted(async () => {
  products.value = await fetchProducts()
})
</script>

<template lang="pug">
.home-view
  app-header(
    :categories="categories"
    v-model:selectedId="selectedCategoryId"
  )
  app-page
    template.home-view__content(#pageContent)
      AppSpinner(v-if="loading")
      ProductsList(
        v-else
        :products="filteredProducts"
      )
</template>

<style lang="sass">
.home-view
  padding: 40px 40px 100px 40px

  @media (max-width: 599px)
    padding: 30px 15px 60px 15px

  &__content
    display: flex
    justify-content: center
</style>