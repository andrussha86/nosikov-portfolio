"""Заменяет картинки сайта файлами из папки photos/.

Файл photos/<имя>.png|jpg|jpeg|webp заменяет img/<имя>.webp: картинка
уменьшается до 2400 px по длинной стороне, сохраняется в webp, а width/height
в HTML обновляются под новые пропорции. Уже обработанные файлы пропускаются.

Запуск: двойной клик по photos/обновить-картинки.cmd
        или python tools/photos.py      (нужен Pillow: pip install pillow)
        python tools/photos.py --index  (пересобрать список в photos/README.md)
"""
import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "photos"
IMG = ROOT / "img"
PAGES = {"index.html": "Главная", "parq.html": "Кейс PARQ", "meteoritm.html": "Кейс МетеоРитм"}
SOURCE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
MAX_SIDE = 2400


def img_tags(html):
    return re.finditer(r'<img\b[^>]*\bsrc="img/([^"]+)\.webp"[^>]*>', html)


def convert(src, dst):
    im = ImageOps.exif_transpose(Image.open(src))
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    im.save(dst, "WEBP", quality=88, method=6)
    return im.size


def update_html(name, w, h):
    for page in PAGES:
        path = ROOT / page
        html = path.read_text(encoding="utf-8")

        def fix(m):
            tag = re.sub(r'\bwidth="\d+"', f'width="{w}"', m.group(0))
            return re.sub(r'\bheight="\d+"', f'height="{h}"', tag)

        new = re.sub(rf'<img\b[^>]*\bsrc="img/{re.escape(name)}\.webp"[^>]*>', fix, html)
        if new != html:
            path.write_text(new, encoding="utf-8", newline="\n")


def import_photos():
    # Хеши уже обработанных файлов: дата изменения ненадёжна — Проводник сохраняет её при копировании.
    state_file = PHOTOS / ".imported.json"
    state = json.loads(state_file.read_text(encoding="utf-8")) if state_file.exists() else {}
    known = {p.stem for p in IMG.glob("*.webp")}
    done = 0
    for src in sorted(PHOTOS.iterdir()):
        if src.suffix.lower() not in SOURCE_EXT:
            continue
        if src.stem not in known:
            print(f"  ? {src.name}: на сайте нет картинки img/{src.stem}.webp — проверьте имя (список в photos/README.md)")
            continue
        digest = hashlib.sha1(src.read_bytes()).hexdigest()
        if state.get(src.name) == digest:
            continue
        dst = IMG / f"{src.stem}.webp"
        w, h = convert(src, dst)
        update_html(src.stem, w, h)
        state[src.name] = digest
        print(f"  ✓ {src.name} → img/{dst.name} ({w}×{h})")
        done += 1
    state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Заменено картинок: {done}")


def build_index():
    """photos/README.md: какие картинки есть на сайте и где они показаны."""
    lines = [
        "# Фотографии и картинки сайта",
        "",
        "Положите сюда файл **с тем же именем**, что у картинки в таблице, — он её заменит.",
        "Подходят PNG, JPG и WebP; расширение может быть любым из них: `cover-meteo.png`",
        "заменит `cover-meteo`. Затем дважды щёлкните `обновить-картинки.cmd` в этой папке —",
        "он сожмёт картинку в WebP (до 2400 px по длинной стороне), положит её в `img/`",
        "и поправит размеры в HTML. После этого закоммитьте изменения в GitHub Desktop.",
        "",
        "Советы по размерам:",
        "",
        "- **Обложки** (`cover-*`) — 3 : 2, от 2400×1600. На главной обрезаются до 3 : 2 (у малых проектов — до 2 : 1).",
        "- **Экраны приложений** в лентах — в рамке телефона, как сейчас, одной высоты внутри ленты;",
        "  от 900 px по ширине, чтобы в увеличенном просмотре не было мыла.",
        "- **Схемы** (User Flow, JTBD, UI-kit) — от 2400 px по ширине: их рассматривают крупно.",
        "",
    ]
    seen = set()
    for page, title in PAGES.items():
        html = (ROOT / page).read_text(encoding="utf-8")
        rows = []
        for m in img_tags(html):
            name = m.group(1)
            if name in seen:
                continue
            seen.add(name)
            alt = re.search(r'\balt="([^"]*)"', m.group(0))
            what = (alt.group(1) if alt else "") or ("Обложка проекта в списке работ" if name.startswith("cover-") else "—")
            with Image.open(IMG / f"{name}.webp") as im:
                size = f"{im.width}×{im.height}"
            rows.append(f'| <img src="../img/{name}.webp" width="120"> | `{name}` | {size} | {what} |')
        if rows:
            lines += [f"## {title}", "", "| Сейчас | Имя файла | Размер | Что на картинке |", "|---|---|---|---|", *rows, ""]
    (PHOTOS / "README.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print("Обновлён photos/README.md")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    PHOTOS.mkdir(exist_ok=True)
    if "--index" in sys.argv:
        build_index()
    else:
        import_photos()
        build_index()
