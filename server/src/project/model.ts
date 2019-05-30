import { Schema, mongoose, Model } from '../util/db'
import { MemberSchema } from '../member/model'
import { TestSchema, TestInterface } from '../test/model'

let informObj = {
  createEnabled: {
    type: Boolean,
    default: false
  },
  updateEnabled: {
    type: Boolean,
    default: false
  },
  deleteEnabled: {
    type: Boolean,
    default: false
  },
  testEnabled: {
    type: Boolean,
    default: false
  },
  memberList: {
    type: Array,
    default: []
  }
}

let schemaObj = {
  name: {
    type: String,
    maxlength: 20,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: 200
  },
  testUrl: {
    type: String,
    maxlength: 200,
    alias: 'testAddress'
  },
  creator: {
    type: String,
    maxlength: 20,
    default: ''
  },
  createdTime: {
    type: Date
  },
  dingInform: Object.assign({
    token: {
      type: String,
      default: ''
    }
  }, informObj),
  towerInform: Object.assign({
    projectId: {
      type: String,
      default: ''
    },
    username: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: ''
    }
  }, informObj),
  openTest: {
    type: Boolean,
    default: false
  },
  masterList: [Schema.Types.ObjectId],
  developerList: [Schema.Types.ObjectId],
  guestList: [Schema.Types.ObjectId],
}

let ProjectSchema = new Schema(schemaObj)

enum role {
  guest = 'guest',
  master = 'master',
  developer = 'developer'
}

let ProjectModel = mongoose.model('project', ProjectSchema)

interface ProjectInterface {
  _id?: string,
  id: string,
  name: string,
  desc: string,
  testUrl: string
  apiChangedInform: boolean,
  testFailedInform: boolean,
  openTest: boolean
}

class Project extends Model {
  name = this.random()
  desc = this.random(30)
}

export {
  ProjectSchema,
  ProjectModel,
  ProjectInterface,
  role,
  Project
}