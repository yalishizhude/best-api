<template lang="pug">
div.nav-bar-wrap.p-a.t-0.r-0.l-0.h-40
  div.nav-bar.ta-l.p-r
    div.d-ib.company.cu-d.us-n(@click="refresh", title="点击刷新页面")
      img.logo(:src="logo")
      small {{company}}
    router-link.menu-item(v-for="item in menu", :key="item.routeName", v-if='!item.needAdmin||user.isAdmin', :to='{name:item.routeName}', active-class='menu-active', v-text="item.name")
    div.f-r
      router-link(:to='{name: "messageIndex"}', title="点击查看消息")
        i.fa.fa-bell-o.va-m.bell
        el-badge.message(v-if="user.name&&messageNum", :value='messageNum')
      el-popover(ref="popover1", placement="bottom", width="60", trigger='hover')
        router-link.ta-c.sub-menu-item(:to="{name: 'userProfile'}") 个人设置
        span.ta-c.sub-menu-item(@click='logout()') 退出账号
      span.d-ib.user(v-show='user.name', v-popover:popover1="")
        span.c-f.username {{user.name}}
        img.avatar(:src='user.avatar', alt='avatar', :title='user.name')
  el-dialog(:visible.sync="showLoginDialog", title="用户已注销，请登录")
    LoginForm(@success="showLoginDialog=false;refresh()")
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Cache from '../service/cache'
import http from '../service/http'
import { Watch } from 'vue-property-decorator'
import LoginForm from './LoginForm'

@Component({
  components: {
    LoginForm
  }
})
export default class NavBar extends Vue {
  $message: any
  $router: any
  user:any = {}
  company: string = ''
  logo: string = ''
  showLoginDialog: boolean = false
  messageNum: number = 0
  rules: any = {
    account: [{required: true}],
    password: [{required: true}]
  }
  menu: any = [{
    name: '项目',
    routeName: 'projectIndex'
  }, {
  //   name: '测试',
  //   routeName: 'testIndex'
  // }, {
    name: '成员',
    routeName: 'memberIndex',
    needAdmin: true
  // }, {
  //   name: '文档',
  //   routeName: 'docIndex'
  }, {
    name: '设置',
    routeName: 'setIndex',
    needAdmin: true
  }]
  async mounted() {
    let _this = this
    http.initLogin(() => {
      _this.showLoginDialog = true
    })
    this.routeChanged()
  }
  async refresh() {
    this.user = Cache.get('user') || {}
    let systemInfo: any = await http.get('/api/setting')
    this.company = systemInfo.companyName
    this.logo = systemInfo.companyLogo
    let messageInfo: any = await http.get('/api/message?unread=1')
    this.messageNum = messageInfo.total
  }
  @Watch('$route')
  routeChanged() {
    this.refresh()
  }
  hideDialog() {
    this.showLoginDialog = false
  }
  async logout () {
    let res:any = await http.get('/api/user/logout')
    if (res.errCode === 0) {
      Cache.clear()
      this.$router.replace({
        name: 'login'
      })
    } else {
      this.$message({type: 'error', message: res.errMsg || '退出失败'})
    }
  }
}
</script>


<style lang="stylus" scoped>
.company
  color #D3DCE6
  padding 0 20px
.nav-bar
  margin 0 auto
  background-color #20a0ff
  color #fff
.menu-item
  display inline-block
  padding 0 20px
  height 40px
  line-height 40px
  color #fff
  text-decoration none
.logo
  vertical-align middle
  height 30px
  min-width 30px
  margin-right 10px
.menu-active
  color #fff
  background-color #44abf7
.menu-item:hover
  background-color #44abf7
  border 0
.message
  color #fff
  cursor pointer
  margin-top -10px
  margin-right 20px
  margin-left -25px
  width 20px
  height 20px
  sup
    border-width 0
.sub-menu-item
  color #666
  display block
  padding 0 10px
  height 40px
  line-height 40px
  text-decoration none
  cursor pointer
  margin 0 -10px
.sub-menu-item:hover
  background-color #eee
.logout
  float right
  width 100px
.user
  height 40px
  line-height 40px
  vertical-align middle
  color #fff
  margin-right 20px
  background-color #20a0ff
  .username
    cursor default
    margin-right 10px 
    user-select none
  .avatar
    width 30px
    height 30px
    border-radius 50%
    margin-bottom 5px
    vertical-align middle
.bell
  color #fff
  margin-right 20px

</style>
