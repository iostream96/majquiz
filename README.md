# maj quiz

小林刚《一眼何切》互动 quiz。当前是零依赖静态站点，后续 Docker 部署时直接用 nginx serve `public/`。

## Files

- `data/qa.json`: 网页可直接消费的 24 组何切题和 24 组麻雀豆知识，解释为短摘要。
- `data/schedule.json`: 每日题组配置，按北京时间 `Asia/Shanghai` 生效。
- `data/source_manifest.json`: 原始 Bilibili opus/article 来源和 24 张手牌图 URL。
- `public/`: 静态站点目录，包含页面、脚本、样式、本地图片和 `public/data/quiz.json`。
- `docs/qa-preview.md`: 人看的 Q&A 预览。
- `scripts/render_preview.py`: 从 `data/qa.json` 重新生成 Markdown 预览。
- `scripts/download_images.sh`: 从 `data/qa.json` 下载手牌图片到 `public/assets/hands/`。
- `scripts/build_public_data.mjs`: 将 `data/qa.json` 转成使用本地图片路径的 `public/data/quiz.json`。

## Local Run

```bash
python3 -m http.server 5173 --directory public
```

Then open http://localhost:5173

## Refresh Preview

```bash
python3 scripts/render_preview.py
```

## Refresh Public Assets

```bash
scripts/download_images.sh
node scripts/build_public_data.mjs
```

## Daily Schedule

每日 4 题由 `data/schedule.json` 控制。页面默认按北京时间选择当天题组，也可以在内部审阅时用查询参数指定：

```text
/?day=2
/?date=2026-06-30
```

## Docker

```bash
docker build -t maj-quiz .
docker run --rm -p 8080:80 maj-quiz
```

## Source Notes

问题篇：https://www.bilibili.com/opus/454185425690831265

答案篇：https://www.bilibili.com/opus/454439601848010206

第 4 条豆知识里，答案篇写作“B.搭子”，但问题篇选项中“搭子”为 A；当前数据按术语内容归一为“搭子”，并在 `data/qa.json` 里保留了备注。
