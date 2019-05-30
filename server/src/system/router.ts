import Router from '../util/Router'
import Ctrl from './SystemCtrl'
import { staticPath } from '../util/config'

let systemRouter = new Router()
let systemCtrl = new Ctrl()

export default systemRouter.router
  .get(`/${staticPath}/:file`, (ctx: any) => systemRouter.handleStatic(ctx, systemCtrl.readFile(ctx.params.file)))
  .get('/setting', (ctx:any) => systemRouter.handle(ctx, systemCtrl.get()))
  .put('/setting', (ctx:any) => systemRouter.handle(ctx, systemCtrl.put(ctx.request.fields, ctx.user.isAdmin))) 
  .post('/upload/img', (ctx: any) => systemRouter.handle(ctx, systemCtrl.upload(ctx.request.files, ctx.user.isAdmin)))
  .routes()