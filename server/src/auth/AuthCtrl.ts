import { MemberModel } from '../member/model'
import { Observable } from 'rxjs/Rx'
import { mongoose } from '../util/db'
import BaseCtrl from '../util/BaseCtrl'
import { encrypt, hash } from '../util/crypto'
import { key } from '../util/config'
import * as jwt from 'jsonwebtoken'

export default class AuthCtrl extends  BaseCtrl{
  login(account: string, password: string) {
    let loginTime = new Date().getTime()
    return Observable.fromPromise(MemberModel.findOneAndUpdate({
      account,
      password: encrypt(password)
    }, { $set: { loginTime } }).select('_id account name avatarUrl password isAdmin').exec())
      .map((user: any) => {
        if (user) {
          let token = jwt.sign(Object.assign(user.toObject(), { loginTime }), key)
          return {
            token,
            user: {
              id: user._id,
              account: user.account,
              name: user.name,
              isAdmin: user.isAdmin,
              avatar: user.avatarUrl
            }
          }
        } else {
          return {
            errCode: 401,
            errMsg: '用户名或密码错误'
          }
        }
      })
  }
  logout(id: string) {
    return Observable.fromPromise(MemberModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id) }, { $set: { loginTime: '' } }).exec())
      .map(() => ({}))
  }
  static authorize(ctx: any, next: any) {
    const whiteRoute = ['/api/user/login', '/api/user/logout', '/api/setting/upload/img', '/api/agent', '/api/report']
    if (whiteRoute.find((val: string) => ctx.path.startsWith(val) || /^\/\w{24}/.test(ctx.path))) {
      ctx.user = {}
      return next()
    } else if (/(\.html|\.png|\.jpg|\.css|\.svg)$/.test(ctx.path)) {
      return next()
    } else {
      if (ctx.headers.authorization) {
        let user = jwt.decode(ctx.headers.authorization) || { _id: new mongoose.Types.ObjectId() }
        return MemberModel.findOne({
          _id: mongoose.Types.ObjectId(user._id || ''),
          account: user.account,
          isAdmin: user.isAdmin,
          password: user.password,
          loginTime: user.loginTime
        }).then((user: any) => {
          if (!user) {
            ctx.status = 401
            ctx.body = '请登录'
          } else {
            ctx.user = user
            return next()
          }
        }, (e: any) => {
          ctx.body = e
        })
      } else {
        ctx.status = 401
        ctx.body = '请登录'
      }
    }
  }
}