<template lang="pug">
  div.wrap
    el-form.setting.v-wrap(ref='setting', :model='setting', label-position='right', label-width='100px')
      el-form-item.ta-l.mb-10(label='公司logo')
        el-upload.avatar-uploader.d-ib(:disabled="disabled", action='/api/upload/img', :headers='headers', :show-file-list='false', :on-success='uploadSuccess', :on-err='uploadFail')
          img.avatar.d-ib(v-if="setting.companyLogo", :src='setting.companyLogo', alt='logo')
          i.el-icon-plus.avatar-uploader-icon(v-else="")
      el-form-item.ta-l.mb-10(label='公司名称')
        el-input.w-380(:disabled="disabled", v-model='setting.companyName', size='small')
      el-form-item.ta-l.mb-10(label='备份大小')
        el-input-number.w-380(:disabled="disabled", :min="0", :max="10240", v-model='setting.backupSize', size='small')
        span &nbsp;MB
      // el-form-item.ta-l.mb-10(label='自动测试')
      //   el-switch(v-model='setting.testAuto', on-text='是', off-text='否', size='small')
      // el-form-item.ta-l.mb-10(label='测试时间')
      //   el-time-select(v-model='setting.testTime', size='small', :picker-options="{start: '00:00', step: '00:30', end: '24:00'}")
      // el-form-item.ta-l.mb-10(label='测试间隔')
      //   el-radio-group(v-model='setting.testInterval')
      //     el-radio(label='hourly', size='small') 每时
      //     el-radio(label='daily', size='small') 每天
      //     el-radio(label='weekly', size='small') 每周
      //     el-radio(label='monthly', size='small') 每月
      el-form-item.ta-l.mb-10(label='导出模板')
        el-row
          el-col.preview-col(:span="8")
            span html
            el-input(:disabled="disabled", type='textarea', :rows='20', v-model='setting.reportTemplate', @keyup='previewApiTemplate')
          el-col.preview-col(:span="8")
            span css
            el-input(:disabled="disabled", type='textarea', :rows='20', v-model='setting.reportStyle', @keyup='previewApiTemplate')
          el-col.preview-col(:span="8")
            el-button.f-r.mr-20(type="text", @click="setDefault") 恢复默认模板
            span 预览
            pre
      .ta-c(v-if="disabled")
        el-button(type="primary", @click="disabled=false") 编 辑
      .ta-c(v-else="")
        el-button.mr-10(@click="disabled=true") 取 消
        el-button(type="primary", @click='save()') 保 存
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../service/http'
import cache from '../service/cache'

@Component
export default class Set extends Vue {
  $message: any
  api:any = {
    name: '示例接口',
    url: '/example.com/xx',
    method: 'POST',
    request: [{
    }]
  }
  headers: any = {
    'Authorization': cache.get('token') || ''
  }
  setting: any = {
    companyLogo: '',
    companyName: '',
    backupSize: '',
    reportStyle: '',
    reportTemplate: ''
  }
  disabled: boolean = true
  style:any = {}
  previewApiTemplate() {
    // todo..
  }
  setDefault() {
    this.setting.reportStyle = this.setting.defaultStyle
    this.setting.reportTemplate = this.setting.defaultTemplate
  }
  async beforeMount() {
    let resp:any = await http.get('/api/setting')
    this.setting = resp || this.setting
    this.setting.reportTemplate = this.setting.reportTemplate || `
    span(:style='style.name') {{'接口名称:' + api.name}}
    span(:style='style.url') {{'url:' + api.url}}
    span(:style='style.method') {{'method' + api.method}}
    `
    this.setting.reportStyle = this.setting.reportStyle || JSON.stringify({
      name: {
        display: 'block',
        color: 'red',
        fontSize: '25px'
      },
      method: {
        float: 'left'
      },
      url: {
        color: 'blue'
      }
    }, null, 4)
    // this.previewApiTemplate()
  }
  async save() {
    let resp:any = await http.put('/api/setting', this.setting)
    resp.errCode === 0 ? this.$message({type: 'success', message: '保存成功'}) : this.$message({type: 'error', message: resp.errMsg || '保存失败'})
  }
  uploadSuccess(res:any, file:any) { this.setting.companyLogo = res.imgUrl }
  uploadFail(err:any, file:any, fileList:any) { this.$message({type: 'error', message: err || '上传失败'}) }
}
</script>

<style lang="stylus" scoped>
.setting
  border 1px solid #ddd
.avatar-uploader
  .avatar-uploader-icon
    border 1px dashed #d9d9d9
    border-radius 6px
    position relative
    overflow hidden
    &:hover
      border-color #20a0ff
    font-size 28px
    color #8c939d
    width 178px
    height 178px
    line-height 178px
  .avatar
    width 178px
    height 178px
    display block 
.preview-col
  padding-right 10px

</style>
