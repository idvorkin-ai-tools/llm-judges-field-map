#!/usr/bin/env python3
"""Lint the metaphor variants on every page.

    tools/check_variants.py [site-dir]

Every element with class "mx" must have, as direct children, exactly one
[data-m] element per domain (hire, review, wine, med, ump). No [data-m]
may sit outside an .mx parent. Pages under parts/ must link paper.css and
site.js in <head>, carry no <style> block and no leftover {{ slots, and
load fig.js if they have a figure. Term boxes and widgets (docs/INTERACTIVE.md):
every data-term must have a shared glossary entry with term, plain, eli5 and
technical, appear once per page, and the page must load the hub's terms.js;
every data-lab must have widgets/<name>.js loaded after lab.js and widgets.js.
Exit 1 on any problem. Stdlib only.

The glossary lives in the hub repo (idvorkin-ai-tools.github.io, assets/glossary/).
It is read from $AITOOLS_HUB if set, else from
~/gits/idvorkin-ai-tools.github.io/.worktrees/shared-terms if that exists,
else fetched from the live site.
"""

import glob
import json
import os
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser

KEYS = {"hire", "review", "wine", "med", "ump"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errs = [], []

    def handle_starttag(self, tag, attrs, selfclosing=False):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        line = self.getpos()[0]
        parent = self.stack[-1] if self.stack else None
        if "data-m" in a:
            m = a["data-m"]
            if m not in KEYS:
                self.errs.append(f"line {line}: unknown data-m={m!r}")
            if not parent or not parent["mx"]:
                self.errs.append(f"line {line}: <{tag} data-m={m}> is not a direct child of an .mx wrapper")
            else:
                if m in parent["seen"]:
                    self.errs.append(f"line {line}: duplicate data-m={m} in .mx opened at line {parent['line']}")
                parent["seen"].add(m)
        node = {"tag": tag, "mx": "mx" in cls, "seen": set(), "line": line}
        if tag in VOID or selfclosing:
            return
        self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs, selfclosing=True)

    def handle_endtag(self, tag):
        # pop to the matching tag (tolerate sloppy nesting like implicit </p>)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                for n in self.stack[i:]:
                    if n["mx"] and n["seen"] != KEYS:
                        missing = sorted(KEYS - n["seen"])
                        self.errs.append(f"line {n['line']}: .mx <{n['tag']}> missing {missing}")
                del self.stack[i:]
                return


GLOSS_KEYS = ("term", "plain", "eli5", "technical")
LIVE = "https://idvorkin-ai-tools.github.io/assets/glossary/"
TERMS_JS = "https://idvorkin-ai-tools.github.io/assets/terms.js"


def hub_glossary():
    """A local hub glossary dir, or None to fetch from the live site."""
    for d in (os.environ.get("AITOOLS_HUB"), os.path.expanduser("~/gits/idvorkin-ai-tools.github.io/.worktrees/shared-terms")):
        if d and os.path.isdir(os.path.join(d, "assets", "glossary")):
            return os.path.join(d, "assets", "glossary")
    return None


GLOSSARY = hub_glossary()
_entries = {}


def entry(t):
    """(dict or None, error or None) for glossary id t."""
    if t not in _entries:
        where = os.path.join(GLOSSARY, t + ".json") if GLOSSARY else LIVE + t + ".json"
        try:
            if GLOSSARY:
                raw = open(where, encoding="utf-8").read()
            else:
                with urllib.request.urlopen(where, timeout=15) as r:
                    raw = r.read().decode("utf-8")
            _entries[t] = (json.loads(raw), None)
        except (OSError, urllib.error.URLError):
            _entries[t] = (None, f"data-term={t!r} has no glossary entry ({where})")
        except ValueError as e:
            _entries[t] = (None, f"{where} is not valid JSON: {e}")
    return _entries[t]


def check_interactive(root, rel, s):
    errs = []
    terms = re.findall(r'data-term="([^"]+)"', s)
    for t in sorted(set(terms)):
        if terms.count(t) > 1:
            errs.append(f"data-term={t!r} used {terms.count(t)} times; box only the first use")
        d, err = entry(t)
        if err:
            errs.append(err)
            continue
        for k in GLOSS_KEYS:
            if not str(d.get(k, "")).strip():
                errs.append(f"glossary entry {t!r} missing {k!r}")
    if terms and TERMS_JS not in s:
        errs.append(f"has data-term but does not load {TERMS_JS}")
    labs = re.findall(r'data-lab="([^"]+)"', s)
    if labs:
        for need in ("lab.js", "widgets.js"):
            if not re.search(r'src="[^"]*(?<![\w/])' + re.escape(need) + '"', s) and f'/{need}"' not in s:
                errs.append(f"has a widget but does not load {need}")
    for name in sorted(set(labs)):
        if not os.path.exists(os.path.join(root, "widgets", name + ".js")):
            errs.append(f"data-lab={name!r} has no widgets/{name}.js")
        if f"widgets/{name}.js" not in s:
            errs.append(f"data-lab={name!r} but the page does not load widgets/{name}.js")
    return errs


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("glossary:", GLOSSARY or LIVE)
    bad = 0
    for f in sorted(glob.glob(os.path.join(root, "**", "*.html"), recursive=True)):
        if "/tools/" in f or "/.git/" in f:
            continue
        s = open(f, encoding="utf-8").read()
        p = P()
        p.feed(s)
        errs = list(p.errs)
        rel = os.path.relpath(f, root)
        head = s.split("</head>")[0]
        if "paper.css" not in head:
            errs.append("paper.css not linked in <head>")
        if "site.js" not in head:
            errs.append("site.js not loaded in <head>")
        if rel.startswith("parts/") and "<style" in s:
            errs.append("<style> block in a part page")
        if "{{" in s:
            errs.append("leftover {{ slot")
        if "figure class=\"fig" in s and "fig.js" not in s:
            errs.append("has figures but does not load fig.js")
        errs += check_interactive(root, rel, s)
        n = s.count('class="mx')
        print(f"{'FAIL' if errs else 'ok  '} {rel}: {n} .mx slots")
        for e in errs:
            print("     ", e)
        bad += bool(errs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
