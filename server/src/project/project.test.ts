import test from 'ava'
import { Observable } from 'rxjs/Rx'
import { projectCtrl, role } from './project.ctrl'

let id: string = ''

let body = {
  apiChangedInform: true,
  name: Math.random().toString(36).substring(2, 10),
  description: "这是一个测试项目",
  testAddress: "192.168.0.4",
  openTest: true,
  testFailedInform: true,
  members: [
    {
      id: Math.random().toString(36).substring(2, 8),
      name: "小米",
      role: role.m
    }
  ]
}

test.serial('project.post', (t: any) => {
  return projectCtrl.post(body).do((res: any) => {
    t.truthy(id = res.id)
  })
})

test.serial('project.put', (t: any) => {
  return projectCtrl.put({
    id,
    name: 'hello'
  })
    .do((res: any) => {
      t.truthy(res)
    })
})

test.serial('project.getById', (t: any) => {
  return projectCtrl.getById('59b650c555ed850b7841af91'||id).do((res: any) => {
    console.log(JSON.stringify(res, null, 2))
    t.truthy(res)
  })
})

test('project.put.error', (t:any) => {
  t.plan(1)
  return projectCtrl.put({
    id: 'ss',
    name: '111'
  }).catch((res:any) => {
    t.truthy(res)
    return Observable.of()
  }).switchMap(() => t.pass())
})

test('project.post.error', (t:any) => {
  t.plan(1)
  return projectCtrl.post({}).catch((res:any) => {
    t.truthy(res)
    return Observable.of()
  }).switchMap(() => t.pass())
})

// test.serial('project.get', (t: any) => {
//   return projectCtrl.get().do((res:any) => {
//     t.truthy(res.list)
//   })
// })

test.serial('project.delete', (t: any) => {
  return projectCtrl.del(id).do((res: any) => t.deepEqual(res.num, 1))
})