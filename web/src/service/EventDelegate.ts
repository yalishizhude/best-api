interface eventCallback {
  eventName: string
  componentId: string
  callback(event?: any): void
}

let bindList: eventCallback[] = []
let eventList: string[] = ['mousemove', 'mouseup']
eventList.forEach((e: string) => {
  if (document.addEventListener) {
    document.addEventListener(e, (event: any) => {
      bindList.forEach((b: eventCallback) => {
        if (e === b.eventName) b.callback(event)
      })
    })
  } else {
    console.error('浏览器版本过低，请升级浏览器')
  }
})
export default class EventDelegate {
  static bind(eventName: string, callback: any, componentId: string) {
    bindList.push({
      eventName,
      componentId,
      callback
    })
  }
  static unbind(eName: string, cId: string) {
    for(let i=bindList.length-1; i>=0; i--){
      let {eventName, componentId} = bindList[i]
      if(cId === componentId && eName === eventName) {
        bindList.splice(i, 1)
        break
      }
    }
  }
}