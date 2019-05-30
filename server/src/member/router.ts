import Router from '../util/Router'
import Ctrl from './MemberCtrl'

let memberRouter = new Router()
let memberCtrl = new Ctrl()

export default memberRouter.router
  .get('/member', (ctx: any) => memberRouter.handle(ctx, memberCtrl.get()))
  .get('/user', (ctx: any) => memberRouter.handle(ctx, memberCtrl.getInfo(ctx.user._id)))
  .put('/user', (ctx: any) => memberRouter.handle(ctx, memberCtrl.put(ctx.user._id, ctx.request.fields)))
  .post('/member', (ctx: any) => memberRouter.handle(ctx, memberCtrl.post(ctx.request.fields)))
  .put('/member/:id', (ctx: any) => memberRouter.handle(ctx, memberCtrl.put(ctx.params.id, ctx.request.fields)))
  .put('/member/:id/reset', (ctx: any) => memberRouter.handle(ctx, memberCtrl.resetPassword(ctx.request.fields, ctx.user, ctx.params.id)))
  .del('/member/:id', (ctx: any) => memberRouter.handle(ctx, memberCtrl.delete(ctx.params.id)))
  .routes()