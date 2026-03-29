
# CNCjs Mode Switcher (Spindle/Laser)

Dieses Plugin ermöglicht das Umschalten zwischen Spindel- und Laser-Modus in CNCjs, inklusive Hardware-Umschaltung via GPIO und automatischer Anpassung der Grbl-Einstellungen.

## Funktionen

- **Hardware-Umschaltung:** Ein GPIO-Pin (Standard: 17) am Raspberry Pi wird umgeschaltet, um z.B. ein Relais oder ein PWM-Signal zu steuern.
- **Grbl-Konfiguration:** Beim Umschalten werden automatisch die passenden Grbl-Werte gesetzt ($32, $30, etc.).
- **Sicherheit:** Das Umschalten ist nur möglich, wenn die Maschine im Status "Idle" ist.
- **Benutzeroberfläche:** Ein einfaches Widget zur Anzeige des aktuellen Modus und zum Umschalten.

## Installation auf dem Raspberry Pi

### 1. Python Script vorbereiten

Speichere die Datei `cnc_mode.py` im Home-Verzeichnis des Benutzers `pi` (oder passe den Pfad in der `index.js` an).

Pfad: `/home/pi/cnc_mode.py`

Stelle sicher, dass die RPi.GPIO Bibliothek installiert ist:
```bash
sudo apt-get update
sudo apt-get install python3-rpi.gpio
```

Mache das Script ausführbar:
```bash
chmod +x /home/pi/cnc_mode.py
```

### 2. CNCjs Plugin installieren

Kopiere den Ordner `mode-switch` in das CNCjs Plugin-Verzeichnis. Standardmäßig ist dies:
`~/.cncjs/plugins/mode-switch`

Struktur:
```
~/.cncjs/plugins/mode-switch/
├── index.js
├── package.json
└── public/
    └── panel.html
```

### 3. Konfiguration in CNCjs

Starte CNCjs neu. Das Plugin sollte automatisch geladen werden.
Du kannst das Widget in der CNCjs Oberfläche hinzufügen, indem du auf "Manage Widgets" klickst und das "Mode Switcher" Plugin aktivierst.

## Grbl Einstellungen

Die folgenden Werte werden standardmäßig beim Umschalten gesetzt (können im UI angepasst werden):

### Laser Modus:
- `$32=1` (Laser Mode ein)
- `$30=1000` (Max. Spindeldrehzahl/Laserleistung)
- `$31=0` (Min. Spindeldrehzahl)
- `$110` / `$111` (Eilganggeschwindigkeit angepasst für Laser)
- `M5` (Sicherheits-Stopp)

### Spindel Modus:
- `$32=0` (Laser Mode aus)
- `$30=10000` (Max. Spindeldrehzahl)
- `$31=0` (Min. Spindeldrehzahl)
- `$110` / `$111` (Eilganggeschwindigkeit angepasst für Fräsen)
- `M5` (Sicherheits-Stopp)

## Hardware-Anschluss

Verbinde den konfigurierten GPIO-Pin (Standard 17, entspricht Pin 11 auf dem Header) mit deiner Umschalthardware.
- **Spindel Modus:** GPIO ist LOW (0V)
- **Laser Modus:** GPIO ist HIGH (3.3V)
