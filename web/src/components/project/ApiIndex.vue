<template lang="pug">
  div.p-a.l-0.r-0.b-0.t-40.d-f.bg-white
    ApiList(@getHandler="getTreeHandler", ref="apiList", :proId="proId", :clickedId="apiId", @add="addApi", @view="viewApi", @edit="editApi", @delete="deleteApi")
    ApiEdit.f-1.ov-y-a(v-if="mode==='edit'||mode==='add'", :mode="mode" :proId="proId", :apiId="apiId", :moduleName="moduleName", @updated="apiModified",  @cancel="cancelEdit")
    div.d-f.fd-c.f-1.ov-y-a(v-if="mode==='view'")
      div.api-detail-wrap.p-r#detail-wrap.ta-l(v-show="btnsVisible")
        el-button(size='small', icon='edit', type='default', @click='editApi(apiId)') 编辑
        el-button(size='small', icon='document', type='default', @click="copy") 复制
        el-button(size='small', icon='menu', type='default', @click="debug") 调试
        el-button(v-if="versionList.length>0", v-show="!comparing", size='small', icon='view', type='default', @click="compare") 版本
        el-select.f-r.mr-10(v-if="comparing", v-model="version", size="small")
          el-option(v-for="version in versionList", :key="version", :label="version", :value="version")
      div.d-f.f-1.p-r
        ApiView.f-1(ref="viewComp", @loaded="btnsVisible=true", :proId="proId", :apiId="apiId", :compareVersion="version")
        ApiView.f-1(v-if="comparing", :proId="proId", :apiId="apiId", :currentVersion="version")
        i.p-a.cu-p.c-red.close-history.el-icon-close(v-if="comparing", @click="comparing=false", title="关闭")
        ApiDebug.f-1(v-show="debugging", :api="debugApi")
        i.p-a.cu-p.c-red.close-history.el-icon-close(v-show="debugging", @click="debugging=false", title="关闭")
    el-dialog(title="复制接口", :visible.sync="replication.visible")
      div
        el-select.replication(v-model="replication.proId", placeholder="请选择项目", @change="proChange")
          el-option(v-for="item in projectList", :key="item.id", :label="item.name", :value="item.id")
        el-select.replication(v-model="replication.module", placeholder="请选择模块")
          el-option(v-for="item in moduleList", :key="item", :label="item", :value="item")
        el-input.replication(v-model="replication.name", placeholder="新接口名称")
      .mt-20.ta-c
        el-button(@click="replication.visible=false") 取消
        el-button(type="primary", @click="replicateApi") 确定
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import ApiList from './ApiList.vue'
import ApiView from './ApiView.vue'
import ApiEdit from './ApiEdit.vue'
import ApiDebug from './ApiDebug.vue'
import Api from './Api'
import Project from './Project'
import _ from 'lodash'

let apiService:any = {}
let projectService:any = {}
let api:any = {}

@Component({
  components: {
    ApiList,
    ApiView,
    ApiEdit,
    ApiDebug
  }
})
export default class ApiIndex extends Vue {
  $router: any
  $route: any
  $message: any
  $confirm: any
  mode: string = ''
  moduleName: string = ''
  proId: string = ''
  apiId: string = ''
  treeHandler: any
  editorHandler: any
  btnsVisible: boolean = false
  debugging: boolean = false
  comparing: boolean = false
  debugApi: any = {
    url: '',
    method: '',
    headerList: [],
    paramList: [],
    dataJson: ''
  }
  version: string = ''
  versionList: string[] = []
  projectList: any[] = []
  moduleList: any[] = []
  $refs: any
  replication: any = {
    proId: '',
    module: '',
    name: '',
    visible: false
  }
  async created() {
    this.proId = this.$route.params.proId
    this.apiId = this.$route.query.id
    apiService = new Api(this.proId)
    projectService = new Project(this.proId)
  }
  debug() {
    let a = this.$refs.viewComp.api
    this.debugApi = {
      proId: this.proId,
      id: this.apiId,
      url: a.url,
      method: a.method,
      headerList: a.request.headerList,
      paramList: a.request.paramList,
      dataJson: a.request.dataSchema,
      responseSchema: a.response.dataSchema
    }
    this.debugging = true
    this.comparing = false
  }
  compare() {
    this.debugApi = {
      url: '',
      headerList: [],
      paramList: [],
      dataJson: ''
    }
    this.debugging = false
    this.comparing = true
  }
  getTreeHandler(treeHandler: any) {
    this.treeHandler = treeHandler
    this.treeHandler.refresh(this.apiId)
  }
  getEditorHandler(handler: any) {
    this.editorHandler = handler
  }
  addApi(moduleName: any) {
    this.moduleName = moduleName
    this.apiId = ''
    this.mode = 'add'
  }
  async viewApi(id: string, name: string, type: string) {
    this.btnsVisible = false
    this.debugApi = {
      url: '',
      headerList: [],
      paramList: [],
      dataJson: ''
    }
    this.debugging = false
    this.comparing = false
    if (type === 'url') {
      try {
        this.version = ''
        this.versionList = []
        let resp: any = await apiService.getVersion(id)
        resp.versionList.forEach((item: any) => {
          this.versionList.push(item.version)
        })
        this.versionList = _.uniq(this.versionList)
        if (this.versionList.length) this.version = this.versionList[0]
      } catch (e) {
        console.error(e)
      }
    } else {
      id = ''
    }
    this.apiId = id
    this.$router.push({
      name: 'api',
      query: {
        id
      }
    })
    this.mode = id ? 'view' : ''
  }
  editApi(id: string) {
    this.apiId = id
    this.mode = 'edit'
    this.moduleName = ''
    this.$router.push({
      name: 'api',
      query: {
        id
      }
    })
  }
  cancelEdit() {
    this.mode = this.apiId ? 'view' : ''
  }
  async deleteApi(id: string) {
    try {
      await this.$confirm(`确认删除接口?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      let resp: any = await apiService.delete(id)
      if (resp.errCode) {
        this.$message({type: 'error', message: resp.errMsg || '删除失败'})
      } else {
        this.$message({type: 'success', message: '删除成功'})
        this.$refs.apiList.refreshApiList()
      }
    } catch (e) {
      console.error(e)
    }
  }
  apiModified(id: string) {
    this.$router.push({
      name: 'api',
      query: {
        id
      }
    })
    this.mode = 'view'
    this.treeHandler.refresh(id)
  }
  async copy() {
    this.replication = {
      visible: true,
      proId: '',
      module: '',
      name: ''
    }
    this.projectList = (await projectService.get()).list
  }
  async proChange() {
    api = await apiService.get(this.apiId)
    this.replication.module = ''
    this.moduleList = (await projectService.getModule(this.replication.proId)).moduleList
  }
  async replicateApi() {
    let replication: any = Object.assign(api, this.replication)
    delete replication.id
    delete replication.visible
    let newApiService = new Api(replication.proId)
    await newApiService.post(replication)
    this.replication.visible = false
  }
}
</script>
<style scoped lang="stylus">
.api-detail-wrap
  box-sizing content-box
  padding 7px 0 10px 30px
.operation-btns
  z-index 100
  top 0
  left 0
  right 0
  padding-left 40px
  line-height 40px
  background-color #eee
.close-history
  right 30px
  transition transform .2s
  &:hover
    transform rotate(90deg)
.replication
  width 150px
  margin-right 10px
</style>
