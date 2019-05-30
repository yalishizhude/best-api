<template lang="pug">
  .debug-wrap.ov-a
    el-form.form(label-position='right', label-width='100px')
      el-form-item.ta-l.mb-10(label='请求路径')
        span {{hostname}}{{form.url}}
      el-form-item.ta-l.mb-10(label='域名或IP')
        el-input(v-model="hostname", placeholder="如 http://192.168.0.123", @change="hostChanged")
      el-form-item.ta-l.mb-10(label='请求header', v-if="headerList.length>0")
        table.ta-c.table-list(cellspacing="0" cellpadding="5")
          tr
            th 参数名
            th 值
          tr(v-for="header in headerList", :key="header.key")
            td.td-1 {{header.key}}
            td 
              el-input(v-model.trim='header.value', size='small')
      el-form-item.ta-l.mb-10(label='URL参数', v-if="paramList.length>0")
        table.ta-c.table-list(cellspacing="0" cellpadding="5", @keyup="changeUrl")
          tr
            th 参数名
            th 值
          tr(v-for="param in paramList", :key="param.name")
            td.td-1 {{param.name}}
            td 
              el-input(v-model.trim='param.mock', size='small')
      el-form-item(label='请求payload', v-if="api.method!=='GET'")
        .c-red(v-show="payloadError") {{payloadError}}
        el-input(type="textarea", v-model="json", :rows="8")
      el-form-item.ta-r
        el-button.mr-20(@click="login.visible = true;loginResult = {}") 设置登录信息
        el-button(type="primary", @click="send", :loading="sending") {{sending?'发送中':'发送请求'}}
      el-form-item(label='响应body')
          pre.body.bg-light.login-result(:class="response.status===200?'':'c-red'") {{response.body}}
          div(v-show="!response.valid")
            .c-red 返回结果校验失败
            pre.login-result(:class="response.valid?'':'c-red'") {{response.errors}} 
      el-form-item(label='响应header')
        pre.f-1.header.bg-light.login-result {{response.header}}
    el-dialog(title="设置登录信息", :visible.sync="login.visible")
      el-form(label-width="5em")
        el-form-item(label="请求地址")
          el-input(width="200", v-model="login.url", placeholder="http或https开头,如: http://192.168.0.21:8080/login")
            el-select.w-100(v-model="login.method", slot="prepend")
              el-option(label="POST", value="POST")
              el-option(label="PUT", value="PUT")
        el-form-item(label="登录数据")
          el-input(v-model="login.data", :rows="4", type="textarea", placeholder='JSON格式,如：{username:"admin", password:"admin"}')
        el-form-item(label="返回字段")
          el-input(v-model="login.resultTokenField", placeholder="登录后返回的token字段名（Session登录不填）")
        el-form-item(label="发送字段")
          el-input(v-model="login.sendTokenField", placeholder="发送请求时header中token的字段名（Session登录不填）")
        el-form-item(label="是否启用")
          el-checkbox(v-model="login.enabled")
        el-form-item.ta-r
          el-button.mr-20(@click="testLogin", :loading="testing") 测试
          el-button(type="primary", @click="saveLogin") 保存到浏览器
        el-form-item(label="测试结果", v-show="loginResult")
          pre.login-result(:class="loginResult.status===200?'':'c-red'") {{loginResult.data ? loginResult.data : loginResult}}
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import {Prop, Watch} from 'vue-property-decorator'
import jsf from 'json-schema-faker'
import _ from 'lodash'
import cache from '../../service/cache'
import http from '../../service/http'
import ajv from 'ajv'

interface API {
  proId: string,
  url: string,
  method: string,
  paramList: any[],
  headerList: any[],
  dataJson: any,
  responseSchema: any
}
interface LOGIN {
  enabled: boolean,
  visible: boolean,
  url: string,
  data: string,
  resultTokenField: string,
  sendTokenField: string,
  method: string
}
let initLogin = () => ({
  enabled: false,
  visible: false,
  url: '',
  data: '',
  method: 'POST',
  resultTokenField: '',
  sendTokenField: ''
})
let initForm = () => ({
  url: '',
  header: {},
  payload: {}
})
let initResponse = () => ({
  body: '',
  header: '',
  valid: true,
  errors: {}
})
@Component
export default class ApiDebug extends Vue {
  @Prop()
  api: API
  // 登录信息
  login: LOGIN = initLogin()
  testing: boolean = false
  // 待提交信息
  form: any = initForm()
  hostname: string = ''
  headerList: any[] = []
  paramList: any[] = []
  json: string = ''
  response: any = initResponse()
  loginResult: string = ''
  sending: boolean = false
  payloadError: string = ''
  get storageKey() {
    return this.api.proId ? this.api.proId : ''
  }
  @Watch('api')
  async getJson() {
    this.payloadError = ''
    this.login = initLogin()
    this.form = initForm()
    this.response = initResponse()
    this.headerList = _.cloneDeep(this.api.headerList) || []
    this.paramList = _.cloneDeep(this.api.paramList) || []
    let data = await jsf.resolve(this.api.dataJson || {})
    this.json = JSON.stringify(data, null, 2)
    this.changeUrl()
    this.hostname = cache.get(this.storageKey + '_hostname') || this.hostname
    this.login = cache.get(this.storageKey + '_login') || this.login
    this.sending = false
  }
  changeUrl() {
    this.form.url = ''
    this.paramList = this.paramList || []
    let querystring: string[] = []
    let placeholder: any = {}
    let pathList = this.api.url.split('/')
    pathList.shift()
    // 区分占位符参数和地址栏参数
    for (let i = 0; i < this.paramList.length; i++) {
      const param = this.paramList[i]
      if (pathList.indexOf(':' + param.name) > -1) {
        placeholder[':' + param.name] = param.mock || ''
      } else {
        if (void 0 !== param.mock && param.mock !== '') {
          querystring.push(param.name + '=' + param.mock)
        }
      }
    }
    // 填充占位符参数
    pathList.forEach((path: string) => {
      if (path.startsWith(':')) {
        this.form.url += '/' + (placeholder[path] || '')
      } else {
        this.form.url += '/' + path
      }
    })
    this.form.url += (querystring.length ? '?' : '') + querystring.join('&')
  }
  saveLogin() {
    this.login.visible = false
    cache.set(this.storageKey + '_login', this.login)
  }
  hostChanged() {
    cache.set(this.storageKey + '_hostname', this.hostname)
  }
  async testLogin() {
    this.testing = true
    this.loginResult = ''
    try {
      let res:any = (await http.post('/api/debug', {
        url: this.login.url,
        method: this.login.method,
        payload: JSON.parse(this.login.data)
      }))
      this.loginResult = res
    } catch (e) {
      console.error(e)
      this.loginResult = e
    } finally {
      this.testing = false
    }
  }
  async send() {
    this.sending = true
    this.payloadError = ''
    this.response = initResponse()
    try {
      JSON.parse(this.json)
    } catch (e) {
      this.payloadError = e.toString()
      this.sending = false
      return
    }
    try {
      let headers = {}
      let obj = {
        url: this.hostname + this.form.url,
        method: this.api.method,
        payload: JSON.parse(this.json),
        header: this.form.header
      }
      if (this.login.enabled) {
        headers = {
          logindata: this.login.data.replace(/\n/g, ''),
          loginurl: this.login.url,
          loginmethod: this.login.method,
          resulttokenfield: this.login.resultTokenField,
          sendtokenfield: this.login.sendTokenField
        }
      }
      let result:any = await http.post('/api/debug', obj, {headers})
      this.response.body = result.data
      this.response.header = result.headers
      this.response.status = result.status
      /* eslint-disable */
      let _ajv = new ajv()
      let validate = _ajv.compile(this.api.responseSchema)
      this.response.valid = validate(this.response.body)
      this.response.errors = validate.errors
    } catch (e) {
      console.error(e)
      this.response.body = e
    } finally {
      this.sending = false
    }
  }
}
</script>
<style scoped lang="stylus">
  .debug-wrap
    height 100%
  .form
    padding-right 40px
    padding-bottom 40px
  .table-list
    width 100%
    border 1px solid #efefef
    border-collapse collapse
    tr:nth-child(odd)
      background-color #fefefe
    td
      border 1px solid #efefef
    .td-1
      width 100px
  .send
    right 40px
    bottom 20px
  .w-100
    width 100px
  .body
    height 300px
  .header
    height 100px
  .login-result
    line-height 1
    overflow-y auto
    margin 0
    padding 5px
    font-size 12px
</style>
