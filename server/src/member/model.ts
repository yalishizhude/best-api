import { Schema, mongoose, Model } from '../util/db'

let MemberSchema = new Schema({
  account: {
    type: String,
    maxlength: 20,
    required: true,
    unique: true
  },
  name: {
    type: String,
    maxlength: 20
  },
  password: {
    type: String,
    maxlength: 32,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  avatarUrl: String,
  email: String,
  weixin: String,
  apiInform: Boolean,
  testInform: Boolean,
  loginTime: {
    type: Number,
    set(v:number) {
      return Math.round(v)
    }
  }
})

let MemberModel = mongoose.model('member', MemberSchema)


interface MemberInterface {
  id: string,
  account: string,
  name: string,
  password: string,
  avatarUrl: string,
  email: string,
  openid: string,
  interfaceNotify: boolean,
  testNotify: boolean
}

class Member extends Model {
  account: string = this.random()
  name: string = this.random()
  password: string = this.random()
  avatarUrl?: string
  email?: string
  openid?: string
  interfaceNotify?: boolean
  testNotify?: boolean
}

export {
  MemberSchema,
  MemberModel,
  MemberInterface,
  Member
}
