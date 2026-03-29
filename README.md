
# CNCjs Mode Switcher (Spindle/Laser)

Dieses Plugin ermöglicht das Umschalten zwischen Spindel- und Laser-Modus in CNCjs, inklusive Hardware-Umschaltung via GPIO und automatischer Anpassung der Grbl-Einstellungen.

## Funktionen

- **Hardware-Umschaltung:** Ein GPIO-Pin (Standard: 17) am Raspberry Pi wird umgeschaltet, um z.B. ein Relais oder ein PWM-Signal zu steuern.
- **Grbl-Konfiguration:** Beim Umschalten werden automatisch die passenden Grbl-Werte gesetzt ($32, $30, etc.).
- **Sicherheit:** Das Umschalten ist nur möglich, wenn die Maschine im Status "Idle" ist.
- **Benutzeroberfläche:** Ein einfaches Widget zur Anzeige des aktuellen Modus und zum Umschalten.

---

## Installations-Guide (Raspberry Pi & Global CNCjs)

Folge diesen Schritten, um das Plugin auf einem Raspberry Pi zu installieren, auf dem CNCjs global via `npm install -g cncjs` installiert wurde.

### 1. Repository klonen
Navigiere in dein Home-Verzeichnis und klone das Repository:
```bash
cd ~
git clone https://github.com/DEIN-USERNAME/CNCjs_SpindleLaser_Switch.git
cd CNCjs_SpindleLaser_Switch
```

### 2. Python Script vorbereiten
Das Script steuert den GPIO Pin 17.
```bash
# RPi.GPIO installieren (falls nicht vorhanden)
sudo apt-get update
sudo apt-get install python3-rpi.gpio

# Script an die richtige Stelle kopieren und ausführbar machen
cp cnc_mode.py /home/pi/cnc_mode.py
chmod +x /home/pi/cnc_mode.py
```

### 3. Plugin als NPM-Paket installieren
Wenn CNCjs global installiert ist, kann das Plugin ebenfalls global installiert werden:

```bash
# In den Plugin-Ordner wechseln
cd ~/CNCjs_SpindleLaser_Switch/cncjs-pendant-mode-switch

# Global via NPM installieren
sudo npm install -g .
```

Alternativ kannst du das Plugin auch direkt via Git URL installieren:
```bash
sudo npm install -g https://github.com/DEIN-USERNAME/CNCjs_SpindleLaser_Switch.git#main:cncjs-pendant-mode-switch
```

### 4. CNCjs Konfiguration
CNCjs erkennt Plugins in `~/.cncjs/plugins` automatisch. Falls du das Plugin global installiert hast, kannst du es dort verlinken oder CNCjs mitteilen, wo es suchen soll. Der einfachste Weg bei globaler Installation ist:

```bash
mkdir -p ~/.cncjs/plugins
ln -s /usr/local/lib/node_modules/cncjs-pendant-mode-switch ~/.cncjs/plugins/cncjs-pendant-mode-switch
```

### 5. CNCjs neu starten
Damit CNCjs das neue Plugin erkennt, muss der Service neu gestartet werden:
```bash
# Wenn du pm2 benutzt:
pm2 restart cncjs

# Oder manuell:
sudo systemctl restart cncjs
```

---

## Konfiguration & Nutzung

### Plugin-Widget hinzufügen
1. Öffne CNCjs im Browser.
2. Klicke oben rechts auf **"Manage Widgets"**.
3. Aktiviere das **"Mode Switcher"** Plugin.
4. Das Widget erscheint nun in deiner Seitenleiste.

### Grbl Einstellungen
Die Werte werden beim Umschalten automatisch gesendet:

- **Laser:** `$32=1`, `$30=1000`, `$31=0`, `$110=2000`, `$111=2000` + `M5`
- **Spindel:** `$32=0`, `$30=10000`, `$31=0`, `$110=1000`, `$111=1000` + `M5`

*Hinweis: Du kannst diese Werte direkt im Plugin-Widget unter "Settings" anpassen und speichern.*

## Hardware-Anschluss
Verbinde den GPIO-Pin 17 (Pin 11 auf dem Header) mit deiner Hardware:
- **Spindel Modus:** GPIO 17 ist LOW (0V)
- **Laser Modus:** GPIO 17 ist HIGH (3.3V)
