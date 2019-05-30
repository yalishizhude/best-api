<template lang="pug">
div
  NavBar
  transition(name="fade")
    router-view
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import NavBar from './NavBar'

@Component({
  components: {
    NavBar
  }
})
export default class Main extends Vue {
}
</script>

<style lang="stylus">
.fade-enter-active
  transition all .5s ease     
.fade-enter
  opacity 0
</style>
