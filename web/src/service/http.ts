import axios from 'axios'
import { Message } from 'element-ui'
import Cache from './cache'
import router from './router'

let request = (method: string, url: string, data: any, config: any = {}) => new Promise(async (resolve, reject) => {
  axios.defaults.headers.common['Authorization'] = Cache.get('token') || ''
  Object.assign(config, { method, url, data })
  try {
    let response = await axios(config)
    if(response.data.errCode) {
      reject(response.data.errMsg)
    } else {
      resolve(response.data) 
    }
  } catch (e) {
    console.error(e)
    reject(e.response.data)
    const { data, status, statusText } = e.response
    if (status === 401) {
      Cache.clear()
      pleaseLogin()
    } else if (status === 403) {
      Message({message: data, type: 'error'})
    } else {
      Message({message: status + ',' + statusText, type: 'error'})
    }
  }
})

let pleaseLogin = () => {}

export default {
  initLogin(showLogin:any) {
    pleaseLogin = showLogin
  },
  get: (url: string, config?: object) => request('GET', url, null, config),
  put: (url: string, data?: object, config?: object) => request('PUT', url, data, config),
  post: (url: string, data?: object, config?: object) => request('POST', url, data, config),
  delete: (url: string, data?: object, config?: object) => request('DELETE', url, data, config)
}
