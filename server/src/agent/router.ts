import Router from '../util/Router'
import Ctrl from './AgentCtrl'

let agentRouter = new Router()
let agentCtrl = new Ctrl()

export default agentRouter.router
  .post('/debug', (ctx: any) => agentRouter.handle(ctx, agentCtrl.forward(ctx.request.fields.url, ctx.request.fields.method, ctx.request.fields.payload, ctx.request.fields.header, ctx.header)))
.routes()