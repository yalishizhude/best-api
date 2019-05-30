<template lang="pug">
div.member.wrap 
  el-button.mb-10(type='text', icon='plus', @click="addMember()") 添加成员
  el-dialog(:title='operation', :visible.sync="showOperationForm")
    el-form.dialog-form(ref='member', :model='member', :rules='rules', label-position='right', label-width='100px')
      el-form-item.ta-l(label='账户', prop='account')
        el-input(:disabled="operation!=='添加成员'", size='small', v-model='member.account', placeholder="2-15位字母")
      el-form-item.ta-l(v-if="operation==='添加成员'||operation==='编辑成员'", label='昵称', prop='name')
        el-input(size='small', v-model='member.name', maxlength="20", placeholder="例如：王小明")
      el-form-item.ta-l(v-if="operation==='添加成员'||operation==='编辑成员'",label='管理员')
        el-checkbox(v-model='member.isAdmin', prop='isAdmin')
      el-form-item.ta-l(v-if="operation==='添加成员'", label='密码', maxlength="20",  prop='password')
        el-input(size='small', v-model='member.password', prop='password', type='password')
      el-form-item.ta-l(v-if="operation==='重置密码'", label='新密码', maxlength="20", prop='newPassword')
        el-input(size='small', v-model='member.newPassword', prop='password', type='password')
      el-form-item.ta-l(v-if="operation==='重置密码'", label='确认新密码', maxlength="20", prop='passwordSure')
        el-input(size='small', v-model='member.newPasswordSure', type='password')
      .ta-c
        el-button.mr-50(@click='cancel()') 取 消
        el-button(type='primary', @click='submit()', :disabled='submitting') {{ submitting ? '提交中' : '提 交' }}

  el-table.member-list(:data='memberList', border, fit)
    el-table-column(prop='account', label='账号', align='center')
    el-table-column(prop='name', label='姓名', align='center')
    el-table-column(prop='isAdmin', label='是否管理员', align='center')
      template(slot-scope='scope') {{scope.row.isAdmin}}
    el-table-column(label='操作', align='center')
      template(slot-scope='scope')
        el-button(@click.native.prevent='delMember(scope.$index)', type='text', size='small') 删除
        el-button(@click.native.prevent='editMember(scope.$index)', type='text', size='small') 编辑
        el-button(@click.native.prevent='resetPassword(scope.$index)', type='text', size='small') 重置密码
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../service/http.ts'
// import cache from '../service/cache.ts'
@Component
export default class member extends Vue {
  $refs: any
  $message: any
  $confirm: any
  $prompt: any
  operation: string = ''
  showOperationForm: boolean = false
  member: any = {
    account: '',
    isAdmin: false,
    password: ''
  }
  _member: any = {}
  rules: any = {
    account: [{required: true}, {message: '2-15位英文字母', pattern: /^[a-zA-Z]{2,15}$/}],
    name: [{required: true}],
    password: [{required: true}, {min: 6, message: '不少于6位字符'}],
    newPassword: [{required: true}, {min: 6, message: '不少于6位字符'}],
    passwordSure: [{pattern: new RegExp('^' + this.member.newPassword + '$'), message: '密码不一致'}]
    // passwordSure(rule:any, value:any, callback:any, source:any, options:any) {
    //   let errors:any[] = []
    //   if (value !== source.newPassword) {
    //     errors.push(
    //       new Error('两次密码不一致')
    //     )
    //   }
    //   callback(errors)
    // }
  }
  memberList: any[] = []
  async beforeMount () {
    let resp: any = await http.get('/api/member')
    this.memberList = resp.memberList || []
  }
  async delMember(index: number) {
    try {
      await this.$confirm('确认删除此成员?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      let resp:any = await http.delete('/api/member/' + this.memberList[index].id)
      if (resp.errCode === 0) {
        this.$message({type: 'success', message: '删除成功'})
        this.memberList.splice(index, 1)
      } else {
        this.$message({type: 'error', message: resp.errMsg || '删除失败'})
      }
    } catch (err) {}
  }
  editMember(index: number) {
    this.member = this.memberList[index]
    this._member = {
      name: this.member.name,
      isAdmin: this.member.isAdmin
    }
    this.operation = '编辑成员'
    this.showOperationForm = true
  }
  addMember() {
    this.member = {
      account: '',
      name: '',
      isAdmin: false,
      password: ''
    }
    this.operation = '添加成员'
    this.showOperationForm = true
  }
  resetPassword(index:number) {
    this.member = this.memberList[index]
    this._member = {
      password: this.member.password
    }
    this.member.newPassword = ''
    this.member.newPasswordSure = ''
    this.operation = '重置密码'
    this.showOperationForm = true
  }
  cancel() {
    if (this.operation === '添加成员') {
      this.member = {}
    } else if (this.operation === '编辑成员') {
      this.member.name = this._member.name
      this.member.isAdmin = this._member.isAdmin
    } else if (this.operation === '重置密码') {
      this.member.password = this._member.password
    }
    this.showOperationForm = false
    this.operation = ''
  }
  submitting:boolean = false
  submit() {
    let that = this
    this.$refs.member.validate(async (valid:boolean) => {
      if (valid) {
        that.submitting = true
        let resp: any
        if (that.operation === '添加成员') {
          resp = await http.post('/api/member', {
            account: that.member.account,
            name: that.member.name,
            isAdmin: that.member.isAdmin,
            password: that.member.password
          })
        } else if (that.operation === '编辑成员') {
          resp = await http.put('/api/member/' + that.member.id, {
            name: that.member.name,
            isAdmin: that.member.isAdmin
          })
        } else if (that.operation === '重置密码') {
          resp = await http.put('/api/member/' + that.member.id + '/reset', {
            newPassword: that.member.newPassword
          })
        }
        if (resp.errCode === 0) {
          if (that.operation === '添加成员' && resp.id) {
            that.member.id = resp.id
            that.memberList.push(that.member)
          }
          that.$message({type: 'success', message: that.operation + '成功'})
          that.showOperationForm = false
          that.member = {
            account: '',
            isAdmin: false,
            password: ''
          }
        } else {
          that.$message({type: 'error', message: resp.errMsg || (that.operation + '失败')})
        }
        that.submitting = false
      }
      return false
    })
  }
}
</script>

<style lang="stylus" scoped>
.member
  margin 0 auto
.dialog-form
  padding 0 20px 20px
</style>
