import * as _ from 'lodash'

export default class CacheFactory {
  private static cacheStore: any = {}
  /**
   * 从缓存池获取缓存
   * @param name 缓存名称
   */
  static of(name: string) {
    return this.cacheStore[name] = this.cacheStore[name] || new Cache()
  }
}

class Cache {
  private memCache: any = {}

  private getSize(...arg: any[]): number {
    let total = 0
    Array.prototype.forEach.call(arg, (it: any) => {
      total += _.isArray(arg[0]) ? it.length : it.keys().length
    })
    return total
  }

  remove(key?: string): void {
    if (key) delete this.memCache[key]
    else this.memCache = {}
  }

  set(key: string, value: any = '') {
    this.memCache[key] = value
  }

  append(key: string, ...arg: any[]) {
    let cache = this.memCache[key] = this.memCache[key] || []
    if (_.isArray(cache)) {
      Array.prototype.forEach.call(arg, (it: any) => cache.push(it))
    } else {
      cache = Object.assign(arg)
    }
  }

  get(key: string, dft: any): any {
    return key ? this.memCache[key] : dft || ''
  }
}