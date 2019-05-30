import * as path2reg from 'path-to-regexp'
import { InterfaceModel, Interface } from '../interface/model'
import { Observable } from 'rxjs/Rx'
import { mongoose } from '../util/db'
import Probability from './probability'
import * as Ajv from 'ajv'
import * as jsf from 'json-schema-faker'

let tuple2single = (sch: any) => {
  if (sch.type === 'object') {
    for (let p in sch.properties) {
      if (sch.properties[p].type === 'object' || sch.properties[p].type === 'array') {
        tuple2single(sch.properties[p]) 
      }
    }
  } else if (sch.type === 'array') {
    if (sch.items.length === 1) {
      sch.items = sch.items[0]
      if (sch.items.type === 'object') {  
        for (let p in sch.items.properties) {
          tuple2single(sch.items.properties[p]) 
        }
      }
      if (sch.items.type === 'array') {
        tuple2single(sch.items.items)
      }
    } else {
      sch.items.forEach((it: any) => {
        if (it.type === 'object' || it.type === 'array') {
          tuple2single(it)
        }
      })
    }
  }
}

export default (ctx: any, next: any) => {
  let { method, path, query, headers, body } = ctx.request
  let _path = path.replace('/', '').split('/')
  let pid = _path.shift()
  path = '/' + _path.join('/')
  if (/\w{24}/.test(pid)) {
    return Observable.fromPromise(InterfaceModel.find({ pid: mongoose.Types.ObjectId(pid), method }))
      .throttleTime(500)
      .map((ifcList: any) => {
        let keys: any = []
        let match: any
        let ifc: any = []
        // 排序，优先匹配实参路径，如 /yy,/:xx 优先匹配/yy
        ifcList.sort((a: any, b: any) => b.url.localeCompare(a.url))
        for(let i=0; i<ifcList.length; i++) {
          let re = path2reg(ifcList[i].url, keys, { strict: true })
          match = re.exec(path) 
          if (match) {
            ifc = ifcList[i]
            break
          }
        }
        if (match) {
          // 地址栏参数对象
          let query = ctx.query
          // 请求体对象
          let payload = ctx.request.fields
          // 占位符参数
          let param: any = {}
          keys.forEach((key: any, index: number) => {
            param[key.name] = match[index + 1]
          })
          let paramValid: any = []
          // 校验请求体
          let errorMsg = validate(ifc.request.dataSchema, ctx.request.fields || {})
          if (errorMsg.length) {
            ctx.body = {
              errorCode: 400,
              errorMsg
            }
          } else {
            return new Promise((resolve, rejct) => {
              setTimeout(() => {
                if(ifc.response.headerList) {
                  ifc.response.headerList.forEach((it: any) => {
                    ctx.set(it.key, it.value)
                  }) 
                }
                // if (ifc.response.errList && ifc.response.errList.length) {
                //   let list:any = []
                //   ifc.response.errList.forEach((item: any) => {
                //     if (item.enabled) {
                //       let response
                //       try {
                //         response = eval(item.data)
                //       } catch (e) {
                //         console.error(e)
                //         response = item.data
                //       }
                //       list.push({
                //         p: item.probability + '%',
                //         fn: () => ctx.body = item.response
                //       })
                //     }
                //   })
                //   let p = new Probability(list)
                //   p.roll()
                // } 
                tuple2single(ifc.response.dataSchema)
                Observable.from(jsf.resolve(ifc.response.dataSchema))
                .subscribe((data: any) => {
                  ctx.body = data
                  resolve()
                })
              }, ifc.delay)
            })
          }
        } else {
          next()
        }
      })
      .toPromise()
  } else {
    return next()
  }
}

let validate = (schema: any, data: any) => {
  if (schema) {
    let ajv = new Ajv()
    let validate = ajv.compile(schema)
    let valid = validate(data)
    return valid ? '' : validate.errors 
  } else {
    return ''
  }
}