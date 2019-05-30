<template lang="pug">
  div
    el-form.user-setting(ref='user', :model='user', label-position='right', label-width='100px')
      el-form-item.ta-l(label='')
        div(v-bind="headers")
        img.avatar.d-ib(:src='user.avatar', alt='头像')
        el-upload.d-ib(action='/api/upload/img', :headers='headers', :show-file-list='false', :on-success='uploadSuccess', :before-upload='beforeUpload', :on-err='uploadFail') 选择头像
      el-form-item.ta-l(label='账号')
        span.w-200 {{user.account}}
      el-form-item.ta-l(label='用户名')
        el-input.w-200(v-model='user.name')
      el-form-item.ta-l(label='绑定邮箱')
        el-input.w-200(v-model='user.email')
      el-form-item.ta-l(label='绑定微信')
        el-input.w-200(v-model='user.weixin')
      el-form-item.ta-l(label='接口通知')
        el-checkbox(v-model='user.apiInform')
      el-form-item.ta-l(label='测试通知')
        el-checkbox(v-model='user.testInform')
      el-button(@click='$router.go(-1)') 返回
      el-button(@click='save()') 保存
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../../service/http'
import cache from '../../service/cache'

@Component
export default class Profile extends Vue {
  $message: any
  $router: any
  user: any = {
    name: '',
    account: '',
    avatar: '',
    email: '',
    weixin: '',
    testInform: false,
    apiInform: false
  }
  headers: any = {
    'Authorization': cache.get('token') || ''
  }
  async beforeMount() {
    let resp:any = await http.get('/api/user')
    this.user = resp
  }
  async save() {
    let resp:any = await http.put('/api/user', this.user)
    if (resp.errCode === 0) {
      this.$message({type: 'success', message: '保存成功'})
    } else {
      this.$message({type: 'error', message: resp.errMsg || '保存失败'})
    }
  }
  beforeUpload() {
  }
  uploadSuccess(res:any, file:any) {
    // this.setting.companyLogo = URL.createObjectURL(file.raw)
    this.user.avatar = res.imgUrl
  }
  uploadFail(err:any, file:any, fileList:any) {
    this.$message({type: 'error', message: err || '上传失败'})
  }
}
</script>

<style lang="stylus" scoped>
.user-setting
  margin 50px auto 0
  padding 20px 20px
  width 960px
  border 1px solid #ddd
.avatar
  width 100px
  height 100px
  border 1px solid #ddd
</style>
