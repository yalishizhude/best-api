<template lang="pug">
div.param-editor(:id="id")
  el-tabs(v-model="activeTabName", type="border-card", @tab-click="tabClick(activeTabName)")
    el-tab-pane(label="表格", name="table")  
      a.f-r.demo(href="http://json-schema-faker.js.org/", target="_blank") JSON Schema Faker示例
      el-table.tab-pane.data-list-table(:data='dataList', border)
        el-table-column.d-f(prop='name', label='参数名', header-align='left')
          template(slot-scope='scope')
            el-tag.row-type(v-if="readonly", v-show="'string'===scope.row.type", type="gray") {{scope.row.type}}
            el-tag.row-type(v-if="readonly", v-show="'object'===scope.row.type", type="primary") {{scope.row.type}}
            el-tag.row-type(v-if="readonly", v-show="'array'===scope.row.type", type="success") {{scope.row.type}}
            el-tag.row-type(v-if="readonly", v-show="'number'===scope.row.type", type="warning") {{scope.row.type}}
            el-tag.row-type(v-if="readonly", v-show="'boolean'===scope.row.type", type="danger") {{scope.row.type}}
            i.el-icon-document.copy(v-else, v-show="scope.row.id!=='root'", title="复制属性", @click="copy(dataList, scope.row)")
            span.d-ib.icon-node(v-if='scope.row.ancestor.length>0', :class="scope.row.className")
            el-input.d-ib.f-1.param-name(v-if="!readonly", :disabled="scope.row.noName||scope.row.isRoot", v-model='scope.row.name', 
            :class="scope.row.className", size='small', :maxlength=50)
            div.ws-n.ov-h.to-e.row-name(v-else, :title="scope.row.name") {{scope.row.isRoot ? ' ' : scope.row.name}}
            el-select.data-select(v-if="!readonly", v-model='scope.row.type', 
            :key='scope.row.id', size='small', @change='changeType(dataList, scope.row, scope.$index)')
              el-option(v-for='(t, index) in types', :value='t', :key='index', :label='t')
            i.el-icon-plus.plus-btn.c-blue.cu-p(v-if="!readonly", v-show='scope.row.type.toLowerCase()==="object" || scope.row.type.toLowerCase() === "array"', @click='addData(dataList, scope.row, scope.$index)')
            i.el-icon-close.c-red.cu-p.plus-btn.ml-10(v-if="!readonly", size='mini', v-show="!scope.row.isRoot", @click='delData(dataList, scope.row, scope.$index)', icon='close', type='danger')
        el-table-column(prop='description', label='说明', header-align='center', min-width='80')
          template(slot-scope='scope')
            el-input(v-if="!readonly", :disabled="scope.row.noName", :maxlength=500, v-show="!scope.row.isRoot", v-model='scope.row.description', size='small')
            div.ws-n.to-e.ov-h(v-else, :title="scope.row.description") {{scope.row.description}}
        el-table-column(prop='required', label='必须', width='50', align='center')
          template(slot-scope='scope')
            el-checkbox(v-if="!readonly", v-show="!scope.row.isRoot", v-model='scope.row.required', size='normal')
            i.el-icon-check.c-blue(v-else, v-show="scope.row.required")
        el-table-column.p-r(prop='property', label='Schema属性', header-align='center', width='250')
          template(slot-scope='scope')
            el-input.property(v-if="!readonly", :title="scope.row.property", type="textarea", :rows="1", :maxlength=1000, v-model='scope.row.property', size='small', @blur="validateProperty")
            span(v-else, :title="scope.row.property") {{scope.row.property}}
            .schema-hint.p-f.ta-l
              div(v-if="scope.row.type==='array'")
                el-button(type="text", @click="addProp(scope.row, 'minItems', 1)") minItems 
                span 数组最小长度
                br
                el-button(type="text", @click="addProp(scope.row, 'maxItems', 10)") maxItems
                span 数组最大长度
                br
                el-button(type="text", @click="addProp(scope.row, 'enum', [])") enum
                span 枚举值
                br
              div(v-if="scope.row.type==='number'")
                el-button(type="text", @click="addProp(scope.row, 'type', 'integer')") integer
                span 整数
                br
                el-button(type="text", @click="addProp(scope.row, 'minimum', 0)") minimum 
                span 最小值
                br
                el-button(type="text", @click="addProp(scope.row, 'maximum', 1024)") maximum
                span 最大值
                br
                el-button(type="text", @click="addProp(scope.row, 'enum', [])") enum
                span 枚举值
                br
              div(v-if="scope.row.type==='string'")
                el-button(type="text", @click="addProp(scope.row, 'pattern', '')") pattern
                span 正则表达式,如 "abc?","\\w{12}"
                br
                el-button(type="text", @click="addProp(scope.row, 'format', '')") format
                span 固定格式字符串,支持"ipv4","date-time","email","hostname","uri"
                br
                el-button(type="text", @click="addProp(scope.row, 'minlength', 2)") minlength
                span 最小长度
                br
                el-button(type="text", @click="addProp(scope.row, 'maxlength', 10)") maxlength
                span 最大长度
                br
                el-button(type="text", @click="addProp(scope.row, 'enum', [])") enum
                span 枚举值
                br
    el-tab-pane(label="JSON", name="json")
      a.f-r.cu-p.demo(v-if="!readonly", @click="dialogVisible=true") 导入
      .cl-b
      pre.json.tab-pane
      el-dialog(size="small", title="导入json将覆盖当前参数，谨慎操作！", :visible.sync="dialogVisible", :before-close="handleClose")
        span.c-red {{jsonError}}
        el-input(type="textarea", :rows="15", v-model="json")
        div.ta-r
          el-button.mt-10(@click="cancel") 取 消
          el-button.mt-10.mr-10(type="primary", @click="importJson") 导 入
    el-tab-pane(label="Schema", name="schema")
      div.ta-l
        .c-red.f-l.demo {{errMsg}}
        a.f-r.demo(href="http://json-schema.org/latest/json-schema-core.html", target="_blank") JSON Schema 说明
        .cl-b
      .tab-pane.pl.p-r
        ol.p-a.line
          li(v-for="(line,index) in schemaLine", :key="index", :class="line?'error':''")
        pre.schema(:contenteditable="!readonly", @keyup='schemaChanged')
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import {Prop, Watch} from 'vue-property-decorator'
import jsf from 'json-schema-faker'
import _ from 'lodash'

let gId = (): string => {
  return 'a' + Math.random().toString().substring(2)
}

interface Param {
  id: string,
  ancestor: string[],
  name: string,
  type: string,
  required: boolean,
  isRoot?: boolean,
  property?: string,
  description?: string,
  className?: string
}

@Component
export default class ParamEditor extends Vue {
  @Prop()
  schema: any
  @Prop()
  readonly: boolean
  id: any = gId()
  typeTag: any = {
    string: 'gray',
    object: 'primary',
    array: 'success',
    number: 'warning',
    boolean: 'danger'
  }
  types: string[] = ['string', 'object', 'array', 'number', 'boolean', 'file']
  activeTabName: string = 'table'
  $confirm: any
  dataSchema: any = {}
  json: string = ''
  jsonError: string = ''
  dialogVisible: boolean = false
  dataList: Param[] = [{
    id: 'root',
    ancestor: [],
    name: '',
    type: 'object',
    description: '',
    isRoot: true,
    required: true
  }]
  schemaLine: any[] = []
  errMsg: string = ''
  beforeMount() {
    this.reload()
  }
  @Watch('schema')
  onSchemaChanged() {
    this.reload()
  }
  showSchemaError(text: string, err: any) {
    let _this = this
    let errors = err.toString().split(' ')
    const position = parseInt(errors.pop()) || 0
    let cursor: string = ''
    // 定位错误行数
    text.split('\n').forEach((content: string, index: number) => {
      if (cursor.length <= position && (cursor + content).length >= position) {
        _this.schemaLine[index] = true
        errors.splice(errors.length - 1, 1, ' line ' + index)
        _this.errMsg = errors.join(' ')
      }
      cursor += content + '\n'
    })
  }
  schemaChanged() {
    let preDom: any = document.querySelector(`#${this.id} pre.schema`)
    if (preDom) {
      try {
        this.dataSchema = JSON.parse(preDom.innerText)
        this.schemaLine = new Array(preDom.innerText.split('\n').fill(false).length) || []
        this.errMsg = ''
      } catch (e) {
        this.showSchemaError(preDom.innerText, e)
        if (preDom.innerText.trim() === '') {
          this.dataSchema = {
            id: 'root',
            type: 'object'
          }
        }
      }
      this.dataList = this.schema2list(this.dataSchema)
    }
  }
  reload() {
    if (this.schema && Object.keys(this.schema).length > 0) {
      this.dataSchema = this.schema
    } else {
      this.dataSchema = {
        id: 'root',
        name: '',
        type: 'object'
      }
    }
    this.dataList = this.schema2list(this.dataSchema)
  }
  cancel() {
    this.dialogVisible = false
    this.jsonError = ''
  }
  validateProperty(event: any) {
    let value = event.target.value || '{}'
    try {
      if (!/^{.*}$/.test(value.trim())) throw Error('不是对象')
      /* eslint-disable */
      eval('(' + value + ')')
      event.target.style.borderColor = ''
    } catch (e) {
      console.error(value, e)
      event.target.style.borderColor = 'red'
    }
  }
  importJson() {
    try {
      let data = JSON.parse(this.json)
      this.dataList = this.json2list(data)
      this.dataSchema = this.list2schema(this.dataList)
      let dom: any = document.querySelector(`#${this.id} pre.json`)
      dom.innerText = this.json
      this.json = ''
      this.jsonError = ''
      this.dialogVisible = false
    } catch (e) {
      this.jsonError = e.toString()
    }
  }
  copy(list:any, row:any) {
    let replica:any = []
    let index:number = 0
    let idMap:any = {}
    list.forEach((item:any, idx:number) => {
      if (item.id===row.id || item.ancestor.indexOf(row.id)>-1) {
        // 记录插入点
        index = item.id===row.id ? idx : index
        // 更新id
        idMap[item.id] = idMap[item.id] || gId()
        let newItem = _.cloneDeep(item)
        newItem.id = idMap[item.id]
        // 更新name
        if (newItem.name && !newItem.noName && item.id===row.id) {
          newItem.name += '_' + Math.random().toString().substring(2,4)
        }
        // 更新祖先id
        let ancestorStr:string = newItem.ancestor.join(',')
        for(let key in idMap) {
          ancestorStr = ancestorStr.replace(key, idMap[key])
        }
        newItem.ancestor = ancestorStr.split(',')
        replica.push(newItem)
      }
    })
    list.splice.apply(list, [index, 0].concat(replica))
  }
  handleClose(done: any) {
    done()
  }
  async delData(data:any, row:any, index:any) {
    let len:any = 1
    if (row.type.toLowerCase() === 'object' || row.type.toLowerCase() === 'array') {
      await this.$confirm('对象或数组将会同时删除全部子元素, 继续?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
      data.forEach((p:any, idx:any) => {
        if (p.ancestor.indexOf(row.id) > -1) {
          len++
        }
      })
      data.splice(index, len)
    } else {
      data.splice(index, len)
    }
  }
  addData(data:any, row?:any, index?:any) {
    let ancestor: string[] = row.ancestor.concat([row.id])
    let id = gId()
    data.splice(row ? index + 1 : data.length, 0, {
      id,
      ancestor,
      name: '',
      type: 'string',
      required: row.type !== 'array',
      description: '',
      noName: row.type === 'array', // 数组元素无属性名
      className: 'bg-' + ancestor.length,
      property: ''
    })
  }
  changeType(data:any, row:any, index:any) {
    let len:any = 0
    data.forEach((p:any, idx:any) => {
      if (p.ancestor.indexOf(row.id) > -1) { len++ }
    })
    if (row.type === 'object' || row.type === 'array') {
      // 如果没有子元素则添加
      if (len===0) {
        data.splice(index + 1, 0, {
          id: gId(),
          ancestor: row.ancestor.concat(row.id),
          name: '',
          type: row.type === 'object' ? 'string' : 'object',
          required: true,
          noName: row.type === 'array',
          description: '',
          className: 'bg-' + (row.ancestor.length + 1)
        })
      } 
    } else {
      // 如果之前有子元素则进行删除
      data.splice(index + 1, len)
    }
  }
  async tabClick(tabName: string) {
    if (tabName === 'schema') {
      let preDom: any = document.querySelector(`#${this.id} pre.schema`)
      try {
        this.dataSchema = this.list2schema(JSON.parse(JSON.stringify(this.dataList)))
        preDom.innerText = JSON.stringify(this.dataSchema, null, 2)
        this.schemaLine = new Array(preDom.innerText.split('\n').fill(false).length) || []
      } catch (e) {
        this.showSchemaError(preDom.innerText, e)
        console.error('转换schema失败：' + e)
      }
    } else if (tabName === 'table') {
      this.dataList = this.schema2list(this.dataSchema)
    } else if (tabName === 'json') {
      this.dataSchema = this.list2schema(JSON.parse(JSON.stringify(this.dataList)))
      let preJson: any = document.querySelector(`#${this.id} pre.json`)
      preJson.innerText = JSON.stringify(await this.getJson(this.dataSchema), null, 2)
    }
  }
  async getJson(schema: any) {
    // tuple array to single list
    let modifiedSchema = _.cloneDeep(schema)
    let tuple2single = (sch: any) => {
      if (sch.type === 'object') {
        for (let p in sch.properties) {
          if (sch.properties[p].type === 'object' || sch.properties[p].type === 'array') {
            tuple2single(sch.properties[p]) 
          }
        }
      } else if (sch.type === 'array') {
        sch.items = sch.items || []
        if (sch.items.length === 1) {
          sch.items = sch.items[0]
          if (sch.items.type === 'object') {  
            for (let p in sch.items.properties) {
              tuple2single(sch.items.properties[p]) 
            }
          }
          if (sch.items.type === 'array') {
            tuple2single(sch.items.items)
          }
        } else {
          sch.items.forEach((it: any) => {
            if (it.type === 'object' || it.type === 'array') {
              tuple2single(it)
            }
          })
        }
      }
    }
    tuple2single(modifiedSchema)
    return await jsf.resolve(modifiedSchema)
  }
  addProp(row: any, key: string, value: any) {
    try {
      if (key === 'format') {
        if (/ip/.test(row.name)) {
          value = 'ipv4'
        }
        if (/date|time/.test(row.name)) {
          value = 'date-time'
        }
        if (/mail/.test(row.name)) {
          value = 'email'
        }
        if (/host|domain/.test(row.name)) {
          value = 'hostname'
        }
        if (/url|uri/.test(row.name)) {
          value = 'uri'
        }
      }
      let json = JSON.parse(row.property || '{}')
      json[key] = json[key] || value
      row.property = JSON.stringify(json)
    } catch (e) {
      console.error(e)
    }
  }
  json2list(json: any) {
    const isArray = (x: any): boolean => {
      return Object.prototype.toString.call(x).indexOf('Array') > -1
    }
    const isObject = (x: any): boolean => {
      return Object.prototype.toString.call(x).indexOf('Object') > -1
    }
    const travel = (obj: any, name: string, ancestor: string[], list: any[]) => {
      let current: any = {
        id: ancestor.length > 0 ? gId() : 'root',
        name,
        ancestor,
        required: true,
        className: 'bg-' + ancestor.length
      }
      if (!name) current.noName = true
      let noName: boolean = false
      ancestor.length === 0 ? current.isRoot = true : void 0
      if (isObject(obj)) {
        current.type = 'object'
      } else if (isArray(obj)) {
        current.type = 'array'
        noName = true
        current.property = JSON.stringify({minItems: obj.length})
      }
      list.push(current)
      for (let p in obj) {
        if (isObject(obj[p])) {
          travel(obj[p], noName ? '' : p, ancestor.concat(current.id), list)
        } else if (isArray(obj[p])) {
          travel(obj[p], noName ? '' : p, ancestor.concat(current.id), list)
        } else {
          let child: any = {
            id: gId(),
            name: noName ? '' : p,
            ancestor: ancestor.concat(current.id),
            type: typeof obj[p],
            required: true,
            className: 'bg-' + ancestor.concat(current.id).length
          }
          if (noName) child.noName = true
          list.push(child)
        }
      }
    }
    let paramList: any = []
    travel(json, 'root', [], paramList)
    return paramList
  }
  schema2list (schemaObj: any): Param[] {
    let travel = (schema: any, list: Param[], ancestor: string[], required: boolean = false, noName: boolean = false) => {
      const exclude = ['id', 'name', 'type', 'required', 'description', 'properties', 'items']
      let row: any = {
        id: schema.id || gId(),
        name: schema.name,
        description: schema.description,
        type: schema.type,
        required,
        ancestor,
        isRoot: ancestor.length === 0,
        className: 'bg-' + ancestor.length,
        property: ''
      }
      let property: any = {}
      // 整数特殊处理
      if (schema.type === 'integer') {
        row.type = 'number'
        property.type = 'integer'
      }
      noName ? row.noName = true : void 0
      for (let p in schema) {
        if (exclude.indexOf(p) < 0) {
          property[p] = schema[p]
        }
      }
      if (Object.keys(property).length > 0) {
        row.property = JSON.stringify(property)
      }
      list.push(row)
      if (schema.type === 'array') {
        schema.items = schema.items || []
        schema.items.forEach((item: any, index: number) => {
          let min = schema.minItems || 0
          travel(item, list, ancestor.concat(schema.id), min > index, true)
        })
      } else if (schema.type === 'object') {
        schema.properties = schema.properties || {}
        for (let p in schema.properties) {
          schema.required = schema.required || []
          travel(schema.properties[p], list, ancestor.concat(schema.id), schema.required.indexOf(schema.properties[p].name) > -1)
        }
      }
    }
    let dataList: Param[] = []
    travel(schemaObj, dataList, [], false)
    return dataList
  }
  list2schema (list: Param[]): any {
    let append2parent = (ancestor: string[], origin: any, node: any, required: boolean): any => {
      if (ancestor.length === 0) {
        // 没有祖先，该节点为根节点
        for (let e in node) {
          origin[e] = node[e]
        }
      } else {
        const parentId = ancestor[ancestor.length - 1]
        if (origin.type === 'object') {
          origin.properties = origin.properties || {}
          if (origin.id === parentId) {
            origin.properties[node.name] = node
            if (required) {
              origin.required = origin.required || []
              origin.required.push(node.name)
            }
          } else if (ancestor.indexOf(origin.id) > -1) {
            for (let p in origin.properties) {
              let current = origin.properties[p]
              append2parent(ancestor, current, node, required)
            }
          }
        } else if (origin.type === 'array') {
          origin.items = origin.items || []
          if (origin.id === parentId) {
            origin.items.push(node)
            if (void 0 === origin.minItems || '' === origin.minItems) {
              origin.minItems = origin.items.length 
            }
          } else if (ancestor.indexOf(origin.id) > -1) {
            origin.items.forEach((current: any) => {
              append2parent(ancestor, current, node, required)
            })
          }
        }
      }
    }
    let result = {}
    list.forEach((row: any) => {
      // 过滤空白项
      if (row.name && row.name.trim() === '' && !row.noName && !row.isRoot) return
      let node = {
        name: row.name,
        type: row.type,
        id: row.id,
        description: row.description
      }
      if (row.property) {
        try {
          Object.assign(node, JSON.parse(row.property))
        } catch (e) {
          console.error('schema属性转换失败' + e)
        }
      }
      append2parent(row.ancestor, result, node, row.required)
    })
    return result
  }
  getSchema() {
    return this.list2schema(this.dataList)
  }
}
</script>
<style lang="stylus">
.param-editor
  for num in (1..10)
    .bg-{num} input
      // background-color convert('#f'+num+'f'+num+'f'+num)
    span.bg-{num}
      margin-left unit((num - 1) * 3,ch)
  .plus-btn
    margin-left 5px
    line-height 40px
  .el-table
    td,
    th
      height 40
      .cell
        padding 0 5px !important
  .data-list-table
    .cell
      display flex
</style>
<style lang="stylus" scoped>
.root
  line-height 40px
.data-select
  line-height 40px
  width 90px
  margin-left 5px
pre.schema, pre.json
  line-height 20px
  margin 0
  min-height 100px
  padding 5px
.icon-node
  position relative
  width 15px
  border-left 1px solid #ccc
.icon-node:after
  z-index 10
  content ''
  position absolute
  width 10px
  height 1px
  bottom 50%
  border-bottom 1px solid #ccc
.param-name
  line-height 40px
.pre
  line-height 1.5
.row-type
  margin 5px 6px 3px 0
  min-width 8ch
  text-align center
  line-height 18px
  height 20px
.row-name
  line-height 30px
  margin-left 1px
.demo
  margin-top -20px
  color: #666
.tab-pane 
  border 1px solid #eee
  max-height 500px
  overflow-x hidden
  overflow-y auto
  &.pl
    padding-left 30px
.property:hover
  &+.schema-hint
    display block
.schema-hint
  background-color #fff
  display none
  margin-top 35px
  padding 0 10px
  width 240px
  z-index 2
  button
    margin-right 2ch
    padding 0
    text-align left
  &:hover
    display block
.line
  margin 0
  left 30px
  line-height 20px
  padding 5px 
  li.error
    background-color #FF4949
    width 10px
.c-red
  color #FF4949
.copy
  height 14px
  margin-top 13px
  visibility hidden
  cursor pointer
tr:hover .copy
  visibility visible
</style>
