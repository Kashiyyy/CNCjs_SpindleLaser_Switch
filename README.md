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

## GPIO Steuerung konfigurieren (ohne Python/Pip)

Statt eines komplexen Python-Scripts verwenden wir die eingebauten "Server-Befehle" von CNCjs.

### 1. Shell-Scripts vorbereiten

Kopiere die Scripts aus dem `scripts`-Ordner und mache sie ausführbar:

```bash
mkdir -p /home/pi/scripts
cp scripts/gpio-*.sh /home/pi/scripts/
chmod +x /home/pi/scripts/gpio-*.sh
```

### 2. CNCjs Server-Befehle einrichten

1. Öffne CNCjs im Browser.
2. Gehe zu **Settings** (Zahnrad oben rechts) > **Commands**.
3. Klicke auf **+ Add**, um zwei neue Befehle hinzuzufügen:

**Befehl 1 (Laser an):**
- **Name:** `laser-on`
- **Command:** `/home/pi/scripts/gpio-high.sh 16`

**Befehl 2 (Laser aus):**
- **Name:** `laser-off`
- **Command:** `/home/pi/scripts/gpio-low.sh 16`

*Hinweis: Die `16` am Ende ist die Pin-Nummer (BCM). Du kannst sie hier oder im Widget anpassen.*

## In CNCjs konfigurieren (Widget hinzufügen)

1. Klicke in der Widget-Leiste auf **Manage Widgets**.
2. Aktiviere das **Custom** Widget.
3. Klicke auf das Bearbeiten-Icon des Custom Widgets.
4. Gib die URL `/widget/` ein.
5. In den **Settings** des Widgets (auf den Titel klicken) kannst du die Namen der Server-Befehle (`laser-on` / `laser-off`) und die Grbl-Werte anpassen.

## Lizenz

MIT
