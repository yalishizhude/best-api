/**
 * 无页面测试服务端API
 */
import BaseCtrl from '../util/BaseCtrl'
import axios from 'axios'
import * as http from 'http'
import * as https from 'https'

export default class AgentCtrl extends BaseCtrl {
  forward(url: string, method: string = 'GET', data: any, headers: any, header: any = {}) {
    let request: any = {
      data,
      method,
      headers
    }
    // 判断是否需要登录
    let login = this.of({})
    if (header.loginurl) {
      login = this.from(axios({
        data: JSON.parse(header.logindata),
        method: header.loginmethod,
        url: header.loginurl,
        respToken: header.resulttokenfield,
        reqToken: header.sendtokenfield
      })).
        do((info: any) => {
          if (info.config.respToken) {
            request.headers[info.config.reqToken] = info.data[info.config.respToken]
          } else {
            request.headers['Cookie'] = info.headers['set-cookie'].join('')
          }
        })
    }
    if (/^http/.test(url)) {
      request.url = url
    } else {
      request.url = 'http://' + url
    }
    return login
      .switchMap(() => this.from(axios(request)))
      .map((result: any) => {
        return {
          data: result.data,
          status: result.status,
          statusText: result.statusText,
          headers: result.headers
        }
      })
  }
}