import { Schema, mongoose, Model } from '../util/db'

let paramSchemaObj = {
  _id: false,
  headerList: {
    type: [{
      _id: false,
      key: String,
      value: String
    }],
    default: []
  },
  dataSchema: Schema.Types.Mixed
  // paramList: {
  //   type: [{
  //     _id: false,
  //     id: String,
  //     name: String,
  //     required: Boolean,
  //     ancestor: [String],
  //     type: {
  //       type: String,
  //       enum: ['String', 'Number', 'Boolean', 'Object', 'Array'],
  //       set(v: string) {
  //         return `${v[0].toUpperCase()}${v.slice(1)}`
  //       }
  //     },
  //     mock: String,
  //     remark: String
  //   }],
  //   default: []
  // }
}

let requestSchema = new Schema(Object.assign({
  urlParams: {
    type: [{
      _id: false,
      id: String,
      name: String,
      required: Boolean,
      mock: String,
      remark: String
    }],
    default: []
  }
}, paramSchemaObj))

let responseSchema = new Schema(Object.assign({
  errList: {
    type: [{
      _id: false,
      enabled: Boolean,
      data: String,
      remark: String,
      probability: {
        type: Number,
        min: 0,
        max: 100
      }
    }],
    default: []
  }
}, paramSchemaObj))

let InterfaceSchemaObj = {
  iid: Schema.Types.ObjectId,
  pid: {
    type: Schema.Types.ObjectId,
    required: true,
    set: (v: string | any) => mongoose.Types.ObjectId(v)
  },
  url: {
    type: String,
    match: /^\//,
    required: true
  },
  name: {
    type: String,
    maxlength: 40,
    required: true
  },
  version: {
    type: String,
    default: () => new Date().getTime().toString(36)
  },
  module: String,
  remark: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  createdTime: {
    type: Date,
    required: true
  },
  updateTime: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  creator: String,
  editor: String,
  isTest: {
    type: Boolean,
    default: false
  },
  testStatusId: Boolean,
  testStatusMsg: String,
  needTest: {
    type: Boolean,
    default: false
  },
  delay: Number, //单位：毫秒
  state: {
    type: Object,
    enum: [{
      _id: false,
      id: 0,
      name: '待测试'
    }, {
      _id: false,
      id: -1,
      name: '测试不通过'
    }, {
      _id: false,
      id: 1,
      name: '测试通过'
    }]
  },
  method: {
    type: String,
    required: true,
    uppercase: true
  },
  request: requestSchema,
  response: responseSchema
}

enum method {
  get = 'GET',
  post = 'POST',
  put = 'PUT',
  delete = 'DELETE'
}
enum dataType {
  string = 'String',
  number = 'Number',
  boolean = 'Boolean',
  object = 'Object',
  array = 'Array'
}

let InterfaceSchema = new Schema(InterfaceSchemaObj)
let InterfaceHistorySchema = new Schema(InterfaceSchemaObj)

let InterfaceModel = mongoose.model('interface', InterfaceSchema)
let InterfaceHistoryModel = mongoose.model('interfacehistory', InterfaceHistorySchema)

class Interface extends Model {
  name = this.random()
  url = '/' + this.random()
  method = method.get
  version = this.random(4)
}

export {
  InterfaceSchema,
  InterfaceHistorySchema,
  InterfaceModel,
  InterfaceHistoryModel,
  method,
  dataType,
  Interface
}