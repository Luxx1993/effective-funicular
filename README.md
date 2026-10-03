# Rabbit R1 Creations

Sammlung kleiner Web-Apps („Creations“) für den Rabbit R1 (Bildschirm 240×282 px).

## Aufbau

| Wo | Was |
| --- | --- |
| `main` | Übersichtsseite, Doku (`docs/r1-creations.md`), Werkzeuge (`tools/`), Deploy-Workflow |
| `creation/<name>` | Eine Creation pro Branch (Dateien im Branch-Root) |

Die Seite `https://luxx1993.github.io/r1-creations/` listet alle Creations. Jede liegt unter
`/<name>/`, z. B. `/tally/`.

## Creations

| Name | Branch | Beschreibung |
| --- | --- | --- |
| Tally | `creation/tally` | Strichlisten-Zähler mit Auto-Rotation |
| Marble Maze | `creation/marble-maze` | Murmel-Labyrinth, 15 Level, Neigung per Beschleunigungssensor, Rad = Tempo |

### Tally installieren

Auf dem R1: Creations-Karte → „add via QR code“ → diesen Code scannen.

[![Install-QR für Tally – Klick öffnet den Branch](https://raw.githubusercontent.com/Luxx1993/r1-creations/creation/tally/qr.png)](https://github.com/Luxx1993/r1-creations/tree/creation/tally)

(Ein Klick auf das Bild öffnet den Branch `creation/tally` mit Screenshots und Beschreibung. Das Bild ist immer der aktuelle Code der Creation.)

## Neue Creation anlegen

```bash
git checkout -b creation/<name> main
# index.html, icon.png (96x96), creation.json anlegen
pip install pillow qrcode
python3 tools/make_qr.py --title "<Titel>" --description "<Text>" \
  --url https://luxx1993.github.io/r1-creations/<name>/index.html
git add -A && git commit -m "Add <name>" && git push -u origin creation/<name>
```

`creation.json`: `{"title":"…","description":"…","version":"0.1.0","entry":"index.html"}`.
Der Workflow `.github/workflows/pages.yml` baut bei jedem Push auf `main` oder `creation/**` die
Seite neu (Übersicht + ein Ordner pro Creation).

## Einmalig einrichten

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Hinweise

- Neue Version einer Creation = neue Datei `index-v<version>.html`, alte Karte auf dem R1
  deinstallieren, neuen QR scannen (die R1 cached die Install-URL).
- Alle Creations teilen sich den Origin `luxx1993.github.io`: `localStorage`-Schlüssel mit
  Creation-Namen versehen (z. B. `tally_state`).
- Details, SDK und Erfahrungen vom echten Gerät: `docs/r1-creations.md`.
