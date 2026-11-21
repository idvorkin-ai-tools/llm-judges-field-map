# LLM Judges, mapped

A mini-course on LLM judges: judging and grading. Nine units and a maths appendix covering the policy, grading formats, inter-judge agreement (kappa, alpha), the confusion matrix and Youden's J, failure modes, and how to validate a judge. Every running example switches, site-wide, between five domains that met these problems first: job interviews, performance reviews, wine judging, medicine, and umpires.

Live: https://idvorkin-ai-tools.github.io/llm-judges-field-map/

Static HTML. `paper.css` is shared; `site.js` (loaded in every `<head>`) sets the chosen metaphor on `<html>` and adds the menu; `fig.js` enlarges figures. Each switching slot is an element with class `mx` holding one `[data-m]` child per domain (`hire`, `review`, `wine`, `med`, `ump`); `tools/check_variants.py` lints that every slot has all five.
