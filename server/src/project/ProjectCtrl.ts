import { ProjectModel,role } from './model'
import { TestModel } from '../test/model'
import { MemberModel } from '../member/model'
import { InterfaceModel } from '../interface/model'
import { Observable } from 'rxjs/Rx'
import { Schema, mongoose } from '../util/db'
import exp from './export'
import BaseCtrl from '../util/BaseCtrl'
import * as _ from 'underscore'

export default class ProjectCtrl extends BaseCtrl {
  module = '项目'
  /**
   * 项目成员可查看所属项目，管理员可查看所有项目
   */
  get(uId: string, isAdmin: boolean) {
    let gg = ProjectModel.aggregate()
    if (!isAdmin) {
      gg.append({
        $addFields: {
          memberList: { $concatArrays: ['$developerList', '$masterList', '$guestList'] }
        }
      })
        .match({ memberList: { $in: [mongoose.Types.ObjectId(uId)] } })
    }
    return Observable.fromPromise(gg
      .lookup({
        from: InterfaceModel.collection.collectionName,
        localField: '_id',
        foreignField: 'pid',
        as: 'list'
      })
      .project({
        id: '$_id',
        name: 1,
        logo: 1,
        masterList: 1,
        api: {
          total: { $size: '$list' },
          pass: { $literal: 0 },
          untest: { $size: '$list' }
        }
      })
      .exec())
      .map((list: any) => { 
        list.forEach((pro:any) => {
          pro.editable = pro.deletable = false || isAdmin
          Array.prototype.forEach.call(pro.masterList || [], (userId:any) => {
            if(userId.toString()===uId.toString()) {
              pro.editable = pro.deletable = true
            }
          })
          delete pro.masterList
        })
        return {list}
      })
  }
  getById(id: string, uId: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, id, uId)
      .switchMap((authorized: boolean) => {
        return Observable.fromPromise(ProjectModel.aggregate()
          .match({ _id: mongoose.Types.ObjectId(id) })
          .lookup({
            from: MemberModel.collection.collectionName,
            localField: 'masterList',
            foreignField: '_id',
            as: 'm'
          })
          .lookup({
            from: MemberModel.collection.collectionName,
            localField: 'developerList',
            foreignField: '_id',
            as: 'd'
          })
          .lookup({
            from: MemberModel.collection.collectionName,
            localField: 'guestList',
            foreignField: '_id',
            as: 'g'
          })
          .append({
            $addFields: {
              m: {
                $map: {
                  input: '$m',
                  as: 'ml',
                  in: { id: '$$ml._id', name: '$$ml.name', role: 'master' }
                }
              },
              d: {
                $map: {
                  input: '$d',
                  as: 'dl',
                  in: { id: '$$dl._id', name: '$$dl.name', role: 'developer' }
                }
              },
              g: {
                $map: {
                  input: '$g',
                  as: 'gl',
                  in: { id: '$$gl._id', name: '$$gl.name', role: 'guest' }
                }
              }
            }
          })
          .project({
            _id: 0,
            id: '$_id',
            logo: 1,
            name: 1,
            description: 1,
            openTest: 1,
            testUrl: 1,
            towerInform: 1,
            dingInform: 1,
            members: { $concatArrays: ['$m', '$d', '$g'] }
          })
          .exec())
          .map((res: any) => {
            return res.pop()
          })
      })
  }
  getRole() {
    return Observable.of({
      "roleList": [
        {
          "name": "master",
          "editProject": true,
          "editApi": true,
          "readApi": true
        },
        {
          "name": "developer",
          "editProject": false,
          "editApi": true,
          "readApi": true
        },
        {
          "name": "guest",
          "editProject": false,
          "editApi": false,
          "readApi": true
        }
      ]
    })
  }
  getMemberList(id: string) {
    return Observable.from(ProjectModel.findOne({_id: mongoose.Types.ObjectId(id)}))
    .map((project:any) => {
      let list = project.masterList.concat(project.developerList, project.guestList)
      let idStr:any = []
      list.forEach((item:any) => idStr.push(item.toString()))
      return idStr
    })
  }
  post(project: any, uname: string) {
    try {
      project.creator = uname
      project.createdTime = new Date()
      return Observable.zip(Observable.of(project), this.devideMember(project.members), (x, y) => Object.assign(x, y))
        .switchMap((p: any) => {
          return Observable.fromPromise(ProjectModel.create(p))
            .map((proj: any) => ({ id: proj._id }))
        })
        .do((pro: any) => {
          this.newCreateMessage(pro.id, project.name, uname, _.pluck(project.members, 'id'))
        })
    } catch (e) {
      return Observable.throw(e)
    }
  }
  put(_id: string, project: any, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, _id, uid, [role.master])
      .switchMap(() => {
        return Observable.zip(Observable.of(project), this.devideMember(project.members), (x, y) => Object.assign(x, y))
          .switchMap((p: any) => {
            return Observable.fromPromise(ProjectModel.updateOne({ _id }, { $set: p }).exec())
              .map((res: any) => ({ num: res.n }))
          })
          .do((pro: any) => {
            this.newUpdateMessage(_id, project.name, uname, _.pluck(project.members, 'id'))
          })
      })
  }
  delete(id: string, uid: string, isAdmin: boolean, uname: string) {
    return this.verifyAuth(isAdmin, id, uid, [role.master])
      .switchMap((authorized: boolean) => {
        if (authorized) {
          return Observable.fromPromise(ProjectModel.findOneAndRemove({ _id: mongoose.Types.ObjectId(id) }).exec())
            .do((pro: any) => {
              let list = pro.masterList.concat(pro.developerList, pro.guestList)
              this.newDeleteMessage(id, pro.name, uname, _.pluck(list, 'id'))
            })
            .map((res: any) => {
              let num = res ? 1 : 0
              return { num }
            })
            .do(() => {
              InterfaceModel.remove({ pid: mongoose.Types.ObjectId(id) }).exec()
            })
        } else {
          return Observable.throw({ status: 403, message: '没有操作权限' })
        }
      })
  }
  export(pid: string, uid: string, isAdmin: boolean) {
    return this.verifyAuth(isAdmin, pid, uid)
      .switchMap((authorized: boolean) => {
        return exp.gen(pid)
          .map((url: any) => {
            return { url }
          })
      })
  }
  report(file: string) {
    return exp.readFile(file)
  }
  copy(id: string, name: string, uname: string) {
    // 复制项目
    return this.from(ProjectModel.findOne({
      _id: this.objectId(id)
    }))
    .switchMap((project: any) => {
      let pro = project.toJSON()
      delete pro._id
      pro.name = name
      pro.creator = uname
      pro.createdTime = new Date()
      return this.from(ProjectModel.create(pro))
    })
    .switchMap((resp:any) => {
      const pid = this.objectId(resp._doc._id)
      return this.from(InterfaceModel.find({pid: this.objectId(id)}))
        .map((ifcList:any) => {
          let list:any = []
          ifcList.forEach((ifc:any) => {
            let obj = ifc.toJSON()
            delete obj._id
            obj.pid = pid
            list.push(obj)
          })
          return list
        })
    })
    .switchMap((ifcList:any) => {
      return ifcList.length?this.from(InterfaceModel.create(ifcList)):this.of()
    })
    // 复制API
  }
  private devideMember(memberList: any = []) {
    return Observable.of(memberList)
      .map((list: any) => {
        let obj: any = {
          masterList: [],
          developerList: [],
          guestList: []
        }
        memberList.forEach((it: any) => {
          obj[it.role + 'List'].push(mongoose.Types.ObjectId(it.id))
        })
        return obj
      })
  }
}

