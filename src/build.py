#!/usr/bin/env python3
"""Bakes manifest, looks and the Monocraft font into index.html; writes index-v<ver>.html too."""
import json, re, shutil
ver = re.search(r"APP_VERSION = '([\d.]+)'", open('src/index.src.html').read()).group(1)
s = open('src/index.src.html').read()
mono = json.load(open('src/mono.b64.json'))
font = ''.join('@font-face{font-family:Monocraft;font-weight:%s;src:url(data:font/woff2;base64,%s) format("woff2")}' % (w, mono[k]) for k, w in (('regular', 400), ('bold', 700)))
s = s.replace('/*@FONT@*/', font)
s = s.replace('/*@MANI@*/null', open('src/manifest.json').read())
s = s.replace('/*@LOOKS@*/null', open('src/looks.json').read())
open('index.html', 'w').write(s)
shutil.copy('index.html', 'index-v%s.html' % ver)
print('built', ver)
