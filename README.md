# Tally – Strichlisten-Zähler für den Rabbit R1

Einfache Creation (eine Datei, `index-v0.1.1.html`, keine Abhängigkeiten) für den 240×282-px-Bildschirm.
Referenz: `docs/r1-creations.md`.

## Bedienung

| Eingabe | Aktion |
| --- | --- |
| Scrollrad hoch / Side-Click / Touch | +1 |
| Scrollrad runter | −1 (nie unter 0) |
| Side-Button lang halten | Zurücksetzen auf 0 (kurzes Aufblitzen) |

Der Stand wird in `creationStorage.plain` gespeichert (Base64, UTF-8-sicher), am Desktop in `localStorage`.

## Lokal testen

```bash
python3 -m http.server 8000
# Browser: http://localhost:8000/index.html
```

Tastatur-Vorschau: ↑ = scrollUp, ↓ = scrollDown, Enter = sideClick, R = longPressStart.

## Auf GitHub Pages hosten

1. Repository auf GitHub pushen.
2. *Settings → Pages → Build and deployment*: Source „Deploy from a branch“, Branch wählen (z. B. `main`), Ordner `/ (root)`.
3. Nach kurzer Zeit erreichbar unter `https://<user>.github.io/<repo>/index-v0.1.1.html` (HTTPS).

## Installieren

```bash
pip install pillow qrcode
python3 make_icon.py          # erzeugt icon.png (96×96)
python3 make_qr.py --url https://<user>.github.io/<repo>/index.html
```

Das Skript gibt das Install-JSON aus und schreibt `qr.png`. Auf dem R1:
**Creations-Karte → „add via QR code“ → QR scannen.**
(`icon.png` muss neben `index-v0.1.1.html` mit gehostet sein; sonst `--icon-url` angeben.)

## Aktualisieren

1. `APP_VERSION` in `index-v0.1.1.html` erhöhen.
2. Kopie unter neuem Namen anlegen: `cp index.html index-v0.1.1.html`, committen, pushen.
3. Die alte Karte auf dem R1 **deinstallieren**.
4. QR mit der versionierten URL neu erzeugen:
   `python3 make_qr.py --url https://<user>.github.io/<repo>/index-v0.1.1.html`
5. Neuen QR scannen.
