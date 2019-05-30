import BaseExternalMessage from './BaseExternalMessage'

export default class Tower extends BaseExternalMessage {
  protected baseUrl = 'https://api.tower.im/v1'
  private headers = {}
  protected getMessage(id: string) {
    this.from(this.request({
      baseUrl: this.baseUrl,
      url: `/todolists/${id}`
    }))
  }
  send(content: string, user?:string[]) {
    this.from(this.request({
      baseUrl: this.baseUrl,
      url: ''
    }))
    .subscribe(() => {}, (e:any) => {
      console.error('生成tower任务失败：', e)
    })
  }
}