import _ from 'lodash'
import http from '../../service/http'
import { Message } from 'element-ui'

export default class Api {
  proId: string = ''
  constructor(proId: string) {
    this.proId = proId
  }
  async get(id: string, params: any) {
    return await http.get(`/api/project/${this.proId}/api/${id}`, {
      params
    })
  }
  async post(params: any) {
    try {
      // 过滤空数据
      params.request.paramList = params.request.paramList.filter((item: any) => item.name)
      let result = await http.post(`/api/project/${this.proId}/api`, params)
      Message({ type: 'success', message: '增加接口成功' })
      return result
    } catch (e) {
      Message({ type: 'error', message: e || '增加接口失败' })
    }
  }
  async getVersion(id: string) {
    return await http.get(`/api/project/${this.proId}/api/${id}/version`)
  }
  async delete(id: string) {
    return await http.delete(`/api/project/${this.proId}/api/${id}`)
  }
  async deleteModule(moduleName: string) {
    return await http.delete(`/api/project/${this.proId}/api/?module=${moduleName}`)
  }
}