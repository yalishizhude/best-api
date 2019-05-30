import { Schema, mongoose } from '../util/db'

let MessageSchema = new Schema({
  // 被操作对象的id
  objectId: Schema.Types.ObjectId,
  // 被操作的名称
  objectName: String,
  // 被操作的类型
  module: String,
  // 操作类型
  operation: {
    type: String,
    enum: ['create', 'update', 'delete', 'test']
  },
  // 操作者
  operator: {
    type: String,
    default: ''
  },
  // 操作内容描述
  content: {
    type: String,
    default: ''
  },
  //可读用户列表
  readableUserList: {
    type: [Schema.Types.ObjectId],
    default: []
  },
  //已读用户列表
  readUserList: {
    type: [Schema.Types.ObjectId],
    default: []
  },
  createdTime: {
    type: Date,
    default: new Date()
  }
})

let MessageModel = mongoose.model('message', MessageSchema)

export {
  MessageSchema,
  MessageModel
}