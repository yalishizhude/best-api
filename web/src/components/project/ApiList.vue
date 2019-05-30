<template lang="pug">
  div.api-list-wrap.p-r.us-n(:style="treeStyle")
    div(v-show="parseInt(treeStyle.width)>=visibleWidth")
      el-input.api-search(size='small', v-show='showTree', @keydown.esc.native="esc", icon='search', v-model='filterText', placeholder="查询接口[alt+f]")
      div.api-operation.ta-r
        i.mr-10.el-icon-caret-right.cu-p.c-gray(title="折叠", @click="fold(true)")
        i.mr-10.el-icon-caret-bottom.cu-p.c-gray(title="展开", @click="fold(false)")
        i.el-icon-plus.cu-p.c-blue(title="添加模块[alt+m]", @click="addModule")
      div.api-tree(v-loading="loading")
        el-tree.ta-l.ov-y-a.ov-x-h(v-show='showTree', ref='apiTree', @node-click='selectApi',
        class='filter-tree', :data="apiList", :props='defaultProps', :expand-on-click-node='false',
          node-key='id', :highlight-current="true",
          :filter-node-method='filterNode', :render-content='renderBtn', :empty-text="emptyText")
    div.drag-line(@mousedown='mousedown')
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch, Prop } from 'vue-property-decorator'
import http from '../../service/http.ts'
import {formatApiToTree, gId} from '../../service/util.ts'
import hotkeys from 'hotkeys-js'
import EventDelegate from '../../service/EventDelegate'

@Component
export default class apiList extends Vue {
  @Prop()
  proId: string
  @Prop()
  apiId: string
  @Prop()
  clickedId: string
  Mock: any
  $refs: any
  $message: any
  $confirm: any
  $prompt: any
  apiList: any[] = []
  showTree: boolean = true
  visibleWidth: number = 200
  startX: number = 0
  startWidth: number
  emptyText: string = 'API加载中...'
  treeStyle: any = {
    width: '200px'
  }
  loading: boolean = true
  mousedown(e:any) {
    this.startX = e.clientX
    this.startWidth = parseInt(this.treeStyle.width)
    EventDelegate.bind('mousemove', this.drag, 'ApiList')
    EventDelegate.bind('mouseup', () => {
      EventDelegate.unbind('mousemove', 'ApiList')
    }, 'ApiList')
  }
  drag(e:any) {
    let moveX:any = e.clientX - this.startX
    let width = '0px'
    if (moveX > 0) {
      // 右移动
      width = Math.max(this.visibleWidth, (this.startWidth + moveX)) + 'px'
    } else {
      // 左移动
      if (this.startWidth + moveX >= this.visibleWidth / 2) {
        width = Math.max(this.visibleWidth, (this.startWidth + moveX)) + 'px'
      }
    }
    this.treeStyle = {
      width
    }
  }
  fold(isFold: boolean) {
    let node: any = document.querySelectorAll('.api-tree .el-tree-node__expand-icon')
    Array.prototype.forEach.call(node, (n: any) => {
      let unfold = n.className.indexOf('expanded') < 0
      if (unfold && !isFold) n.click()
      if (!unfold && isFold) n.click()
    })
  }
  renderBtn(h:any, { node, data, store }:any) {
    let __this = this
    let createBtn = (icon: string, title: string) => {
      return h('el-button', {
        attrs: {
          type: 'text',
          title,
          icon
        },
        nativeOn: {
          click(e:any) {
            data.operation = icon
            __this.clickNodeBtn(data, icon)
          }
        }
      })
    }
    let tagClass : string[] = []
    let tagName: string = ''
    let apiNum: string = ''
    if (!data.children) {
      tagClass = ['el-tag', 'p-a', 'method-tag']
      const className: any = {
        GET: 'el-tag--primary',
        POST: 'el-tag--success',
        PUT: 'el-tag--warning',
        DELETE: 'el-tag--danger',
        'undefined': ''
      }
      tagName = data.method || ''
      tagName = tagName.substring(0, 3)
      tagClass.push(className[data.method])
    } else {
      apiNum = '(' + data.children.length + ')'
    }
    return h('div', {
      class: ['cu-d', 'tree-node'],
      attrs: {
        title: data.name,
        key: data.id
      }
    }, [
      h('span', {
        class: tagClass
      }, tagName),
      h('span', data.name + apiNum),
      h('div', {
        class: {
          'node-btns': true
        }
      }, data.label === 'module' ? [
        createBtn('document', '新增API'),
        createBtn('delete', '删除模块'),
        createBtn('edit', '编辑模块')
      ] : [
        createBtn('delete', '删除API'),
        createBtn('edit', '编辑API')
      ])
    ])
  }
  clickNodeBtn(item: any, icon: string) {
    switch (icon) {
      case 'document':
        this.$emit('add', item.name)
        break
      case 'edit':
        if (item.label === 'module') {
          this.editModule(item.name)
        } else {
          this.$emit('edit', item.id)
        }
        break
      case 'delete':
        if (item.label === 'module') {
          this.deleteModule(item.name)
        } else {
          this.$emit('delete', item.id)
        }
        break
    }
  }
  setNodeClicked(id?: string) {
    if (id) {
      setTimeout(() => {
        let parentNodeList = document.querySelectorAll('.api-list-wrap .el-tree-node')
        Array.prototype.forEach.call(parentNodeList, (parent: any) => {
          let leaf = parent.querySelector(`[key="${id}"]`)
          if (leaf) {
            if (parent.className.indexOf('is-expanded') < 0) {
              parent.querySelector('.el-tree-node__expand-icon').click()
            }
            leaf.click()
          }
        })
      }, 0)
    }
  }
  async refreshApiList(id?: string) {
    this.loading = true
    if (this.proId) {
      let resp: any = await http.get('/api/project/' + this.proId + '/api')
      if (resp.apiList) {
        let list: any = formatApiToTree(resp.apiList)
        this.apiList = list || []
        resp.apiList.length === 0 ? this.emptyText = '请先添加模块' : void 0
        if (id) {
          this.setNodeClicked(id)
        }
      } else {
        this.$message({type: 'error', message: resp.errMsg || '刷新失败'})
      }
    } else {
      console.error('无id，不查询')
    }
    this.loading = false
  }
  created() {
    this.$emit('getHandler', {
      refresh: (clickedId?: string) => this.refreshApiList(clickedId)
    })
    // 创建模块
    hotkeys('alt+m', (e:any) => {
      e.preventDefault()
      this.addModule()
    })
    // 创建API
    hotkeys('alt+n', (e:any) => {
      let btn: any
      btn = document.querySelector('.api-tree .is-current .el-icon-document')
      if (!btn) {
        const current: any = document.querySelector('.api-tree .is-current')
        const parent: any = current.parentNode
        const ancestor: any = parent.parentNode
        btn = ancestor.querySelector('.el-icon-document')
      }
      btn.click()
    })
    // 聚焦到搜索框
    hotkeys('alt+f', (e:any) => {
      e.preventDefault()
      let input:any = document.querySelector('.api-search input')
      input ? input.focus() : void 0
    })
    // 聚焦到第一个节点
    hotkeys('alt+t', (e:any) => {
      e.preventDefault()
      let leaf: any = document.querySelector('.api-tree .el-tree-node')
      leaf.click()
    })
  }
  esc(e:any) {
    this.filterText = ''
    e.target.blur()
  }
  destroyed() {
    hotkeys.unbind('alt+m')
    hotkeys.unbind('alt+f')
  }
  defaultProps: Object = {
    children: 'children',
    label: 'name'
  }
  filterText: string = ''
  @Watch('filterText')
  onFilterTextChanged(val: string, oldVal: string) {
    this.$refs.apiTree.filter(val)
  }
  filterNode(value:any, data:any) {
    if (!value) return true
    return data.name.indexOf(value) !== -1
  }
  selectApi(data:any, node:any, tree:any) {
    if (!data.operation) {
      this.$emit('view', data.id, data.name, data.label)
    }
    // debounce
    setTimeout(() => delete data.operation, 0)
  }
  async addModule() {
    let {value} = await this.$prompt('请输入模块名', '提示', {confirmButtonText: '确定', cancelButtonText: '取消'})
    if (value) {
      let id = gId()
      this.apiList.unshift({
        id,
        label: 'module',
        name: value,
        children: []
      })
      setTimeout(() => this.setNodeClicked(id), 0)
    }
  }
  async editModule(name: string) {
    let {value} = await this.$prompt('请输入模块名', '修改模块:' + name, {confirmButtonText: '确定', cancelButtonText: '取消'})
    try {
      if (value) {
        await http.put('/api/project/' + this.proId + '/api/module/' + name, {
          name: value
        })
        this.apiList.forEach((item:any) => {
          if (item.name === name) {
            item.name = value
          }
        })
      }
    } catch (e) {
      this.$message.error(e)
    }
  }
  async deleteModule(name: string) {
    try {
      await this.$confirm(`确认删除模块${name}?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await http.delete('/api/project/' + this.proId + '/api/module/' + name)
      let idx = 0
      this.apiList.forEach((item: any, index: number) => {
        if (item.name === name) idx = index
      })
      this.apiList.splice(idx, 1)
    } catch (e) {
      console.error(e)
    }
  }
}
</script>
<style lang="stylus">
.api-tree
  .el-tree-node__content
    display flex
    height 30px
    line-height 30px
    overflow hidden
    position relative
    .el-tree-node__expand-icon
      border-top-width 8px
      border-bottom-width 8px
      border-left-width 10px
      margin-top 6px
    .tree-node:hover
      .node-btns
        visibility visible
    .tree-node
      width 100%
      .node-btns
        position absolute
        right 10px
        top -3px
        visibility hidden
        .el-icon-delete
          color #FF4949
    .method-tag
      margin-left -38px
      margin-top 6px
      height 16px
      line-height 16px
      padding 0 2px
</style>
<style lang="stylus" scoped>
.api-list-wrap
  background-color #fff
  border 1px solid #eee
  border-right-width 0
  height 100%
  min-width 10px
  overflow-y auto
.api-operation
  padding 5px
.drag-line
  position absolute
  width 5px
  top 0
  right 0
  bottom 0
  z-index 1000
  border-right 1px solid #ccc
  cursor col-resize
.ml-10
  margin-left 10px
.append-table-row
  border 1px solid #dfe6ec
  border-top 0
.api-search
  padding 5px
.api-tree
  width 100%
  .el-tree
    border-width 0
    padding-bottom 1px
.btn-add-child-param
  top 50%
  transform translateY(-50%)
</style>

