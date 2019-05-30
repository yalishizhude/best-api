<template lang="pug">
  div#app
    router-view.main.pt-40
</template>

<script lang="ts">
  export default {
    name: 'app'
  }
</script>

<style lang="stylus">
@import "./common.styl"
*
  box-sizing border-box
html,
body
  background-color #f9fafc
  margin 0
  height 100%
  font-weight 100
#app
  height 100%
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
ul
  margin 0
  padding 0
  li
    margin 0
    list-style none
.wrap 
  padding 20px 30px
.v-wrap
  padding-bottom 20px
  padding-top 20px
.el-form
  background-color #fff
.border
  border 1px solid #ddd
</style>
