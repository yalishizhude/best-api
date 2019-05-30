import BaseExternalMessage from './BaseExternalMessage'

export default class Dingding extends BaseExternalMessage{
  protected baseUrl = 'https://oapi.dingtalk.com'
  send(text: string, user?: string[]) {
    const url = `/robot/send?access_token=${this.token}`
    this.from(this.request({
      url: this.baseUrl + url,
      method: 'POST',
      data: {
        msgtype: 'markdown',
        markdown: {
          title: 'API变更',
          text
        }
      }
    }))
    .debounceTime(2000)
    .subscribe(() => {}, (e:any) => {
      console.error('发送钉钉消息失败：', e)
    })
  }
}
