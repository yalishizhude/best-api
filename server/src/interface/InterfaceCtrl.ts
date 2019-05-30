import { InterfaceModel, InterfaceHistoryModel } from './model'
import { ProjectModel, role } from '../project/model'
import { MemberInterface, MemberModel } from '../member/model'
import { Observable } from 'rxjs/Rx'
import BaseCtrl from '../util/BaseCtrl'
import { mongoose } from '../util/db'
import ProjectCtrl from '../project/ProjectCtrl'
import engine from '../thirdparty/ThirdPartyEngine'
import * as fs from 'fs'
import * as path from 'path'

let projectCtrl = new ProjectCtrl()

const gId = (): string => {
  return 'a' + Math.random().toString().substring(2)
}
const json2list = (json: any) => {
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
const list2schema = (list: any[]) => {
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
export default class InterfaceCtrl extends BaseCtrl {
  module = '接口'
  /**
   * 查询接口是否已存在
   * @param pid 项目id
   * @param url 请求路径
   * @param method 请求方法
   * @param uid 用户id
   * @param isAdmin 是否管理员
   */
  isExist(pid: string, url: string, method: string, uid: string, isAdmin: boolean) {
    return this.from(this.get(pid, uid, isAdmin))
      .map((result: any) => {
        let map: any = {}
        result.apiList.forEach((api: any) => {
          map[api.method.toLowerCase() + '-' + api.url.replace(/(\:)\w*/ig, '$1')] = api
        })
        let common: any = map[method.toLowerCase() + '-' + url.replace(/(\:)\w*/ig, '$1')] || { id: '' }
        return common
      })
  }
  /**
   * 查询项目下的接口列表
   * @param pid 项目id
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  get(pid: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap((authorized: boolean) => {
        return Observable.fromPromise(ProjectModel.aggregate()
          .match({ _id: mongoose.Types.ObjectId(pid) })
          .lookup({
            from: InterfaceModel.collection.collectionName,
            localField: '_id',
            foreignField: 'pid',
            as: 'list'
          })
          .project({
            _id: 0,
            id: '$_id',
            name: 1,
            total: { $size: '$list' },
            apiList: {
              $map: {
                input: '$list',
                as: 'i',
                in: {
                  id: '$$i._id',
                  name: '$$i.name',
                  module: '$$i.module',
                  version: '$$i.version',
                  method: '$$i.method',
                  url: '$$i.url',
                  isTest: '$$i.isTest',
                  testStatusId: '$$i.testStatusId',
                  testStatusMsg: '$$i.testStatusMsg'
                }
              }
            }
          })
          .exec())
          .map((list: any) => list.pop() || {})
      })
  }
  /**
   * 查询某个接口
   * @param pid 项目id
   * @param iid 接口id
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  getById(pid: string, iid: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap((authorized: boolean) => {
        return Observable.fromPromise(InterfaceModel.aggregate()
          .match({ _id: mongoose.Types.ObjectId(iid) })
          .append({
            $addFields: {
              id: '$_id',
              'request.dataList': '$request.paramList',
              'response.dataList': '$response.paramList',
              'request.paramList': '$request.urlParams'
            }
          })
          .project({ _id: 0 })
          .exec())
          .map((x: any) => x.pop())
      })
  }
  /**
   * 查询指定版本接口信息
   * @param iid 接口id
   * @param version 接口版本
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  getHistoryById(pid: string, iid: string, version: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap((authorized: boolean) => {
        return Observable.fromPromise(InterfaceHistoryModel.aggregate()
          .match({ iid: mongoose.Types.ObjectId(iid), version })
          .append({
            $addFields: {
              id: '$_id',
              'request.dataList': '$request.paramList',
              'response.dataList': '$response.paramList',
              'request.paramList': '$request.urlParams'
            }
          })
          .project({ _id: 0 })
          .exec())
          .map((res: any) => {
            return res.pop()
          })
      })
  }
  /**
   * 查询接口历史版本列表
   * @param iid 接口id
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  getVersionById(pid: string, iid: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap((authorized: boolean) => {
        return Observable.fromPromise(InterfaceHistoryModel.aggregate()
          .match({ iid: mongoose.Types.ObjectId(iid) })
          .project({
            version: 1,
            updateTime: { $dateToString: { format: '%Y-%m-%d %H:%M:%S', date: '$updateTime' } },
            updateMember: '$editor'
          })
          .exec())
          .map((versionList: any) => ({ versionList }))
      })
  }
  /**
   * 获取接口模块
   * @param pid 项目id
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  getModule(pid: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap(() => {
        return Observable.fromPromise(InterfaceModel.find({ pid: mongoose.Types.ObjectId(pid) })
          .distinct('module')
          .exec())
          .map((moduleList) => {
            return { moduleList }
          })
      })
  }
  /**
   * 新增接口
   * @param pid 项目id
   * @param ifce接口数据
   */
  post(pid: string, ifc: any, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, pid, uid, [role.developer, role.master])
      .switchMap(() => {
        return this.isExist(pid, ifc.url, ifc.method, uid, isAdmin)
      })
      .switchMap((common: any) => {
        if (common.id) {
          return this.throw({ errCode: 222, errMsg: '该API已经被创建', id: common.id, name: common.name })
        } else {
          ifc.pid = pid
          ifc.creator = uname
          ifc.request.urlParams = ifc.request.paramList
          ifc.request.paramList = ifc.request.dataList
          ifc.response.paramList = ifc.response.dataList
          ifc.createdTime = new Date().toISOString().replace('T', ' ').replace(/\..*/, '')
          return Observable.fromPromise(InterfaceModel.create(ifc))
        }
      })
      .do((ifc: any) => {
        projectCtrl.getMemberList(pid)
          .subscribe((memberList: any) => {
            engine.notify(engine.c, ifc)
            this.newCreateMessage(ifc.id, ifc.name, uname, memberList, ifc.url + ' ' + ifc.method)
          })
      })
      .map((doc: any) => ({ id: doc.id }))
  }
  /**
   * 修改接口
   * @param pid 项目id
   * @param iid 接口id
   * @param ifc 接口数据
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  put(pid: string, iid: string, ifc: any, uid: string, isAdmin: boolean, uname: string) {
    ifc.request.urlParams = ifc.request.paramList
    ifc.request.paramList = ifc.request.dataList
    ifc.response.paramList = ifc.response.dataList
    return this.verifyAuth(isAdmin, pid, uid, [role.developer, role.master])
      .switchMap(() => {
        return this.isExist(pid, ifc.url, ifc.method, uid, isAdmin)
      })
      .switchMap((common: any) => {
        if (common.id && common.id.toString() !== iid) return this.throw({ errCode: 222, errMsg: '该API已经存在', id: common.id, name: common.name })
        else return Observable.fromPromise(InterfaceModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(iid) }, { $set: ifc }).exec())
      })
      .switchMap((doc: any) => {
        if (doc) {
          let log = doc.toObject()
          log.iid = this.objectId(iid)
          log.editor = uname
          delete log._id
          delete log.version
          projectCtrl.getMemberList(pid)
            .subscribe((memberList: any) => {
              engine.notify(engine.u, ifc)
              this.newUpdateMessage(iid, ifc.name, uname, memberList, ifc.url + ' ' + ifc.method)
            })
          return Observable.fromPromise(InterfaceHistoryModel.create(log))
        } else {
          return Observable.throw('更新接口失败')
        }
      })
  }
  /**
   * 删除一个接口
   * @param pid 项目id
   * @param iid 接口id
   * @param uid 用户id
   * @param isAdmin 管理员权限
   */
  delete(pid: string, iid: string, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, pid, uid, [role.developer, role.master])
      .switchMap(() => {
        return Observable.fromPromise(InterfaceModel.findOneAndRemove({ _id: mongoose.Types.ObjectId(iid) }).exec())
          .do((doc: any) => {
            projectCtrl.getMemberList(pid)
              .subscribe((memberList: any) => {
                engine.notify(engine.d, doc)
                this.newDeleteMessage(iid, doc.name, uname, memberList, doc.url + ' ' + doc.method)
              })
            InterfaceHistoryModel.remove({ iid: mongoose.Types.ObjectId(iid) }).exec()
          })
      })
  }
  /**
   * 修改模块名称
   * @param pid 
   * @param module 当前模块名称
   * @param name 新模块名称
   * @param uid 用户id
   * @param isAdmin 
   * @param uname 
   */
  updateModule(pid: string, module:string, name: string, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, pid, uid, [role.developer, role.master])
      .switchMap((common: any) => {
        return Observable.fromPromise(InterfaceModel.updateMany({ pid, module }, { module:name }).exec())
      })
  }
  /**
   * 删除模块
   * @param pid 
   * @param module 
   * @param uid 
   * @param isAdmin 
   * @param uname 
   */
  deleteModule(pid: string, module: string, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, pid, uid, [role.developer, role.master])
      .switchMap(() => {
        return Observable.fromPromise(InterfaceModel.remove({pid, module}).exec())
          .do((doc: any) => {
            projectCtrl.getMemberList(pid)
              .subscribe((memberList: any) => {
                this.newDeleteMessage(this.objectId(pid), '批量删除', uname, memberList, `模块 "${module}" 被删除`)
              })
            InterfaceHistoryModel.remove({ module }).exec()
          })
      })
  }
  /**
   * 导入json数据
   * @param pid 项目id
   * @param module 模块名
   * @param files 导入文件
   * @param isAdmin 管理员权限
   * @param uid 用户id
   */
  import(pid: string, module: string, files: any, isAdmin: boolean = false, uname: string) {
    try {
      if (isAdmin) {
        let f = files.pop()
        let name = path.join('/', 'app', f.path)
        fs.renameSync(name, name + '.json')
        const file = JSON.parse(fs.readFileSync(name + '.json').toString())
        let list: any[] = []
        const ifcList = file.item.reverse()
        for (let i = 0; i < ifcList.length; i++) {
          const item = file.item[i]
          const { name } = item
          const description = item.request.description
          const method = item.request.method
          let urlList = item.request.url.raw.replace(/http(s)?:\/\//, '').split('/')
          let querystring = (item.request.url.raw.split('?')[1]||'').split('&')
          let urlParams = []
          for (let i = 0; i < querystring.length; i++) {
            urlParams.push({
              name: querystring[i].split('=')[0]
            })
          }
          urlList.shift()
          const url = '/' + urlList.join('/')
          const reqHeaderList = item.request.header
          const resHeaderList = item.response.header
          const payload = item.request.body.raw || "{}"
          const body = item.response.body || "{}"
          try {
            const reqDataList = json2list(JSON.parse(payload))
            const reqDataSchema = list2schema(reqDataList)
            const resDataList = json2list(JSON.parse(body))
            const resDataSchema = list2schema(resDataList)
            let ifc = {
              pid,
              url,
              name,
              module: module || 'unknown',
              remark: description,
              createdTime: new Date(),
              creator: uname,
              editor: uname,
              state: {
                id: 0,
                name: '待测试'
              },
              method,
              request: {
                urlParams,
                headerList: reqHeaderList,
                dataSchema: reqDataSchema
              },
              response: {
                headerList: resHeaderList,
                dataSchema: resDataSchema
              }
            }
            list.push(ifc)
          } catch(e) {
            console.error(e)
            return Observable.of({errCode: 400, message:'解析接口 "'+name+'" 失败!\n' + e})
          }
        }
        InterfaceModel.deleteMany(module ? { pid, module } : {pid}).exec()
        return Observable.fromPromise(InterfaceModel.insertMany(list))
      } else {
        return Observable.throw({ status: 403, message: '没有上传权限' })
      }
    } catch (e) {
      return Observable.throw(e)
    }
  }
}