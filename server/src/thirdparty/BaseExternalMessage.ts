import * as axios from 'axios'
import {Observable} from 'rxjs/Rx'

export default abstract class BaseExternalMessage {
  protected baseUrl = ''
  protected request = axios
  protected obs = Observable
  protected from = Observable.from
  protected token = ''
  constructor(token: string) {
    this.token = token
  }
  abstract send(content: string, toUser?: String[]):void
}

