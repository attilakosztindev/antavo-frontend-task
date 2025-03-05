<template lang="pug">
main.app-page
  slot(name="pageContent")
</template>

<style lang="sass" scoped>
.app-page
  display: flex
  justify-content: center
</style>