#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "qa.json"
OUT_FILE = ROOT / "docs" / "qa-preview.md"


def main() -> None:
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = [
        "# 小林刚一眼何切 Q&A 预览",
        "",
        "来源：Bilibili 问题篇与答案篇。这里使用网页展示用短摘要，完整来源信息见 `data/source_manifest.json`。",
        "",
    ]

    for item in payload["items"]:
        hand = item["hand"]
        trivia = item["trivia"]
        choices = " / ".join(trivia["choices"])
        note = f"\n\n> 备注：{trivia['note']}" if "note" in trivia else ""

        lines.extend(
            [
                f"## Q{item['id']}",
                "",
                f'<img src="{hand["imageUrl"]}" width="520" alt="Q{item["id"]} 手牌">',
                "",
                f"**何切问题**：{hand['prompt']}",
                "",
                f"**何切答案**：{hand['answer']}",
                "",
                hand["summary"],
                "",
                f"**豆知识问题**：{trivia['prompt']}",
                "",
                f"**选项**：{choices}",
                "",
                f"**豆知识答案**：{trivia['answer']}",
                "",
                trivia["summary"] + note,
                "",
            ]
        )

    OUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT_FILE.relative_to(ROOT)} with {len(payload['items'])} items.")


if __name__ == "__main__":
    main()
