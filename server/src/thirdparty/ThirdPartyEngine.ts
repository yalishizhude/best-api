/**
 * 接收接口事件，并调用对应第三方接口
 */
import Tower from './Tower'
import Dingding from './Dingding'
import * as events from 'events'
import {ProjectModel} from '../project/model'
import SystemCtrl from '../system/SystemCtrl'
import { Observable } from 'rxjs/Rx'

enum operation {
  create = 'create',
  delete = 'delete',
  update = 'update',
  test = 'test'
}

export default class ThirdPartyEngine {
  private static systemCtrl = new SystemCtrl()
  static c = operation.create
  static d = operation.delete
  static u = operation.update
  static t = operation.test

  static notify(type: operation, ifc: any):void {
    // 生成消息内容
    let genContent = this.systemCtrl.get()
      .map((cfg: any) => {
        let content = 
            `API名称：${ifc.name}\n
            修改者：${ifc.editor}\n
            操作：${type}\n
            [详情](${cfg.apiUrl}/project/${ifc.pid}/api/${ifc.id}/detail)
            `
        return content
      })
    // 生成需要执行的任务
    let genTask = Observable.from(ProjectModel.findOne({_id:ifc.pid}))
      .map((project: any) => {
        let taskList = []
        if (project.dingInform.token && project.dingInform[type+'Enabled']) {
          taskList.push(new Dingding(project.dingInform.token))
        }
        if (project.towerInform.token && project.towerInform[type+'Enabled']) {
          taskList.push(new Dingding(project.towerInform.totken))
        }
        return taskList
      })
    Observable.combineLatest(genContent, genTask)
      .subscribe((todo: any) => {
        todo[1].forEach((task: any) => {
          task.send(todo[0])
        })
      })
  }
}