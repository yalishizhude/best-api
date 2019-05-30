import _ from 'lodash'
import http from '../../service/http'

export default class Project {
  id: string = ''
  constructor(id: string) {
    this.id = id
  }
  async get(id?: string, params?: any) {
    let url = id ? `/api/project/${this.id}` : '/api/project'
    return await http.get(url, {
      params
    })
  }
  async getModule(id?: string) {
    return await http.get(`/api/project/${id||this.id}/api/module`)
  }
}