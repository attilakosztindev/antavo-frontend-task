<script lang="ts" setup>
import { useVModel } from '~/composables/useVModel'
import { useFilterType } from '~/composables/useFilterType'
import type { FilterType } from '~/types/inventory'

const props = defineProps({
  selectedId: {
    type: String,
    required: true
  },
  categories: {
    type: Object,
    required: true
  }
})

const { filterType, setFilterType } = useFilterType()

const miniCartIsActive = ref<boolean>(false)
const selectedFilter = ref<FilterType>(filterType.value)

const selectedId = useVModel(props, 'selectedId')

const updateFilter = () => {
  setFilterType(selectedFilter.value)
}

watch(selectedFilter, (newVal) => {
  setFilterType(newVal)
})
</script>

<template lang="pug">
.header
  h1.header__title GROCERY STORE
  nav.header__nav
    ul.header__categories
      li.header__category(
        @click="selectedId = category.id"
        v-for="category in categories"
        :key="category.id"
        :class="{'header__category--selected': selectedId === category.id}"
      ) {{category.title}}
  .header__cart
    MiniCart(
      v-model:is-active="miniCartIsActive"
    )
</template>

<style lang="sass">
.header
  display: flex
  align-items: center
  justify-content: space-between
  margin-bottom: 80px
  gap: 48px

  @media (max-width: 1300px)
    flex-direction: column

  @media (max-width: 599px)
    margin-bottom: 60px
    gap: 35px

  &__title
    font-size: 34px
    font-weight: 900
    line-height: 46px

    @media (max-width: 950px) and (min-width: 600px)
      margin-bottom: 35px !important

    @media (max-width: 599px)
      font-size: 20px
      line-height: 28px

  &__nav
    display: flex
    justify-content: space-between

    @media (max-width: 1300px)
      max-width: unset
      gap: 40px

    @media (max-width: 950px)
      gap: 35px
      flex-direction: column

  &__categories
    display: flex
    gap: 10px
    list-style: none
    padding: 0
    margin: 0

    @media (max-width: 599px)
      gap: 3px

  &__category
    padding: 10px
    cursor: pointer
    font-weight: 800
    text-transform: uppercase
    font-size: 16px
    line-height: 20px
    transition: background-color .4s, box-shadow .4s
    box-shadow: inset 0px -3px 0px 0px transparent
    display: flex

    @media (max-width: 599px)
      font-size: 11px
      line-height: 12px
      padding: 6px
      box-shadow: inset 0px -2px 0px 0px transparent
      
    &--selected
      background-color: $custom-light
      box-shadow: inset 0px -3px 0px 0px $custom-light-gray

      @media (max-width: 599px)
        box-shadow: inset 0px -2px 0px 0px $custom-light-gray

  &__cart
    position: relative
    height: 100%
    z-index: 10
    font-size: 16px
    font-weight: 800
    line-height: 20px
    display: flex
    align-items: center
    gap: 15px
    user-select: none

    @media (max-width: 599px)
      font-size: 13px
      line-height: 17px

  &__cart-button
    background: none
    border: none
    cursor: pointer
    display: inline-flex
    align-items: center
    padding: 0 !important
</style>