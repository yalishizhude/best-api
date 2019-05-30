let storage: any = localStorage || {}

export default {
  get(key: string, defaultValue?: any) {
    let value: any = storage[key]
    if (void 0 === storage[key] && defaultValue) {
      this.set(key, defaultValue)
      return defaultValue
    } else {
      try {
        return JSON.parse(storage[key])
      } catch (e) {
        return storage[key]
      } 
    }
  },
  set(key: string, value: any) {
    if (typeof value === 'object') {
      storage[key] = JSON.stringify(value) 
    } else {
      storage[key] = value
    }
  },
  remove(key: string) {
    delete localStorage[key]
  },
  clear() {
    storage.clear ? storage.clear() : storage = {}
  }
}
