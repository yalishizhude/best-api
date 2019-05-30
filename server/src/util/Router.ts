import * as koaRouter from 'koa-router'
import { Observable } from 'rxjs/Rx'

export default class Router {
  router = new koaRouter({
    prefix: '/api'
  })
  constructor() {
    this.router
      .param('pid', (id: string, ctx: any, next: any) => {
        if (!/\w{24}/.test(id)) {
          return ctx.throw(404, '项目id格式不正确')
        } else {
          return next()
        }
      })
      .param('id', (id: string, ctx: any, next: any) => {
        if (!/\w{24}/.test(id)) {
          return ctx.throw(404, 'id格式不正确')
        } else {
          return next()
        }
      })
  }

  public handleProxy(ctx: any, ob: Observable<any>): Promise<void> {
    return ob.catch((e: any) => {
      ctx.body = {
        data:e.response.data,
        headers: e.response.headers,
        status: e.response.status,
        statusText: e.response.statusText
      }
      return Observable.of()
    })
      .do((res: any) => ctx.body = res)
      .toPromise()
  }

  public handle(ctx: any, ob: Observable<any>): Promise<void> {
    return ob.catch((e: any) => {
      console.error('请求出错', e)
      if (e.status) {
        ctx.throw(e.status, e.message || '操作失败')
      } else {
        ctx.body = {
          errCode: e.errCode || 110,
          errMsg: e.response.data || e.errMsg || e.errors || '操作失败'
        }
      }
      return Observable.of()
    })
      .do((res: any) => {
        ctx.body = Object.assign({ errCode: 0 }, res)
      })
      .toPromise()
  }

  public handleStatic(ctx: any, ob: Observable<any>): Promise<void> {
    return ob.catch((e: any) => {
      console.error(e)
      ctx.throw(404, '未找到资源')
      return Observable.of()
    })
      .do((res: any) => {
        if (/(\.png|\.jpg|\.jpeg)$/.test(ctx.path)) {
          ctx.type = 'image/' + ctx.path.replace(/.*\.(.*)$/, '$1')
        } else if (/.svg/.test(ctx.path)) {
          ctx.type = 'image/svg+xml'
        } else {
          ctx.type = 'text/' + ctx.path.replace(/.*\.(html|css)$/, '$1')
        }
        ctx.body = res
      })
      .toPromise()
  }

}