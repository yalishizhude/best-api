import { InterfaceModel } from '../interface/model'
import { mongoose } from '../util/db'
import { Observable } from 'rxjs/Rx'
import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import * as jsf from 'json-schema-faker'

const prefix = 'api'
const dist = 'report'
const src = 'template'
const title = 'API文档'

const getFile = (name: string) => {
  try {
    return fs.readFileSync(path.join(src, name)).toString()
  } catch (e) {
    console.error(e)
    return ''
  }
}

const setFile = (name: string, data: string) => {
  try {
    fs.existsSync(dist) ? void 0 : fs.mkdirSync(dist)
    return fs.writeFileSync(path.join(dist, name), data)
  } catch (e) {
    console.error(e)
    return e
  }
}

const exist = (name: string) => fs.existsSync(path.join('template', name))

const getIfc = (ifc: any) => {
  let obj: any = {
    name: ifc.name,
    method: ifc.method,
    desc: ifc.remark,
    url: ifc.url,
    urlParams: ifc.request.urlParams || [],
    requestParams: [],
    requestExample: '',
    responseParams: [],
    responseExample: '',
    exceptions: []
  }
  ifc.request.paramList = ifc.request.dataSchema ? schema2list(ifc.request.dataSchema) : []
  ifc.request.paramList.forEach((it: any) => {
    if (!it.noName && !it.isRoot) {
      obj.requestParams.push({
        name: it.name,
        desc: it.description,
        type: it.type
      })
    }
  })
  ifc.response.paramList = schema2list(ifc.response.dataSchema)
  ifc.response.paramList.forEach((it: any) => {
    if (!it.noName && !it.isRoot) {
      obj.responseParams.push({
        name: it.name,
        desc: it.description,
        type: it.type
      })
    }
  })
  ifc.response.errList.forEach((it: any) => {
    obj.exceptions.push({
      param: it.mock,
      desc: it.remark
    })
  })
  let obs: any = Observable.from(jsf.resolve(ifc.response.dataSchema))
  if (ifc.request.paramList.length > 0) {
    obs.combineLatest(Observable.from(jsf.resolve(ifc.request.dataSchema)))
  }
  return obs.map((res: any, req: any) => {
    obj.responseExample = JSON.stringify(res, null, 2)
    if (req) obj.requestExample = JSON.stringify(req, null, 2)
    return obj
  })
}

export default {
  gen(pid: string) {
    let headTpl = getFile('default.head.html')
    let htmlTpl = getFile('default.html')
    let bodyTpl = exist('template.body.html') ? getFile('template.body.html') : getFile('default.body.html')
    let css = exist('template.css') ? getFile('template.css') : getFile('default.css')
    let head = _.template(headTpl)({ css: `${pid}.css`, title , style: css})
    return Observable.fromPromise(InterfaceModel.find({ pid: mongoose.Types.ObjectId(pid) }))
      .switchMap((interfaceList: any) => {
        let obs: any = []
        interfaceList.forEach((ifc: any) => {
          obs.push(getIfc(ifc))
        })
        return Observable.combineLatest.apply(null, obs)
      })
      .map((ifcList: any) => {
        let str = ''
        ifcList.forEach((ifc: any) => str += _.template(bodyTpl)(ifc))
        return str
      })
      .catch((e: any) => {
        console.error(e)
        return Observable.of(e)
      })
      .map((body: any) => {
        let content = _.template(htmlTpl)({ head, body })
        const file = path.join(dist, pid)
        setFile(file + '.html', content)
        setFile(file + '.docx', content)
        return path.join('/', prefix, dist, `${pid}.html`)
      })
  },
  readFile(filePath: string) {
    return Observable.of(fs.readFileSync(path.join(dist, filePath)))
  }
}

interface Param {
  id: string,
  ancestor: string[],
  name: string,
  type: string,
  required: boolean,
  isRoot?: boolean,
  property?: string,
  description?: string,
  className?: string
}

const schema2list = (schemaObj: any): Param[] => {
  let travel = (schema: any, list: Param[], ancestor: string[], required: boolean = false, noName: boolean = false) => {
    const exclude = ['id', 'name', 'type', 'required', 'description', 'properties', 'items']
    let row: any = {
      id: schema.id || Math.random().toString(36).substring(2, 10),
      name: schema.name,
      description: schema.description,
      type: schema.type,
      required,
      ancestor,
      isRoot: ancestor.length === 0,
      className: 'bg-' + ancestor.length
    }
    noName ? row.noName = true : void 0
    let property: any = {}
    // 整数特殊处理
    if (schema.type === 'integer') {
      row.type = 'number'
      property.type = 'integer'
    }
    for (let p in schema) {
      if (exclude.indexOf(p) < 0) {
        property[p] = schema[p]
      }
    }
    if (Object.keys(property).length > 0) {
      row.property = JSON.stringify(property)
    }
    list.push(row)
    if (schema.type === 'array') {
      schema.items = schema.items || []
      schema.items.forEach((item: any, index: number) => {
        let min = schema.minItems || 0
        travel(item, list, ancestor.concat(schema.id), min > index, true)
      })
    } else if (schema.type === 'object') {
      schema.properties = schema.properties || {}
      for (let p in schema.properties) {
        schema.required = schema.required || []
        travel(schema.properties[p], list, ancestor.concat(schema.id), schema.required.indexOf(schema.properties[p].name) > -1)
      }
    }
  }
  let dataList: Param[] = []
  travel(schemaObj, dataList, [], false)
  return dataList
}