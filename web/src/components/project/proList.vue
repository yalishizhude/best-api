<template lang="pug">
div.wrap
  div
    el-button.mb-10(type='text', icon='plus', @click='go("add")') 新建项目
  div.pro-list.ta-l
    div.pro-item.d-ib.p-r.cu-d.ta-c(v-for='(pro, index) in projects', :key='pro.id')
      el-card(:body-style='{ padding: "0px" }')
        span.f-l.api-num(:title="'接口总数：'+pro.api.total") {{pro.api.total}}
        span.cu-p.f-r.btn-edit(title='复制项目', @click.stop='go("copy", pro.id, pro)')
          i.fa.fa-copy
        el-button.f-r.btn-edit(:title='loading?"正在生成api文档":"导出api文档"', @click.stop='go("export", pro.id)', :icon='loading?"loading":"upload2"', type='default')
        el-button.f-r.btn-edit(v-if="pro.editable", title='编辑项目', @click.stop='go("edit", pro.id)', icon='edit', type='default')
        el-button.f-r.btn-del(v-if="pro.deletable", title='删除项目', type='defalut', @click.stop.prevent='delPro(pro.id, index)', icon='delete2')
        img.pro-img.d-b.cl-b.image.cu-p(:src='pro.logo', @click.stop='go("api", pro.id, pro)')
        h3.pro-name.ov-h.to-e {{pro.name}}
        span.pro-id.d-b.cu-t(title='项目id，用于向mock服务器发送请求，前端开发调试利器', @click.stop.prevent='') {{pro.id}}
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../../service/http.ts'

@Component
export default class proList extends Vue {
  $confirm: any
  $message: any
  $prompt: any
  $router: any
  projects: any[] = []
  loading: boolean = false
  async getProList() {
    let resp:any = await http.get('/api/project')
    this.projects = resp.list ? resp.list : []
  }
  beforeMount() {
    this.getProList()
  }
  async go (to: string, proId?: string, project?: any) {
    if (to === 'api') {
      this.$router.push('/project/' + proId + '/api')
    } else if (to === 'edit') {
      this.$router.push('/project/' + proId + '/edit')
    } else if (to === 'add') {
      this.$router.push('/project/add')
    } else if (to === 'copy') {
      try {
        let prompt = await this.$prompt('请输入新项目名称', '复制项目' + project.name, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /^.{1,20}$/,
          inputErrorMessage: '项目名称格式不正确'
        })
        let resp:any = await http.post('/api/project/' + proId, {name: prompt.value})
        if (resp.errCode) {
          this.$message({type: 'error', message: resp.errMsg || '复制失败'})
        } else {
          this.$message({type: 'success', message: '创建项目成功'})
          this.getProList()
        }
      } catch (e) {
        console.error(e)
      }
    } else if (to === 'export') {
      this.loading = true
      try {
        let resp:any = await http.get('/api/project/' + proId + '/doc')
        if (resp.url) window.open(resp.url)
        this.loading = false
      } catch (e) {
        this.$message({type: 'failed', message: e.errMsg || '文档生成失败'})
        this.loading = false
      }
    }
  }
  async delPro(proId:any, proIndex:any) {
    await this.$confirm('此操作将永久删除该项目, 是否继续?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    let resp:any = await http.delete('/api/project/' + proId)
    if (resp.errCode === 0) {
      this.projects.splice(proIndex, 1)
      this.$message({type: 'success', message: '删除成功！'})
    } else {
      this.$message({type: 'error', message: resp.errMsg || '删除失败'})
    }
  }
}
</script>

<style lang="stylus" scoped>
.api-num
  color #8492A6
  padding 5px 10px
.pro-list
  margin 0 -20px
.pro-item
  margin 0 20px 40px
  height 200px
  width 230px
  .el-card
    background-color #fff
    height @height
    width @width
.pro-img
  margin 0 auto
  width 100px
  height 100px
.pro-name
  margin 0
  height 30px
  line-height 30px
  font-weight 500
.pro-id
  display none
  line-height 30px
.pro-add
  margin 25px 0 0 25px
  width 200px
  height 150px
.pro-add:before
  content ''
  position absolute
  top 50px
  left 50px
  z-index 2
  width 100px
  height 20px
  background-color #ddd
.pro-add:after
  content ''
  position absolute
  top 10px
  left 90px
  z-index 2
  width 20px
  height 100px
  background-color #ddd
.btn-del
  color red
.btn-edit
  color #20a0ff
.btn-edit,
.btn-del
  margin 7px 7px 10px 7px
  padding 0px
  opacity 0
  border none
.pro-item:hover
  .btn-del,
  .btn-edit
    opacity 1
  .pro-id
    display block
</style>
