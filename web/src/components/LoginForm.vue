<template lang="pug">
el-form(ref='userForm', :rules='rules' :model='userForm', label-width='0')
  el-form-item(label='', prop='account')
    el-input(v-model='userForm.account', placeholder=" 账号", @keyup.native.enter='login')
  el-form-item(label='', prop='password')
    el-input(v-model='userForm.password', placeholder=" 密码", type="password", @keyup.native.enter='login')
  el-form-item
    el-button.login-btn(type='primary', @click='login()') {{'登录'}}
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Cache from '../service/cache'
import http from '../service/http'
@Component
export default class LoginForm extends Vue {
  $confirm: any
  $message: any
  $router: any
  $refs:any
  userForm: any = {
    account: '',
    password: ''
  }
  rules: any = {
    account: [{required: true}],
    password: [{required: true}]
  }
  login () {
    let _this = this
    this.$refs.userForm.validate(async (valid:boolean) => {
      if (valid) {
        try {
          let resp:any = await http.post('/api/user/login', _this.userForm)
          if (resp.user && resp.token) {
            Cache.set('user', resp.user)
            Cache.set('token', resp.token)
            _this.$message({type: 'success', message: '登录成功'})
            _this.$emit('success')
          } else {
            _this.$emit('fail')
            _this.$message({type: 'error', message: resp.errMsg})
          }
        } catch (e) {
          _this.$emit('fail')
          _this.$message({type: 'error', message: '用户名或密码错误'})
        }
      }
    })
  }
}
</script>
<style lang="stylus" scoped>
.el-form
  margin 0 auto
  width 250px
  background-color transparent
  .login-btn
    width 100%
</style>
