import { MemberModel, MemberInterface } from './model'
import { Observable } from 'rxjs/Rx'
import { encrypt } from '../util/crypto'
import { mongoose } from '../util/db'
import BaseCtrl from '../util/BaseCtrl'
import {avatar, staticPath} from '../util/config'
import * as fs from 'fs'
import * as path from 'path'

export default class MemberCtrl extends BaseCtrl {
  private createAvatar(id:string):string {
    const str = avatar.replace('TEXT', id.substring(0,1)).replace('COLOR', '#'+Math.random().toString(16).substring(2, 8))
    const filename = path.join(staticPath, id+'.svg')
    fs.writeFileSync(filename, str)
    return path.join('/', 'api', filename)
  }
  resetPassword(payload:any, user:any, id:string) {
    if(user && user.isAdmin) {
      return Observable.from(MemberModel.update({_id: mongoose.Types.ObjectId(id)}, {
        $set: {
          password: encrypt(payload.newPassword)
        }
      }).exec())
    } else {
      return Observable.throw({
        errorCode: 222,
        errorMsg: '没有管理员权限'
      }) 
    }
  }
  get() {
    return this.from(MemberModel.aggregate().project({
      _id: 0,
      id: "$_id",
      isAdmin: 1,
      account: 1,
      name: 1
    }))
    .map((memberList: any) => { 
      return { memberList }
    })
  }
  getInfo(id: string) {
    return Observable.from(MemberModel.findOne({_id: mongoose.Types.ObjectId(id)}).exec())
    .map((doc:any) => {
      let u = doc._doc
      return {
        id: u.id,
        name: u.name,
        account: u.account,
        avatar: u.avatar || '',
        email: u.email || '',
        weixin: u.weixin || '',
        apiInform: u.apiInform || '',
        testInform: u.testInform || ''
      }
    })
  }
  post(member: any) {
    member.password = encrypt(member.password)
    member.avatarUrl = this.createAvatar(member.account)
    return Observable.fromPromise(new MemberModel(member).save())
      .map((x: any) => ({ id: x._id }))
  }
  put(id: string, member: any) {
    try {
      if (member.password) {
        member.password = encrypt(member.password)
      }
      if(member.reportStyle) {
        fs.writeFileSync('template', 'template.css')
      }
      if(member.reportTemplate) {
        fs.writeFileSync('template', 'template.body.html')
      }
      return Observable.fromPromise(MemberModel.update({ _id: mongoose.Types.ObjectId(id) }, {$set:member})
        .exec())
        .map((x: any) => ({ id: x._id }))
    } catch (e) {
      return Observable.throw(e)
    }
  }
  delete(_id: string) {
    return Observable.fromPromise(MemberModel.remove({ _id }).exec())
      .map((res: any) => ({ num: res.result.n }))
  }
}