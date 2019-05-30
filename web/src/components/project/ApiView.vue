<template lang="pug">
  .api-view-wrap.ov-a.p-r(v-loading="loading", element-loading-text="拼命加载中...")
    .api-latest
      div.f-r.ta-r.c-silver(v-show="!compareVersion&&currentVersion")
        div 修改者：{{api.editor}} 
        div 修改时间：{{api.updateTime}}
      div.f-r.ta-r.c-silver(v-show="!currentVersion&&compareVersion")
        div 创建者：{{api.creator}} 
        div 创建时间：{{api.createdTime}}
      el-form(ref='api', :data='api', label-position='right', label-width='100px')
        el-form-item.ta-l.mb-10(label='接口名称')
          span {{api.name}}
        el-form-item.ta-l.mb-10(label='请求路径')
          span.mr-10 {{api.url}}
          el-tag(:type="methodType") {{api.method}}
        el-form-item.ta-l.mb-10(label='接口描述')
          div.form-remark {{api.remark}}
        el-form-item.ta-l(label='请求参数', v-if='api.request.paramList&&api.request.paramList.length>0')
          el-table(:data='api.request.paramList', border, )
            el-table-column(label='参数名', prop='name', width='180', align='left')
            el-table-column(label='说明', prop='remark', min-width='100', align='left')
              template(slot-scope='scope')
                .nowrap(:title="scope.row.remark") {{scope.row.remark}}
            el-table-column(label='模拟数据', prop='mock', width='150', align='left')
        el-form-item.ta-l(label='请求体', v-if='api.method!=="GET"')
          ParamEditor(:schema='api.request.dataSchema', :readonly="true")
        el-form-item.ta-l(label='响应体')
          ParamEditor(:schema='api.response.dataSchema', :readonly="true")
        el-form-item.cl-b.ta-l(label='可测试', v-if="api.isTest", :readonly="true")
          span {{api.isTest}}
        el-form-item.ta-l(label='延迟响应', v-if="api.delay")
          span {{api.delay + '毫秒'}}
        el-form-item.ta-l(label='异常处理', v-if='api.response.errList&&api.response.errList.length>0')
          el-table(:data='api.response.errList', border)
            el-table-column(label='是否启用', prop='enabled', width='100')
              template(slot-scope='scope')
                span {{scope.row.enabled}}
            el-table-column(label='异常概率（用于调试）', prop='probability', width='100')
            el-table-column(label='异常返回（json格式）', prop='data')
              template(slot-scope='scope')
                pre {{scope.row.response}}
            el-table-column(label='异常描述', prop='remark')
        template(v-for='(header, index) in [api.request.headerList, api.response.headerList]')
          el-form-item.ta-l(:label='index===0?"请求header":"响应header"', :key='index', v-if='header&&header.length>0')
            el-table(:data='header', border)
              el-table-column(label='key', prop='key')
              el-table-column(label='value', prop='value')
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Api from './Api'
import {Prop, Watch} from 'vue-property-decorator'
import ParamEditor from './ParamEditor'

let apiService :Api

const tagType:any = {
  GET: 'primary',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger'
}
@Component({
  components: {
    ParamEditor
  }
})
export default class apiView extends Vue {
  @Prop()
  proId: string
  @Prop()
  apiId: string
  @Prop()
  currentVersion: string
  @Prop()
  compareVersion: string
  compareApi: any = {}
  api: any = {
    isTest: true,
    name: '',
    url: '',
    method: '',
    remark: '',
    request: {
      dataSchema: {},
      paramList: [],
      headerList: []
    },
    response: {
      dataSchema: {},
      headerList: [],
      errList: []
    }
  }
  loading: boolean = true
  $message: any
  $confirm: any
  showAdvancedConfig: boolean = false
  async created() {
    apiService = new Api(this.proId)
    await this.reload()
  }
  async reload() {
    this.loading = true
    this.api = {
      isTest: true,
      name: '',
      url: '',
      method: '',
      remark: '',
      request: {
        paramList: [],
        headerList: []
      },
      response: {
        headerList: [],
        errList: []
      }
    }
    try {
      if (this.proId && this.apiId) {
        this.api = await apiService.get(this.apiId, {
          version: this.currentVersion
        })
        if (this.compareVersion) {
          this.compareApi = await apiService.get(this.apiId, {
            version: this.compareVersion
          })
        } else {
          this.compareApi = {}
        }
      }
      this.$emit('loaded')
    } catch (e) {
      console.error(e)
    } finally {
      this.loading = false
    }
  }
  @Watch('apiId')
  async apiChanged() {
    await this.reload()
  }
  @Watch('currentVersion')
  async versionChanged() {
    await this.reload()
  }
  @Watch('compareVersion')
  async versionChanged2() {
    await this.reload()
  }
  get methodType() {
    return this.api.method ? tagType[this.api.method] : ''
  }
  async delApi(data:any, store:any) {
    if (data.label === 'url') {
      await this.$confirm('确认删除接口' + data.name + '?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
      let resp:any = await apiService.delete(data.id)
      if (resp.errCode === 0) {
        this.$message({ type: 'info', message: '删除成功' })
        store.remove(data)
      } else {
        this.$message({ type: 'error', message: resp.errMsg || '删除失败' })
      }
    } else if (data.label === 'module') {
      if (data.children.length < 2) {
        store.remove(data)
      } else {
        await this.$confirm('确认删除模块' + data.name + '及该模块下全部接口？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        let resp:any = apiService.deleteModule(data.name)
        if (resp.errCode === 0) {
          this.$message({ type: 'info', message: '删除成功' })
          store.remove(data)
        } else {
          this.$message({ type: 'error', message: resp.errMsg || '删除失败' })
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.api-view-wrap
  .el-table
    margin-top 11px
  .el-table__header-wrapper
    height 30px
    line-height 30px
  th, td
    height 30px
    line-height 30px
    .cell
      padding 0 5px !important
</style>
<style lang="stylus" scoped>
.api-view-wrap
  height 100%
  background-color #fff 
  .api-latest,
  .api-history
    height 100%
    padding 10px 20px 0 0
.api-history
  border-left 1px solid #ddd
.icon-node
  position relative
  width 15px
  height 30px
  line-height 1
  border-left 1px solid #ccc
.icon-node:after
  z-index 10
  content ''
  position absolute
  width 15px
  height 1px
  bottom 50%
  border-bottom 1px solid #ccc
.icon-node-space-1
  position relative
  width 15px
  height 30px
  line-height 1
.icon-node-space-2
  position relative
  width 30px
  height 30px
  line-height 1
.param-name
  line-height 30px
.form-remark
  line-height 24px
  margin-top 8px
.difference
  background-color #F7BA2A
</style>

