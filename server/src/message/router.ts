import Router from '../util/Router'
import Ctrl from './MessageCtrl'

let router = new Router()
let ctrl= new Ctrl()

export default router.router
  .get('/message', (ctx: any) => router.handle(ctx, ctrl.get(ctx.user._id, parseInt(ctx.request.query.page)||1, parseInt(ctx.request.query.size)||10, ctx.request.query.unread)))
  .put('/message/:id', (ctx: any) => router.handle(ctx, ctrl.put(ctx.user._id, [ctx.params.id])))
  .put('/message', (ctx: any) => router.handle(ctx, ctrl.putAll(ctx.user._id)))
.routes()