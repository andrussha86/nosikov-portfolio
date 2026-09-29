"""Неразрывные пробелы: после предлогов, союзов и коротких слов, перед тире.
Работает только с текстом между тегами; script/style не трогает. Идемпотентен."""
import re, sys

NB = " "
SHORT = (
    "в во и й с со к ко о об обо у а я на по до от за из не ни но для без при про "
    "над под что как же ли или то из-за через перед между мы он она их её его "
    "это все всё ещё уже так раз ты вы"
).split()
# короткое слово + пробел(ы) -> короткое слово + nbsp
short_re = re.compile(r"(?<![\w-])(" + "|".join(sorted(map(re.escape, SHORT), key=len, reverse=True)) + r")[ \t\n]+(?=\S)", re.I)
dash_re = re.compile(r"[ \t\n]+([—–])")          # пробел перед тире -> nbsp
num_re = re.compile(r"(\d)[ \t]+(?=[А-Яа-яA-Za-z%₽])")  # «50 стартапов», «8 шагов»
digit_group = re.compile(r"(№)[ \t]+")

def fix(text):
    text = short_re.sub(lambda m: m.group(1) + NB, text)
    text = short_re.sub(lambda m: m.group(1) + NB, text)  # второй проход: «и в»
    text = dash_re.sub(NB + r"\1", text)
    text = num_re.sub(r"\1" + NB, text)
    text = digit_group.sub(r"\1" + NB, text)
    return text

def process(html):
    out, skip = [], None
    for part in re.split(r"(<[^>]+>)", html):
        if part.startswith("<"):
            tag = re.match(r"</?\s*(\w+)", part)
            name = tag.group(1).lower() if tag else ""
            if name in ("script", "style", "title"):
                skip = None if part.startswith("</") else name
            out.append(part)
        elif skip or not part.strip():
            out.append(part)
        else:
            out.append(fix(part))
    return "".join(out)

for path in sys.argv[1:]:
    src = open(path, encoding="utf8").read()
    res = process(src)
    open(path, "w", encoding="utf8").write(res)
    print(path, src.count(" ") - res.count(" "), "пробелов заменено")
