# Interactive pieces: term boxes and widgets

Two kinds of interactive pieces sit on top of the static pages. Both are plain JS with no build step and no libraries. `tools/check_variants.py` lints both.

## Term boxes

A term box gives the plain meaning of a technical word beside its **first use on a page**. Readers pick how it explains with two switches in the top bar (`site.js`):

- **Plain** (default, both switches off): one everyday sentence.
- **Technical**: the precise definition, plus a formula when there is one.
- **ELI5**: one short, concrete sentence a child would get.

The switches appear only on pages with at least one term box, and flipping one shows a short confirmation and flashes the boxes in view. Technical and ELI5 can both be on; then both show. The choice is stored in `localStorage` (`llm-judges-tech`, `llm-judges-eli5`), is set on `<html>` as `data-tech="on"` / `data-eli5="on"`, and applies live on every open page.

### Use a term on a page

1. Wrap the first use of the term on the page, once:

   ```html
   <span class="term" data-term="kappa">Cohen's kappa</span>
   ```

2. Load the script once, next to the other deferred scripts at the bottom of the page:

   ```html
   <script src="../glossary.js" defer></script>
   ```

On wide screens the box sits in the right margin beside its line. On narrow screens the term gets a small `?` chip that opens the box inline. Box only words a smart non-specialist would not know; never box the same term twice on one page (the lint fails).

### Add a term

One file per term: `glossary/<id>.json`, where `<id>` is lowercase-with-hyphens. Check `ls glossary/` first and **reuse an existing id**; pages must agree on a term's meaning, so only add a file when the term is new. Don't rewrite another term's file to suit one page; if an entry is wrong, fix it for every page.

```json
{
 "term": "Cohen's kappa",
 "plain": "Agreement with the lucky matches taken out: 0 means no better than chance, 1 means they always agree.",
 "eli5": "A score for how much two friends really agree, not counting the times they matched by luck.",
 "technical": "Chance-corrected agreement for two raters (Cohen 1960) ...",
 "formula": "κ = (p<sub>o</sub> − p<sub>e</sub>) / (1 − p<sub>e</sub>)",
 "m": { "hire": "...", "review": "...", "wine": "...", "med": "...", "ump": "..." }
}
```

- `term`, `plain`, `eli5`, `technical` are required (the lint checks). Values are HTML.
- `formula` is optional and shows only in Technical mode.
- `m` is optional: a one-line example per metaphor, shown under the plain sentence and switched by the metaphor menu. Give all five or leave it out.
- One sentence per register. Plain words; no "leverages", "robust", "nuanced".

### Register-specific page text (optional, use sparingly)

`class="tech-only"` hides an element unless Technical is on; `class="no-tech"` hides it when Technical is on. Use it only where it is cheap, such as an extra formula line. Don't write three versions of a page.

## Widgets

A widget is a small chart with sliders, next to the text it illustrates. Three files per widget, all named after it:

| File | What it holds |
| --- | --- |
| `lab/<name>.js` | Pure maths, no DOM. Skip it if `lab.js` already has the functions. |
| `tools/tests/<name>.test.js` | `node:test` checks that the maths reproduces the numbers the page prints. |
| `widgets/<name>.js` | The drawing: calls `LLMJWidgets.register('<name>', fn)`. |

`lab.js` is the shared core (agreement and kappa, confusion matrix, base rate, ROC/AUC, normal CDF). `widgets.js` holds the shared helpers. Don't edit either for a single page's needs; put new maths in `lab/<name>.js`. If a shared helper is missing, add it in a separate small commit and say so in the PR.

### Page markup

```html
<p class="lab-try"><b>Try this</b>One line saying what to move and what to watch.</p>
<div class="lab" data-lab="kappa"></div>
```

and at the bottom of the page, in this order:

```html
<script src="../lab.js" defer></script>
<script src="../lab/<name>.js" defer></script>      <!-- only if it exists -->
<script src="../widgets.js" defer></script>
<script src="../widgets/<name>.js" defer></script>
```

A button elsewhere on the page can load a preset and scroll to the widget: `<button type="button" class="lab-go" data-lab-go="kappa" data-p="paradox">…</button>` (the widget sets `el.labPreset = function (name) {…}`).

### `lab/<name>.js` pattern

Same UMD shape as `lab.js`: in the browser it adds to `window.LLMJLab`, in Node it exports.

```js
(function (root) {
  var api = { positionSwing: function (first, second) { return first - second; } };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
```

Tests: `require('../../lab.js')` and `require('../../lab/<name>.js')`; run all with `node --test tools/`.

### `widgets/<name>.js` pattern

```js
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  H.register('<name>', function (el) {
    var p = 'x' + H.uid();                      // unique id prefix
    el.innerHTML = H.presets([['a', 'Preset A']]) +
      '<div class="lab-ctl">' + H.slider(p + '-s', 'Label', 0, 100, 1, 50) + '</div>' +
      '<svg class="dg" viewBox="0 0 360 160" aria-hidden="true"></svg>' +
      '<div class="statgrid lab-stats">' + H.stat('kappa', p + '-k') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    function draw() { /* read inputs, call L.*, write numbers and SVG */ }
    el.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', draw); });
    draw();
  });
})();
```

Helpers on `LLMJWidgets`:

- `mx(fn)` / `smx(fn, attrs)`: domain words as HTML spans or SVG `<text>`, one per metaphor, switched by the menu.
- `w(name)`: a word from `W`: `A`, `B` (casebook rater names), `yes`, `no`, `items`, `judge`, `tYes`, `tNo`. Example: `H.mx(H.w('yes'))` gives hire / exceeds / medal / recall / strike.
- `t(x, y, text, cls, extra)`: an SVG `<text>`.
- `f2`, `f3`, `cnt`, `pct`: number formats. `f3` gives 3 decimals trimmed to at least 2 (0.80, 0.467), matching the pages. Undefined values (0/0) print as "undefined" or a dash, never NaN.
- `slider(id, label, min, max, step, value)`: a labelled range input with an `<output id="<id>-o">`.
- `table2x2({cols, rows, cells})`: a 2×2 count table (confusion matrix, two-rater grid) styled by `.lab-cmt`; see the comment in `widgets.js` and its use in `widgets/roc.js`.
- `stat(label, id, note)`, `presets([[key, label], …])`, `$(root, id)`, `uid()`.

### Rules

- Numbers must match the page's formulas exactly; the test file proves it against the printed values.
- Keyboard: native `<input type="range">` and buttons only, each with a label; set `aria-valuetext` when the raw number is not self-explanatory; put a one-sentence summary in an `aria-live` paragraph.
- SVG `viewBox` about 360 wide so text stays legible at 390px; use the `svg.dg` classes (`t-ok`, `t-crit`, `box-ok`, `ln-def`, …) and the `.lab` classes in `paper.css`, no inline colours.
- Don't put a widget inside `figure.fig .media` (the zoom dialog would catch every click).
- No `<style>` in `parts/`; CSS goes in `paper.css` under a comment naming the widget.

## Checks before a PR

```bash
python3 tools/check_variants.py      # metaphor slots, term boxes, widget scripts
node --test tools/                   # maths
```

Then load each changed page at 1200 and 390 px wide: no console errors, no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), sliders work from the keyboard, and the metaphor menu switches the widget's words.
