#!/usr/bin/env python3
"""Build the Pages site: hub page from main + one folder per creation branch.

Every remote branch `creation/<name>` is exported to `<out>/<name>/` (without
docs and tooling files). If the branch has a creation.json
({"title","description","version","entry"}) it is listed on the hub page.
"""
import argparse, html, json, os, shutil, subprocess, tarfile, io

SKIP = {".git", ".github", "docs", "tools", "CLAUDE.md", "README.md", "creation.json"}

def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout

p = argparse.ArgumentParser()
p.add_argument("--out", default="_site")
p.add_argument("--remote", default="origin")
a = p.parse_args()

shutil.rmtree(a.out, ignore_errors=True)
os.makedirs(a.out)

refs = git("for-each-ref", "--format=%(refname:short)", f"refs/remotes/{a.remote}/creation/").decode().split()
cards = []
for ref in sorted(refs):
    name = ref.split("/creation/", 1)[1]
    dest = os.path.join(a.out, name)
    os.makedirs(dest)
    with tarfile.open(fileobj=io.BytesIO(git("archive", ref)), mode="r:") as tar:
        members = [m for m in tar.getmembers() if m.name.split("/")[0] not in SKIP and not m.name.endswith(".py")]
        tar.extractall(dest, members=members)
    meta = {}
    try:
        meta = json.loads(git("show", f"{ref}:creation.json"))
    except Exception:
        pass
    entry = meta.get("entry", "index.html")
    if not os.path.exists(os.path.join(dest, entry)):
        continue
    cards.append((name, meta.get("title", name), meta.get("description", ""),
                  meta.get("version", ""), entry,
                  os.path.exists(os.path.join(dest, "icon.png")),
                  os.path.exists(os.path.join(dest, "qr.png"))))

items = ""
for name, title, desc, ver, entry, icon, qr in cards:
    items += '<li class="card">'
    if icon:
        items += f'<img class="icon" src="{name}/icon.png" alt="" width="48" height="48">'
    items += f'<div class="txt"><h2>{html.escape(title)} <small>{html.escape(ver)}</small></h2>'
    items += f'<p>{html.escape(desc)}</p><p><a href="{name}/{entry}">Open</a>'
    items += f' · <a href="{name}/qr.png">Install QR</a>' if qr else ""
    items += '</p></div>'
    items += f'<img class="qr" src="{name}/qr.png" alt="Install QR for {html.escape(title)}" width="120" height="120">' if qr else ""
    items += '</li>\n'
if not items:
    items = "<li>No creations yet.</li>"

page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>R1 Creations</title>
<style>
:root {{ --bg:#fff; --fg:#111; --muted:#666; --card:#f4f4f4; --accent:#FE5000; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#000; --fg:#eee; --muted:#999; --card:#161616; }} }}
body {{ margin:0; background:var(--bg); color:var(--fg); font:16px/1.5 system-ui,sans-serif; }}
main {{ max-width:720px; margin:0 auto; padding:24px 16px 48px; }}
h1 {{ color:var(--accent); }} small {{ color:var(--muted); font-weight:400; }}
ul {{ list-style:none; padding:0; display:grid; gap:12px; }}
.card {{ display:flex; gap:12px; align-items:center; background:var(--card); border-radius:12px; padding:12px; }}
.txt {{ flex:1; min-width:0; }} h2 {{ margin:0; font-size:18px; }} p {{ margin:4px 0; color:var(--muted); }}
a {{ color:var(--accent); }} .qr {{ background:#fff; border-radius:6px; }}
.icon {{ border-radius:10px; }}
</style></head><body><main>
<h1>R1 Creations</h1>
<p>Small web apps for the Rabbit R1 (240&times;282 px). Each creation lives on its own
<code>creation/&lt;name&gt;</code> branch. To install one: on the R1 open the creations card,
choose &ldquo;add via QR code&rdquo; and scan its code.</p>
<ul>
{items}</ul>
<p><a href="https://github.com/Luxx1993/effective-funicular">Source &amp; docs on GitHub</a></p>
</main></body></html>
"""
open(os.path.join(a.out, "index.html"), "w").write(page)
open(os.path.join(a.out, ".nojekyll"), "w").write("")
print("built", a.out, "with", [c[0] for c in cards])
