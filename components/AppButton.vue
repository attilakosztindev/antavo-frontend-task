<script setup>
const props = defineProps({
  icon: { type: String, required: false },
  isOutOfStock: { type: Boolean },
  isUnavailable: { type: Boolean },
  disabledLabel: { type: String },
  label: { type: String, required: true},
  ariaLabel: { type: String }
})
</script>

<template lang="pug">
button.button(
  type="button"
  :class="[!isOutOfStock && !isUnavailable ? 'button--available' : 'button--unavailable']"
  :aria-label="ariaLabel"
  :disabled="isUnavailable"
)
  AppImg(
    v-if="props.icon && !isOutOfStock"
    :asset="props.icon"
    alt="CTA Button"
  )
  .button__label {{ isOutOfStock ? disabledLabel : label }}
</template>

<style lang="sass" scoped>
.button
  outline: none
  border: 0
  display: flex
  align-items: center
  justify-content: center
  width: 288px
  height: 56px
  gap: 10px
  font-weight: 900
  line-height: 20px
  font-size: 18px
  background-color: transparent
  color: white
  border-radius: 10px
  width: 100%
  transition: background-color .3s ease-in-out, opacity .3s ease-in-out

  &:hover
    opacity: .8

  &--available
    cursor: pointer
    background-color: $custom-orange

  &--unavailable
    cursor: not-allowed
    background-color: #808080

  &--unavailable, &--available
    @media (max-width: 599px)
      padding: 0 20px 0 20px
      align-items: center
      justify-content: center
      font-size: 16px
      line-height: 20px

  img
    height: 24px
    width: 24px

  @media (max-width: 599px)
    min-width: 156px
    height: 40px
    max-width: 208px

    img
      display: none
</style>