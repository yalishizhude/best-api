import { ProjectModel, role } from '../project/model'
import { Observable } from 'rxjs/Rx'
import { mongoose } from './db'
import { MessageModel } from '../message/model'
import * as _ from 'underscore'

export default class BaseCtrl {
  protected model: any
  protected throw = Observable.throw
  protected from = Observable.from
  protected of = Observable.of
  protected module: string

  protected operate(op: string, ...arg:any[]) {
    return this.from(this.model[op](...arg).exec())
  }
  protected aggregate(...arg: any[]) {
    return this.operate('aggregate', ...arg)
  }
  protected update(...arg: any[]) {
    return this.operate('update', ...arg)
  }
  /**
   * 记录操作，生成系统消息
   * @param id 数据id
   * @param name 数据名
   * @param content 操作内容
   * @param operation 操作
   */
  protected newMessage(objectId: string, objectName: string, operation: string, operator: string, readableUserList: string[], content?: string) {
    if (this.module) {
      MessageModel.create({
        objectId,
        objectName,
        module: this.module,
        content,
        operator,
        readableUserList,
        operation
      }).then(() => { }, (e: any) => console.error(e))
    } else {
      console.error('请先设置模块')
    }
  }

  protected newCreateMessage(id: string, name: string, operator: string, userList: string[], content?: string) {
    return this.newMessage(id, name, 'create', operator, userList, content)
  }

  protected newUpdateMessage(id: string, name: string, operator: string, userList: string[], content?: string) {
    return this.newMessage(id, name, 'update', operator, userList, content)
  }

  protected newDeleteMessage(id: string, name: string, operator: string, userList: string[], content?: string) {
    return this.newMessage(id, name, 'delete', operator, userList, content)
  }

  protected newTestMessage(id: string, name: string, operator: string, userList: string[], content?: string) {
    return this.newMessage(id, name, 'test', operator, userList, content)
  }

  /**
   * 数据模型
   */
  protected objectId(id?: string | string[]) {
    if (id) {
      if (typeof id === 'string' && id.length === 24) {
        return mongoose.Types.ObjectId(id)
      } else if (_.isArray(id)) {
        let list:string[] = []
        Array.prototype.forEach.call(id, (i:string)=> {
          list.push(mongoose.Types.ObjectId(i))
        })
        return list
      } else {
        return id
      }
    } else {
      return mongoose.Types.ObjectId()
    }
  }
  /**
   * 根据项目id和用户id查询对应角色
   * @param pid 项目id
   * @param uid 用户id
   */
  protected getProjectRole(pid: string, uid: string): Observable<string> {
    return Observable.from(ProjectModel.aggregate()
      .match({ _id: mongoose.Types.ObjectId(pid) })
      .project({
        m: {
          $map: {
            input: '$masterList',
            as: 'ml',
            in: { id: '$$ml', role: 'master' }
          }
        },
        d: {
          $map: {
            input: '$developerList',
            as: 'dl',
            in: { id: '$$dl', role: 'developer' }
          }
        },
        g: {
          $map: {
            input: '$guestList',
            as: 'gl',
            in: { id: '$$gl', role: 'guest' }
          }
        }
      })
      .project({ members: { $concatArrays: ['$m', '$d', '$g'] } })
      .exec())
      .map((projectList: any = []) => {
        let project = projectList.pop() || { members: [] }
        let member = project.members.filter((x: { id: string, role: string }) => x.id.toString() == uid.toString()).pop() || {}
        return member.role
      })
  }
  /**
   * 根据项目id和用户id，查询是否属于该角色是否具有对应权限
   * @param pid 项目id
   * @param uid 用户id
   * @param roleList 角色列表
   */
  protected verifyProjectRole(pid: string, uid: string, roleList?: role[]) {
    return this.getProjectRole(pid, uid)
      .map((r: string) => {
        return r ? (roleList || [r]).includes(r) : false
      })
  }
  /**
   * 查询用户是否具有权限
   * @param isAdmin 是否管理员
   * @param pid 项目id
   * @param uid 用户id
   * @param roleList 角色列表
   */
  protected verifyAuth(isAdmin: boolean, pid: string, uid: string, roleList?: role[]) {
    return Observable.from(isAdmin ? Observable.of(true) : this.verifyProjectRole(pid, uid, roleList))
      .switchMap((authorized: boolean) => authorized ? Observable.of(true) : Observable.throw({ status: 403, message: '操作权限不够' }))
  }
}
