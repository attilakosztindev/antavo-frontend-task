<template lang="pug">
.loader
</template>

<style scoped lang="sass">
.loader
  display: block
  width: 80px
  height: 80px
  color: #1c4c5b

  &::after
    box-sizing: border-box
    content: ""
    display: block
    width: 64px
    height: 64px
    margin: 8px
    border-radius: 50%
    border: 5px solid currentColor
    border-color: currentColor transparent currentColor transparent
    animation: loader-spin 1.2s linear infinite

@keyframes loader-spin
  0%
    transform: rotate(0deg)

  100%
    transform: rotate(360deg)
</style>