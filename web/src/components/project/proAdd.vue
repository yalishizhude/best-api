<template lang='pug'>
div.wrap
  el-form.border.v-wrap(ref='pro', :rules='rules', :model='pro', label-position='right', label-width='100px')
      el-form-item(label='项目封面', prop='logo')
        el-upload.avatar-uploader.ta-l(:headers="headers", action="/api/upload/img", :show-file-list="false", :on-success="handleAvatarSuccess", :before-upload="beforeAvatarUpload")
          img.avatar(v-if="pro.logo", :src="pro.logo")
          i.el-icon-plus.avatar-uploader-icon(v-else="")
      el-form-item(label='项目名称', prop='name')
        el-input.w-380(v-model='pro.name', :minlength=2, :maxlength=20, placeholder="2~20个字符", required)
      el-form-item(label='项目描述', prop='description')
        el-input.w-380(v-model='pro.description', :maxlength=200, placeholder="0~200个字符")
      el-form-item(label='测试地址', prop='testUrl')
        el-input.w-380(v-model='pro.testUrl', placeholder="测试服务器域名或IP，用于自动化测试")
      el-form-item(label='新增成员')
        el-row(:gutter='12')
          el-col.ml-5(:span='5')
            el-form-item(prop='newMember')
              el-select(v-model='newMember', value-key='name', placeholder='名称')
                el-option(v-for='m in availableMembers', :value='m', :key='m.id', :label='m.name')
          el-col(:span='5')
            el-form-item(prop='newMemberRole')
              el-select(v-model='newMemberRole', placeholder='角色')
                el-option(v-for='(ro, index) in roles', :value='ro.name', :key='ro.index', :label='ro.name')
          el-col.c-blue(:span=3)
            span.cu-p(@click='addMember()') 添加
            el-popover(ref="popover1", placement="bottom", width="500", trigger="hover")
              el-table(:data='roles', border, fit, style='width: 100%', align='center')
                el-table-column(prop='name', label='身份', align='center')
                el-table-column(prop='readApi', label='查看项目API', align='center')
                  template(slot-scope='scope')
                    span.el-icon-close(v-if='!scope.row.readApi')
                    span.el-icon-check(v-if='scope.row.readApi')
                el-table-column(prop='editApi', label='编辑项目API', align='center')
                  template(slot-scope='scope')
                    span.el-icon-close(v-if='!scope.row.editApi')
                    span.el-icon-check(v-if='scope.row.editApi')
                el-table-column(prop='editProject', label='编辑项目API', align='center')
                  template(slot-scope='scope')
                    span.el-icon-close(v-if='!scope.row.editProject')
                    span.el-icon-check(v-if='scope.row.editProject')
            i.ml-10.cu-d.el-icon-information(v-popover:popover1="")
      el-form-item(label='成员列表', prop='members')
        div.member-list.w-380.border
          el-row(v-for='(m, index) in pro.members', :key='m.id')
            el-col.ta-l(:span='14')
              span.ml-10 {{ m.name }}
            el-col(:span='8')
              el-select(v-model='m.role', size='small')
                el-option(v-for='(r, index) in roles', :value='r.name', :key='r.index', :label='r.name')
            el-col.ta-c(:span='2')
              i.el-icon-delete.cu-p.c-red(title="删除", @click='delMember(index)')
      el-form-item.ta-l(label='钉钉消息')
        el-form-item(prop='token')
          el-input.w-380(v-model='pro.dingInform.token', :maxlength=100, placeholder="钉钉token", title="钉钉token")
        el-form-item(prop='createEnabled')
          el-checkbox.mr-20(v-model='pro.dingInform.createEnabled') API创建时通知
          el-checkbox.mr-20(v-model='pro.dingInform.updateEnabled') API修改时通知
          el-checkbox.mr-20(v-model='pro.dingInform.deleteEnabled') API删除时通知
          el-checkbox.mr-20(v-model='pro.dingInform.testEnabled') API测试时通知
      el-form-item.ta-l(label='Tower任务')
        el-form-item(prop='用户名')
          el-row
            el-col.mr-20(:span=6)
              el-input(v-model='pro.towerInform.projectId', :maxlength=50,  placeholder="tower项目id", title="tower项目id")
            el-col.mr-20(:span=6)
              el-input(v-model='pro.towerInform.username', :maxlength=20, placeholder="tower用户名", title="tower用户名")
            el-col(:span=6)
              el-input(type='password', :maxlength=20, v-model='pro.towerInform.password', placeholder="tower密码", title="tower密码")
        el-form-item(prop='createEnabled')
          el-checkbox.mr-20(v-model='pro.towerInform.createEnabled') API创建时通知
          el-checkbox.mr-20(v-model='pro.towerInform.updateEnabled') API修改时通知
          el-checkbox.mr-20(v-model='pro.towerInform.deleteEnabled') API删除时通知
          el-checkbox.mr-20(v-model='pro.towerInform.testEnabled') API测试时通知
      el-form-item.ta-l(label='导入')
        el-row
          el-col.mr-20(:span=3)
            el-select(placeholder="选择或创建模块", filterable, v-model="importModule", allow-create)
              el-option(v-for="item in modules.moduleList", :key="item", :label="item", :value="item")
            el-upload.avatar-uploader.ta-l(:headers="imoprtHeaders", action="/api/api/import", :show-file-list="false", :on-success="handleImportSuccess", :before-upload="beforeImport")
              span.c-blue.cu-p(:span=3) 从postman导入
      div.ta-c
        el-button.mr-50(@click='$router.go(-1)') 返回
        el-button(type='primary', @click='submit()', :loading="submitting") {{submitting?'提交中':'提交'}}
  
</template>
<script lang='ts'>
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../../service/http'
import cache from '../../service/cache'
import rules from '../../service/rules'

class Project {
  name: string = ''
  logo: string = ''
  description: string = ''
  testUrl: string = ''
  dingInform: any = {
    token: '',
    createEnabled: false,
    updateEnabled: false,
    deleteEnabled: false,
    testEnabled: false
  }
  towerInform: any = {
    username: '',
    password: '',
    createEnabled: false,
    updateEnabled: false,
    deleteEnabled: false,
    testEnabled: false
  }
  members: Member[] = []
}
interface Member extends Object {
  id: string,
  name: string,
  group?: Object,
  role?: string
}
interface Role extends Object {
  name: string,
  editProject: boolean,
  editApi: boolean,
  readApi: boolean
}
@Component
export default class proAdd extends Vue {
  $refs: any
  $route: any
  $router: any
  $confirm: any
  $message: any
  sure2import: boolean = false
  headers: any = {
    'Authorization': cache.get('token') || ''
  }
  get imoprtHeaders() {
    return {
      'Authorization': cache.get('token') || '',
      pid: this.$route.params.proId,
      module: this.importModule
    }
  }
  rules: Object = {
    name: rules.name,
    testUrl: rules.testUrl,
    members: [
      {type: 'array', required: true, message: '请至少选择一个项目成员'}
    ]
  }
  user: any = {}
  pro: Project = new Project()
  roles: Role[] = []
  members: Member[] = []
  newMember: Member = {id: '', name: ''}
  newMemberRole: string = ''
  editMemberRole: string = ''
  modules: any = []
  importModule: string = ''
  async beforeMount() {
    if (this.$route.params.proId) {
      let resp1: any = await http.get('/api/project/' + this.$route.params.proId)
      this.pro = Object.assign(new Project(), resp1)
    } else {
      let user:any = cache.get('user')
      this.pro.members.push({
        id: user.id,
        name: user.name,
        role: 'master'
      })
    }
    let resp2:any = await http.get('/api/role')
    this.roles = resp2.roleList
    let resp3:any = await http.get('/api/member')
    this.members = resp3.memberList
    this.modules = await http.get('/api/project/' + this.$route.params.proId + '/api/module')
  }
  get availableMembers() {
    return this.members.filter((m:any) => {
      let isExist = false
      this.pro.members.forEach((p:any) => {
        if (p.id === m.id) isExist = true
      })
      return !isExist
    })
  }
  beforeAvatarUpload(file:any) {
    const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isJPG) {
      this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!')
    }
    if (!isLt2M) {
      this.$message.error('上传头像图片大小不能超过 2MB!')
    }
    return isJPG && isLt2M
  }
  handleAvatarSuccess(res:any, file:any) {
    this.pro.logo = res.imgUrl
  }
  async beforeImport(file:any) {
    const isJson = file.name.split('.').reverse().shift() === 'json'
    const isLt200M = file.size / 1024 / 1024 < 200
    if (!isJson) {
      this.$message.error('文件只能是JSON格式!')
    }
    if (!isLt200M) {
      this.$message.error('上传文件大小不能超过200MB!')
    }
    return isJson && isLt200M
  }
  handleImportSuccess(res:any, file:any) {
    res.errCode ? this.$message.error(res.message) : this.$message.info('导入成功')
  }
  addMember() {
    if (this.newMember && this.newMemberRole) {
      let newer: Member = {id: '', name: '', role: ''}
      newer.name = this.newMember.name
      newer.id = this.newMember.id
      newer.role = this.newMemberRole
      this.pro.members.push(newer)
      this.newMember = this.availableMembers[0]
    }
  }
  delMember(index: number) {
    this.pro.members.splice(index, 1)
  }
  submitting:boolean = false
  submit() {
    let that = this
    that.$refs.pro.validate(async (valid: boolean) => {
      if (valid) {
        that.submitting = true
        let op = that.$route.params.proId ? '修改' : '添加'
        try {
          let resp:any = that.$route.params.proId
            ? await http.put('/api/project/' + that.$route.params.proId, that.pro)
            : await http.post('/api/project', that.pro)
          if (resp.errCode === 0) {
            that.$router.push('/project/list')
            that.$message({ type: 'success', message: op + '成功！' })
          } else {
            that.$message({ type: 'error', message: resp.errMsg })
          }
        } catch (e) {
          console.error(e)
        }
        that.submitting = false
      }
      return false
    })
  }
}
</script>
<style lang='stylus' scoped>
.btn-go-back
  margin-right 750px
  margin-bottom 20px
.ml-15
  margin-left 15px
.member-list
  min-height 36px
  .el-row
    background-color #e4f0fb
    &:nth-child(even)
      background-color #eef1f6
.avatar-uploader
  .avatar-uploader-icon
    border 1px dashed #d9d9d9
    border-radius 6px
    cursor pointer
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
.ml-5
  margin-left -5px
.w-380
  width 835px
</style>
