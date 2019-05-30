<template lang="pug">
  div
    div.test-list.ta-c
      h3.test-title 接口测试结果列表
      el-table(:data='testList')
        el-table-column(label='项目', prop='projectName', header-align='center')
        el-table-column(label='开始时间', prop='startTime', header-align='center')
        el-table-column(label='结束时间', prop='endTime', header-align='center')
        el-table-column(label='用时', prop='timeLength', header-align='center', width='100')
        el-table-column(label='发起者', prop='starter', header-align='center')
        el-table-column(label='测试结果', prop='result', header-align='center')
          template(slot-scope='scope')
            span(v-if='scope.row.result.allPass') 全部通过
            span(v-if='!scope.row.result.allPass') {{'通测:' + scope.row.result.passTest}}
            span(v-if='!scope.row.result.allPass') {{'未测:' + scope.row.result.unTest}}
            span(v-if='!scope.row.result.allPass') {{'失败:' + scope.row.result.failTest}}
        el-table-column(label='', width='100')
          template(slot-scope='scope')
            el-button(size='small', v-if='!scope.row.result.allPass', @click='reTest(scope.row.projectId)') 重测
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import http from '../service/http.ts'
interface TestInfo extends Object {
  projectName?: string,
  projectId?: string,
  startTime?: string,
  endTime?: string,
  timeLength?: string,
  starter?: string,
  result?: ResultInfo
}
interface ResultInfo extends Object {
  allPass?: boolean,
  passTest?: number,
  failTest?: number,
  unTest?: number
}
@Component
export default class test extends Vue {
  testList: TestInfo[] = []
  async beforeMount() {
    let resp:any = await http.get('/api/test')
    this.testList = resp.list || []
  }
  async reTest(id:string) {
    await http.put('/api/test/' + id)
  }
}
</script>

<style lang="stylus" scoped>
.test-list
  padding 0 50px
</style>
