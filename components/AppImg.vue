<script setup lang="ts">
const props = defineProps({
  asset: { type: String, required: true },
  alt: { type: String, required: false, default: 'Image' },
  type: { type: String, required: false, default: 'img' }
})

const imgError = ref<boolean>(false)

const getImg = computed(() => {
	const assetPath = imgError.value ? 'no_image.png' : props.asset
  return assetPath
})

const handleError = () => {
  imgError.value = true
}
</script>

<template lang="pug">
img(
	:src="getImg"
	:alt="props.alt"
	@error="handleError"
)
</template>
