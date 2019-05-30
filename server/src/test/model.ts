import { Schema, mongoose, Model } from '../util/db' 

const TestSchema = new Schema({
  pid: {
    type: Schema.Types.ObjectId,
    required: true
  },
  startTime: Date,
  endTime: {
    type: Date,
    default: new Date
  },
  totalTime: Number,
  operatorId: String,
  totalTest: {
    type:Number,
    default: 0
  },
  successTest: {
    type: Number,
    default: 0
  },
  result: {
    type: String,
    default: ''
  },
  errorLog: String
})

interface TestInterface {
  pid: string,
  startTime: Date,
  endTime: Date,
  totalTime: number,
  operatorId: string,
  totalTest: number,
  successTest: number,
  result: string,
  errorLog: string
}

class Test extends Model {
  startTime = new Date
  totalTest = Math.ceil(Math.random() * 1000)
  successTest = Math.ceil(Math.random() * 100)
}

const TestModel = mongoose.model('Test', TestSchema)

export {
  TestSchema,
  TestModel,
  TestInterface,
  Test
}