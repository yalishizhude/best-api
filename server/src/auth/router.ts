import Router from '../util/Router'
import Ctrl from './AuthCtrl'

let authRouter = new Router()
let authCtrl = new Ctrl()

export default authRouter.router
  .post('/user/login', (ctx: any) => authRouter.handle(ctx, authCtrl.login(ctx.request.fields.account, ctx.request.fields.password)))
  .get('/user/logout', (ctx: any) => authRouter.handle(ctx, authCtrl.logout(ctx.user?ctx.user._id:'')))
  .routes()