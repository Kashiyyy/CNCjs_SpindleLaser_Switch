# CNCjs_SpindelLaser_Switch

Ein Custom Widget für CNCjs zum Umschalten zwischen Spindel und Laser.

## Installation

Folge diesen Schritten, um das Widget zu installieren und in CNCjs zu integrieren:

### 1. Repository klonen

Klone dieses Repository auf deinen Computer oder Raspberry Pi:

```bash
git clone https://github.com/cncjs/CNCjs_SpindelLaser_Switch.git
cd CNCjs_SpindelLaser_Switch
```

### 2. Abhängigkeiten installieren

Verwende `npm`, um die notwendigen Pakete zu installieren:

```bash
npm install
```

### 3. Widget bauen

Erstelle die Produktionsdateien im `dist`-Ordner:

```bash
npm run build
```

### 4. Widget in CNCjs bereitstellen

Verschiebe die gebauten Dateien an einen permanenten Ort (z.B. `/home/pi/cncjs-widgets/spindel-laser-switch`):

```bash
mkdir -p /home/pi/cncjs-widgets/spindel-laser-switch
cp -af dist/* /home/pi/cncjs-widgets/spindel-laser-switch/
```

Starte CNCjs mit dem `--mount`-Parameter, um das Widget verfügbar zu machen:

```bash
cncjs --mount /widget:/home/pi/cncjs-widgets/spindel-laser-switch
```

*Hinweis: Wenn du CNCjs bereits als Dienst (z.B. mit pm2) ausführst, musst du die Startparameter in deiner Konfiguration anpassen.*

### 5. In CNCjs konfigurieren

1. Öffne CNCjs im Browser.
2. Klicke auf **Manage Widgets** (Zahnrad-Icon in der Widget-Leiste).
3. Aktiviere das **Custom** Widget.
4. Klicke auf das Bearbeiten-Icon (Schraubenschlüssel/Zahnrad) des neuen Custom Widgets.
5. Gib die URL für das gemountete Widget ein (Standardmäßig `/widget/`).
6. Wenn alles korrekt konfiguriert ist, erscheint das Widget in deiner CNCjs-Oberfläche.

## Entwicklung

Um das Widget lokal zu entwickeln:

1. Starte den Entwicklungsserver:
   ```bash
   npm run dev
   ```
2. Öffne den angezeigten Link (standardmäßig `http://localhost:5173/`).

## Lizenz

MIT
