# CNCjs_SpindelLaser_Switch

Ein Custom Widget für CNCjs zum Umschalten zwischen Spindel und Laser, inklusive direkter Steuerung eines Raspberry Pi GPIO Pins.

## Funktionsweise

Das Widget erlaubt das Umschalten zwischen Laser- und Spindel-Modus. Dabei werden:
1. Bestimmte Grbl-Parameter ($32, $30, $110, $111, $120, $121) aktualisiert.
2. Ein GPIO Pin am Raspberry Pi geschaltet (HIGH für Laser, LOW für Spindel).

Das Umschalten ist aus Sicherheitsgründen nur möglich, wenn sich Grbl im **Idle** Zustand befindet.

## Installation des Widgets

### 1. Repository klonen & Bauen

Klone dieses Repository auf deinen Raspberry Pi und baue das Projekt:

```bash
git clone https://github.com/cncjs/CNCjs_SpindelLaser_Switch.git
cd CNCjs_SpindelLaser_Switch
npm install
npm run build
```

### 2. Widget in CNCjs bereitstellen

Verschiebe die gebauten Dateien an einen permanenten Ort:

```bash
mkdir -p /home/pi/cncjs-widgets/spindel-laser-switch
cp -af dist/* /home/pi/cncjs-widgets/spindel-laser-switch/
```

Starte CNCjs mit dem `--mount`-Parameter:

```bash
cncjs --mount /widget:/home/pi/cncjs-widgets/spindel-laser-switch
```

## Direkte GPIO Steuerung einrichten (Empfohlen)

Da CNCjs Server-Befehle manchmal unzuverlässig sind, bietet dieses Widget eine "Direkte Steuerung" über eine kleine Bridge an. Diese benötigt keine Installation von Python-Paketen und läuft direkt mit Node.js.

### 1. Bridge vorbereiten

Kopiere die Dateien und mache das Script ausführbar:

```bash
mkdir -p /home/pi/scripts
cp scripts/gpio-set.sh scripts/gpio-bridge.cjs /home/pi/scripts/
chmod +x /home/pi/scripts/gpio-set.sh
```

### 2. Bridge starten (mit pm2)

Es wird empfohlen, die Bridge mit `pm2` zu verwalten:

```bash
pm2 start /home/pi/scripts/gpio-bridge.cjs --name gpio-bridge
pm2 save
```

## In CNCjs konfigurieren

1. Klicke in der Widget-Leiste auf **Manage Widgets**.
2. Aktiviere das **Custom** Widget.
3. Klicke auf das Bearbeiten-Icon des Custom Widgets.
4. Gib die URL `/widget/` ein.
5. In den **Settings** des Widgets (auf den Titel klicken) ist **Direkte Steuerung** standardmäßig aktiv. Hier kannst du den GPIO Pin und die Grbl-Werte anpassen.

## Fehlerbehebung (Debugging)

### 1. Log-Datei prüfen
Das Script schreibt ein Log nach `/home/pi/scripts/gpio.log`. Schau dort hinein:
```bash
tail -f /home/pi/scripts/gpio.log
```

### 2. Manueller Test der Bridge
Du kannst die Bridge direkt im Browser testen, indem du folgende URL aufrufst (ersetze IP falls nötig):
`http://localhost:8008/?pin=16&state=on`

## Lizenz

MIT
