<template lang="pug">
  div.pt.ta-c
    h1.cu-p(@click="go") Welcome to Best API
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import cache from '../../service/cache'

@Component
export default class Index extends Vue {
  $router: any
  created() {
    if (cache.get('user')) {
      this.$router.push({
        name: 'projectIndex'
      })
    }
  }
  go() {
    this.$router.replace({
      name: 'projectIndex'
    })
  }
}
</script>

<style lang="stylus" scoped>
.pt
  background-size cover
  background-image url(../../assets/bg.jpg)
  color #fff
  height 100%
  padding-top 25%
</style>
