import Router from '../util/Router'
import Ctrl from './ProjectCtrl'

let projectRouter = new Router()
let projectCtrl = new Ctrl()

export default projectRouter.router
  .get('/project', (ctx: any) => projectRouter.handle(ctx, projectCtrl.get(ctx.user._id, ctx.user.isAdmin)))
  .get('/project/:id', (ctx: any) => projectRouter.handle(ctx, projectCtrl.getById(ctx.params.id, ctx.user._id, ctx.user.isAdmin)))
  .post('/project', (ctx: any) => projectRouter.handle(ctx, projectCtrl.post(ctx.request.fields, ctx.user.name)))
  .post('/project/:id', (ctx: any) => projectRouter.handle(ctx, projectCtrl.copy(ctx.params.id, ctx.request.fields.name, ctx.user.name)))
  .put('/project/:id', (ctx: any) => projectRouter.handle(ctx, projectCtrl.put(ctx.params.id, ctx.request.fields, ctx.user._id, ctx.user.isAdmin, ctx.user.name)))
  .del('/project/:id', (ctx: any) => projectRouter.handle(ctx, projectCtrl.delete(ctx.params.id, ctx.user._id, ctx.user.isAdmin, ctx.user.name)))
  .get('/project/:id/doc', (ctx: any) => projectRouter.handle(ctx, projectCtrl.export(ctx.params.id, ctx.user._id, ctx.user.isAdmin)))
  .get('/report/:file', (ctx: any) => projectRouter.handleStatic(ctx, projectCtrl.report(ctx.params.file)))
  .get('/role', (ctx: any) => projectRouter.handle(ctx, projectCtrl.getRole()))
  .routes()