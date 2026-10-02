#!/usr/bin/env python3
"""Build the R1 install QR (JSON payload) for a creation.

Run it inside a creation branch, e.g.:
  python3 tools/make_qr.py --title Tally --description "Simple tally counter" \
      --url https://<user>.github.io/<repo>/tally/index.html
"""
import argparse, json
import qrcode
from qrcode.constants import ERROR_CORRECT_L

p = argparse.ArgumentParser()
p.add_argument("--title", required=True)
p.add_argument("--description", required=True)
p.add_argument("--url", required=True, help="Public HTTPS URL of the (versioned) page")
p.add_argument("--icon-url", help="Default: icon.png next to --url")
p.add_argument("--theme", default="#FE5000")
p.add_argument("--out", default="qr.png")
a = p.parse_args()

payload = {"title": a.title, "url": a.url, "description": a.description,
           "iconUrl": a.icon_url or a.url.rsplit("/", 1)[0] + "/icon.png",
           "themeColor": a.theme}
text = json.dumps(payload, separators=(",", ":"))
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_L, box_size=8, border=4)
qr.add_data(text)
qr.make(fit=True)
qr.make_image(fill_color="black", back_color="white").save(a.out)
print(text)
print("wrote", a.out)
