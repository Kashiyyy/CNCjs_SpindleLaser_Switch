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

Falls der GPIO Pin nicht schaltet, kannst du folgende Schritte zur Fehlersuche unternehmen:

1. **Log-Datei prüfen:** Das Script schreibt ein Log nach `/home/pi/scripts/gpio.log`. Schau dort hinein, um zu sehen, ob das Script überhaupt aufgerufen wird und ob Fehler auftreten:
   ```bash
   tail -f /home/pi/scripts/gpio.log
   ```

2. **Manuelle Prüfung:** Führe das Script manuell im Terminal aus, um sicherzustellen, dass es funktioniert:
   ```bash
   /home/pi/scripts/gpio-set.sh 16 on
   ```

3. **Berechtigungen:** CNCjs läuft normalerweise als der User, der es gestartet hat (z.B. `pi` oder `cnc`). Dieser User muss Zugriff auf die GPIOs haben. Auf modernen Pi-Systemen ist das meist über die Gruppe `gpio` geregelt:
   ```bash
   sudo usermod -a -G gpio $USER
   ```
   (Danach neu einloggen oder den Pi neustarten).

4. **Widget Test-Buttons:** In den Settings des Widgets gibt es Buttons "Test On" und "Test Off". Diese lösen den Befehl aus, ohne die Grbl-Settings zu ändern. Beobachte dabei das Log-File.

## In CNCjs konfigurieren (Widget hinzufügen)

1. Klicke in der Widget-Leiste auf **Manage Widgets**.
2. Aktiviere das **Custom** Widget.
3. Klicke auf das Bearbeiten-Icon des Custom Widgets.
4. Gib die URL `/widget/` ein.

## Lizenz

MIT
