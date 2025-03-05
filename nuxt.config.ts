import pugPlugin from 'vite-plugin-pug'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/image'],

  image: {
    dir: 'public'
  },

  devtools: { enabled: true },

  build: {
    transpile: ['pinia-plugin-persistedstate'],
  },

  alias: {
    '@': '/<rootDir>'
  },

  vite: {
    plugins: [pugPlugin()],
    css: {
      preprocessorOptions: {
        sass: {
          additionalData: `@use "~/styles/global.sass" as *\n`
        }
      }
    },
    vue: {
      template: {
        transformAssetUrls: {
          video: ['src', 'poster'],
          source: ['src'],
          img: ['src'],
          image: ['xlink:href', 'href'],
          use: ['xlink:href', 'href']
        }
      }
    }
  },

  compatibilityDate: '2025-03-04'
})