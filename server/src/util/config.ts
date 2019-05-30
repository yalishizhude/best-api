import { env } from 'process'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

export const dbAddr = env.DB_HOST || 'localhost'
export const dbPort = env.DB_PORT || 27017
export const dbName = env.DB_DATABASE || 'api'
export const adminPassword = env.DEFAULT_ADMIN_PASSWORD || new Date().toISOString().substring(0, 10).replace(/-/g, '')
export const uploadPath = 'upload'
export const staticPath = 'static'
export const avatar = `<svg xmlns="http://www.w3.org/2000/svg" height="100px" width="100px">
  <style>
    .background {
      fill: COLOR
    }
    .text {
      dominant-baseline:middle;
      text-anchor:middle;
      font-size: 100px;
      fill:#000;
      font-family:Segoe UI;
      font-weight:100;
    }
  </style>
  <g>
  <rect class="background" x="0" y="0" height="100px" width="100px"></rect>
  <text class="text" x="50" y="50">TEXT</text>
  </g>
</svg>`

export let key = ''

try {
  if (!fs.existsSync('key')) {
    key = Math.random().toString(32).substring(2, 10)
    fs.writeFileSync('key', key)
  } else {
    key = fs.readFileSync('key').toString()
  }
} catch (e) {
  console.error('初始化系统文件失败', e)
}

[uploadPath, staticPath].forEach((path: string) => {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }
  } catch (e) {
    console.error('创建目录%s失败，可能导致系统无法正常使用', path, e)
  }
})