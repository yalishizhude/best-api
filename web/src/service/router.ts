import Vue from 'vue'
import Router from 'vue-router'
import Index from '../components/home/Index.vue'
import Main from '../components/Main.vue'
import proAdd from '../components/project/proAdd.vue'
import proList from '../components/project/proList.vue'
import apiList from '../components/project/apiList.vue'
import test from '../components/test.vue'
import message from '../components/message.vue'
import member from '../components/member.vue'
import doc from '../components/doc.vue'
import set from '../components/set.vue'
import Profile from '../components/user/Profile.vue'
import Login from '../components/user/Login.vue'
const ApiIndex = () => System.import('../components/project/ApiIndex.vue')

const projectRouter = [
  {
    path: 'project/list',
    name: 'projectIndex',
    component: proList,
    meta: {
      requireLogin: true
    }
  },
  {
    path: 'project/add',
    name: 'proAdd',
    component: proAdd,
    meta: {
      requireLogin: true
    }
  },
  {
    path: 'project/:proId/edit',
    name: 'proEdit',
    component: proAdd,
    meta: {
      requireLogin: true
    }
  },
  {
    path: 'project/:proId/api',
    name: 'api',
    component: ApiIndex
  }
]
const testRouter = [{
  path: '/test',
  name: 'testIndex',
  component: test,
  meta: {
    requireLogin: true
  }
}]
const messageRouter = [{
  path: '/message',
  name: 'messageIndex',
  component: message,
  meta: {
    requireLogin: true
  }
}]
const memberRouter = [{
  path: '/member',
  name: 'memberIndex',
  component: member,
  meta: {
    requireLogin: true
  }
}]
const docRouter = [{
  path: '/doc',
  name: 'docIndex',
  component: doc,
  meta: {
    requireLogin: false
  }
}]
const setRouter = [{
  path: '/set',
  name: 'setIndex',
  component: set,
  meta: {
    requireLogin: true
  }
}]
const userRouter = [{
  path: '/user/profile',
  name: 'userProfile',
  component: Profile,
  meta: {
    requireLogin: true
  }
}]

const router: any = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Index
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '',
      name: 'main',
      component: Main,
      children: [
        ...projectRouter,
        ...testRouter,
        ...docRouter,
        ...userRouter,
        ...setRouter,
        ...messageRouter,
        ...memberRouter
      ]
    }
  ]
})

router.beforeEach((to: any, from: any, next: any) => {
  if (to.matched.some((res: any) => res.meta.requireLogin)) {
    if (localStorage.getItem('token')) {
      next()
    } else {
      next({ name: 'login' })
    }
  } else {
    next()
  }
})

export default router
