<template lang="pug">
  div.pt
    h1.title.ta-c
    LoginForm(@success="go")
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import LoginForm from '../LoginForm'

@Component({
  components: {
    LoginForm
  }
})
export default class Login extends Vue {
  go() {
    this.$router.push('/project/list')
  }
}
</script>

<style lang="stylus" scoped>
.title
  color #fff
  font-weight normal
.pt
  background-size cover
  background-image url(../../assets/bg.jpg)
  height 100%
  padding-top 20%
</style>
