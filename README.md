# CNCjs_SpindelLaser_Switch

Ein Custom Widget für CNCjs zum Umschalten zwischen Spindel und Laser, inklusive Steuerung eines Raspberry Pi GPIO Pins.

## Funktionsweise

Das Widget erlaubt das Umschalten zwischen Laser- und Spindel-Modus. Dabei werden:
1. Bestimmte Grbl-Parameter ($32, $30, $110, $111, $120, $121) aktualisiert.
2. Ein konfigurierbarer GPIO Pin am Raspberry Pi auf HIGH (Laser) oder LOW (Spindel) gesetzt.

Das Umschalten ist aus Sicherheitsgründen nur möglich, wenn sich Grbl im **Idle** Zustand befindet.

## Installation des Widgets

Folge diesen Schritten, um das Widget zu installieren und in CNCjs zu integrieren:

### 1. Repository klonen

Klone dieses Repository auf deinen Raspberry Pi:

```bash
git clone https://github.com/cncjs/CNCjs_SpindelLaser_Switch.git
cd CNCjs_SpindelLaser_Switch
```

### 2. Abhängigkeiten installieren & Widget bauen

```bash
npm install
npm run build
```

### 3. Widget in CNCjs bereitstellen

Verschiebe die gebauten Dateien an einen permanenten Ort:

```bash
mkdir -p /home/pi/cncjs-widgets/spindel-laser-switch
cp -af dist/* /home/pi/cncjs-widgets/spindel-laser-switch/
```

Starte CNCjs mit dem `--mount`-Parameter (oder füge ihn in deine pm2 Konfiguration ein):

```bash
cncjs --mount /widget:/home/pi/cncjs-widgets/spindel-laser-switch
```

## Installation des GPIO-Listeners (Hintergrund-Script)

Da Web-Browser keinen direkten Zugriff auf die Hardware-Pins des Raspberry Pi haben, wird ein kleines Python-Script benötigt, das im Hintergrund läuft und die Befehle vom Widget entgegennimmt.

### 1. Python Abhängigkeiten installieren

```bash
sudo apt-get update
sudo apt-get install python3-rpi.gpio
pip3 install "python-socketio[client]<5"
```
*Hinweis: CNCjs verwendet eine ältere Socket.io Version, daher ist `<5` oft notwendig.*

### 2. Script einrichten

Das Script befindet sich unter `scripts/cncjs-gpio-listener.py`. Du kannst es an einen Ort deiner Wahl kopieren, z.B.:

```bash
mkdir -p /home/pi/scripts
cp scripts/cncjs-gpio-listener.py /home/pi/scripts/
chmod +x /home/pi/scripts/cncjs-gpio-listener.py
```

### 3. Script automatisch starten (mit pm2)

Es wird empfohlen, das Script mit `pm2` zu verwalten, damit es beim Booten automatisch startet:

```bash
pm2 start /home/pi/scripts/cncjs-gpio-listener.py --name cncjs-gpio-listener
pm2 save
```

*Falls dein CNCjs einen API-Token benötigt, kannst du diesen als Umgebungsvariable übergeben:*
```bash
CNCJS_TOKEN=dein_token_hier pm2 start /home/pi/scripts/cncjs-gpio-listener.py --name cncjs-gpio-listener
```

## In CNCjs konfigurieren

1. Öffne CNCjs im Browser.
2. Klicke auf **Manage Widgets** (Zahnrad-Icon in der Widget-Leiste).
3. Aktiviere das **Custom** Widget.
4. Klicke auf das Bearbeiten-Icon des Custom Widgets.
5. Gib die URL `/widget/` ein.
6. Das Widget erscheint nun. In den **Settings** (auf den Titel klicken) kannst du den GPIO Pin (Standard: 16) und die Grbl-Werte anpassen.

## Lizenz

MIT
