#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(root, 'data/qa.json')
const schedulePath = resolve(root, 'data/schedule.json')
const outputPath = resolve(root, 'public/data/quiz.json')
const scheduleOutputPath = resolve(root, 'public/data/schedule.json')

const quiz = JSON.parse(await readFile(sourcePath, 'utf8'))
const schedule = JSON.parse(await readFile(schedulePath, 'utf8'))

const publicQuiz = {
  ...quiz,
  description: '小林刚《一眼何切》互动 quiz 数据。本文件使用本地手牌图片，原始来源见 /data/source_manifest.json。',
  items: quiz.items.map((item) => {
    const index = String(item.id).padStart(2, '0')
    return {
      ...item,
      hand: {
        ...item.hand,
        sourceImageUrl: item.hand.imageUrl,
        imageUrl: `assets/hands/q${index}.png`,
      },
    }
  }),
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(publicQuiz, null, 2)}\n`, 'utf8')
await writeFile(scheduleOutputPath, `${JSON.stringify(schedule, null, 2)}\n`, 'utf8')

console.log(`Wrote ${outputPath}`)
console.log(`Wrote ${scheduleOutputPath}`)
