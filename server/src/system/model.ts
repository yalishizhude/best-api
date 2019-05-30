import { Schema, mongoose } from '../util/db'

let SystemSchema = new Schema({
  companyLogo: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  backupSize: {
    type: Number,
    default: 0
  },
  testAuto: {
    type: Boolean,
    default: 0
  },
  testInterval: {
    type: String,
    enum: ['', 'hourly', 'daily', 'monthly', 'weekly'],
    default: ''
  },
  testTime: {
    type: Number,
    default: ''
  }
})

let SystemModel = mongoose.model('system', SystemSchema)

enum SystemInterval {
  hourly = 'hourly',
  daily = 'daily',
  monthly = 'monthly',
  weekly = 'weekly'
}

enum SystemInformOperation {
  addInterface = "addInterface",
  editInterface = "editInterface",
  deleteInterface = "deleteInterface",
  autoTestInterface = "autoTestInterface"
}

export {
  SystemSchema,
  SystemModel,
  SystemInterval,
  SystemInformOperation
}
