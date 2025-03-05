<script lang="ts" setup>
import type { Badge } from '~/types/inventory'

const props = defineProps<Badge>()
</script>

<template lang="pug">
span.product-badge(
  :aria-label="ariaLabel"
  :style="{ backgroundColor: bgColor }"
)
  slot
</template>

<style lang="sass" scoped>
.product-badge
  font-size: 16px
  height: 30px
  width: 60px
  color: white
  text-transform: uppercase
  display: flex
  justify-content: center
  align-items: center
  font-weight: 800
</style>