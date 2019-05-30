import * as crypto from 'crypto'
import { key } from './config'


const encrypt = (text: string='') => {
  let cipher = crypto.createCipher('aes192', key)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex');
  return encrypted
}

const decrypt = (text: string='') => {
  let decipher = crypto.createDecipher('aes192', key)
  let decrypted = decipher.update(text, 'hex', 'utf8')
  decrypted += decipher.final('hex')
  return decrypted
}

const hash = (text: string) => crypto.createHash('md5').update(text).digest('base64')

export {
  encrypt,
  decrypt,
  hash
}
