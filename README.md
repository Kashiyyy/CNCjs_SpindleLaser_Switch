# CNCjs_SpindelLaser_Switch

Ein Custom Widget für CNCjs zum Umschalten zwischen Spindel und Laser, inklusive Steuerung eines Raspberry Pi GPIO Pins über CNCjs Server-Befehle.

## Funktionsweise

Das Widget erlaubt das Umschalten zwischen Laser- und Spindel-Modus. Dabei werden:
1. Bestimmte Grbl-Parameter ($32, $30, $110, $111, $120, $121) aktualisiert.
2. Ein vorkonfigurierter CNCjs **Server-Befehl** ausgeführt, um einen GPIO Pin am Raspberry Pi zu schalten.

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

## GPIO Steuerung konfigurieren

Wir verwenden die eingebauten "Server-Befehle" von CNCjs, um den GPIO Pin zu steuern.

### 1. Shell-Script vorbereiten

Kopiere das Script aus dem `scripts`-Ordner und mache es ausführbar:

```bash
mkdir -p /home/pi/scripts
cp scripts/gpio-set.sh /home/pi/scripts/
chmod +x /home/pi/scripts/gpio-set.sh
```

### 2. CNCjs Server-Befehle einrichten

1. Öffne CNCjs im Browser.
2. Gehe zu **Settings** (Zahnrad oben rechts) > **Commands**.
3. Klicke auf **+ Add**, um zwei neue Befehle hinzuzufügen:

**Befehl 1 (Laser an):**
- **Name:** `laser-on`
- **Command:** `/home/pi/scripts/gpio-set.sh 16 on`

**Befehl 2 (Laser aus):**
- **Name:** `laser-off`
- **Command:** `/home/pi/scripts/gpio-set.sh 16 off`

## Fehlerbehebung (Debugging)

Falls der GPIO Pin nicht schaltet, obwohl die Grbl-Settings übernommen werden:

### 1. Log-Datei prüfen
Das Script schreibt ein Log nach `/home/pi/scripts/gpio.log`. Schau dort hinein:
```bash
tail -f /home/pi/scripts/gpio.log
```

### 2. Test über die Browser-Konsole
Da das Widget in einem "Iframe" läuft, musst du in der Browser-Konsole den richtigen Kontext auswählen.

1. Drücke **F12**, um die Konsole zu öffnen.
2. Suche in der Konsole das Dropdown-Menü, das standardmäßig auf **top** (oder **Hauptfenster**) steht.
3. Wähle dort den Eintrag aus, der auf deine Widget-URL endet (z.B. `localhost:8000/widget/` oder ähnlich).
4. Nun kannst du die Befehle eingeben:

```javascript
// Test 1
controller.socket.emit('run', 'laser-on');

// Test 2
controller.socket.emit('command', null, 'run', 'laser-on');
```

**Alternative:** Falls du den Kontext nicht umschalten möchtest, kannst du versuchen, diesen Befehl im **top** Kontext auszuführen:
```javascript
cncjs_widget_controller.socket.emit('run', 'laser-on');
```

## In CNCjs konfigurieren (Widget hinzufügen)

1. Klicke in der Widget-Leiste auf **Manage Widgets**.
2. Aktiviere das **Custom** Widget.
3. Klicke auf das Bearbeiten-Icon des Custom Widgets.
4. Gib die URL `/widget/` ein.

## Lizenz

MIT
