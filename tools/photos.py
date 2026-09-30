"""Заменяет картинки сайта файлами из папки photos/.

Файл photos/<имя>.png|jpg|jpeg|webp заменяет img/<имя>.webp: картинка
уменьшается до 2400 px по длинной стороне, сохраняется в webp, а width/height
в HTML обновляются под новые пропорции. Уже обработанные файлы пропускаются.
Схемы (JTBD, Desired Outcome, User Flow, UI-kit) получают сплошной светлый фон
вместо прозрачного и до 3600 px по длинной стороне; их можно класть и в PDF.

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
SOURCE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_SIDE = 2400
# Схемы рассматривают крупно, а прозрачный фон на тёмной странице превращается в чёрный
SHEET = re.compile(r"-(jtbd|do-|flow|kit)")
SHEET_MAX_SIDE = 3600
SHEET_BG = (243, 246, 253)   # тот же светлый, что у рамок схем в Figma


def img_tags(html):
    return re.finditer(r'<img\b[^>]*\bsrc="img/([^"]+)\.webp"[^>]*>', html)


def open_source(src, max_side):
    if src.suffix.lower() != ".pdf":
        return ImageOps.exif_transpose(Image.open(src))
    import pymupdf   # pip install pymupdf
    page = pymupdf.open(src)[0]
    zoom = max_side / max(page.rect.width, page.rect.height)
    # фон кладём под схему до рендера: с альфа-каналом полупрозрачные узлы сереют
    page.draw_rect(page.rect, color=None, fill=[c / 255 for c in SHEET_BG], overlay=False)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def flatten(im):
    """Прозрачное — цветом рамки схемы (пиксель у верхнего края), иначе SHEET_BG."""
    if im.mode != "RGBA":
        return im
    edge = im.getpixel((im.width // 2, min(6, im.height - 1)))
    bg = Image.new("RGBA", im.size, edge[:3] + (255,) if edge[3] == 255 else SHEET_BG + (255,))
    return Image.alpha_composite(bg, im).convert("RGB")


def convert(src, dst):
    sheet = bool(SHEET.search(dst.stem))
    side = SHEET_MAX_SIDE if sheet else MAX_SIDE
    im = open_source(src, side)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    im.thumbnail((side, side), Image.LANCZOS)
    if sheet:
        im = flatten(im)
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
    known |= {m.group(1) for page in PAGES for m in img_tags((ROOT / page).read_text(encoding="utf-8"))}
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
        "- **Схемы** (User Flow, JTBD, Desired Outcome, UI-kit) — от 2400 px по ширине, можно PDF:",
        "  их рассматривают крупно. Прозрачный фон сам заменится светлым, до 3600 px по длинной стороне.",
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
