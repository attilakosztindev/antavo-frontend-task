<script setup lang="ts">
import HomeView from "./views/HomeView.vue";
import { useCart } from '~/stores/cartStore'

const cart = useCart()

onMounted(() => cart.initializeCart())
</script>

<template lang="pug">
home-view
</template>