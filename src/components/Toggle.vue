<template>
  <button class="Toggle" :class="toggleClass" @click="toggle">
    <div class="Toggle__label" v-html="defaultStateText"></div>
    <div class="Toggle__input"><div class="Toggle__button"></div></div>
    <div class="Toggle__label" v-html="activeStateText"></div>
  </button>
</template>

<script>
export default {
  props: ['defaultText', 'activeText'],
  data () {
    return {
      state: false
    }
  },
  computed : {
    defaultStateText () {
      return this.defaultText
    },
    activeStateText () {
      return this.activeText
    },
    toggleClass () {
      return this.state ? 'is-active' : ''
    }
  },
  methods: {
    toggle () {
      this.state = !this.state
      this.$emit('state', this.state)
    }
  }
}
</script>
