#!/usr/bin/env python3
"""Lint the metaphor variants on every page.

    tools/check_variants.py [site-dir]

Every element with class "mx" must have, as direct children, exactly one
[data-m] element per domain (hire, review, wine, med, ump). No [data-m]
may sit outside an .mx parent. Pages under parts/ must link paper.css and
site.js in <head>, carry no <style> block and no leftover {{ slots, and
load fig.js if they have a figure. Exit 1 on any problem. Stdlib only.
"""

import glob
import os
import sys
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


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
        n = s.count('class="mx')
        print(f"{'FAIL' if errs else 'ok  '} {rel}: {n} .mx slots")
        for e in errs:
            print("     ", e)
        bad += bool(errs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
