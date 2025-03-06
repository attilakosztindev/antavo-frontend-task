<script lang="ts" setup>
const props = defineProps({
  quantity: {
    type: Number,
    required: true
  },
  maxQuantity: {
    type: Number,
    required: true
  },
  modelValue: {
    type: Number,
    required: true
  },
  isUnavailable: {
    type: Boolean,
    default: false
  },
  productId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const inputValue = ref<string>(props.modelValue.toString())

const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const productQty = computed({
  get: () => props.modelValue,
  set: debounce((value: number) => {
    const numValue = Math.min(
      Math.max(Number(value) || 0, 0),
      Math.min(props.quantity, props.maxQuantity)
    )
    
    if (numValue <= props.quantity && numValue <= props.maxQuantity) {
      emit('update:modelValue', numValue)
    }
  }, 200)
})

const increment = () => {
  if (props.quantity <= 0 || props.modelValue >= props.quantity) {
    return
  }
  emit('update:modelValue', props.modelValue + 1)
}

const decrement = () => {
  if (props.modelValue > 1) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  inputValue.value = input.value
  
  if (input.value === '') return
  
  const value = parseInt(input.value)
  if (isNaN(value)) {
    inputValue.value = props.modelValue.toString()
    return
  }
  
  const validValue = Math.min(Math.max(value, 1), props.quantity)
  
  if (value !== validValue) {
    inputValue.value = validValue.toString()
  }
  
  emit('update:modelValue', validValue)
}

const handleBlur = (event: Event) => {
  const input = event.target as HTMLInputElement
  
  if (input.value === '' || isNaN(parseInt(input.value))) {
    inputValue.value = '1'
    emit('update:modelValue', 1)
    return
  }
  
  const value = parseInt(input.value)
  const validValue = Math.min(Math.max(value, 1), props.quantity)
  
  inputValue.value = validValue.toString()
  emit('update:modelValue', validValue)
}

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue.toString()
}, { immediate: true })
</script>

<template lang="pug">
.counter
  button.counter__btn.counter__btn--decrease(
    @click="decrement"
    :disabled="isUnavailable || modelValue <= 1 || quantity <= 0"
    aria-label="Decrease quantity"
  )
    AppImg(
      alt="Remove Product"
      asset="icon_minus.svg"
    )
  input.counter__input(
    type="number"
    inputmode="numeric"
    :value="inputValue"
    @input="handleInput"
    @blur="handleBlur"
    :max="quantity"
    min="1"
    :disabled="isUnavailable || quantity <= 0"
  )
  button.counter__btn.counter__btn--increase(
    @click="increment"
    :disabled="isUnavailable || modelValue >= quantity || quantity <= 0"
    aria-label="Increase quantity"
  )
    AppImg(
      alt="Add Product"
      asset="icon_plus.svg"
    )
</template>

<style scoped lang="sass">
.counter
  height: 56px
  display: flex
  align-items: center
  justify-content: space-between
  border: 2px solid $custom-gray
  width: 200px
  border-radius: 10px

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button
    -webkit-appearance: none !important
    margin: 0 !important

  input[type=number]
    -moz-appearance: textfield

  @media (max-width: 599px)
    width: 100px
    height: 40px

  &__input
    font-size: 18px
    font-weight: 700
    line-height: 26px
    text-align: center
    width: 60px
    background: white
    border-radius: 10px
    outline: none

    @media (max-width: 599px)
      font-size: 16px

  &__btn
    user-select: none
    display: flex
    height: 100%
    align-items: center
    cursor: pointer
    padding: 0 15px
    background: none
    border: none

    &:disabled
      cursor: not-
      opacity: 0.5

    @media (max-width: 599px)
      padding: 0 11px

    img
      height: 15px
      width: 15px
</style>
