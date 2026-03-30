
# CNCjs Mode Switcher (Spindle/Laser)

Dieses Plugin ermöglicht das Umschalten zwischen Spindel- und Laser-Modus in CNCjs, inklusive Hardware-Umschaltung via GPIO am Raspberry Pi und automatischer Anpassung der Grbl-Einstellungen.

## Funktionen

- **Hardware-Umschaltung:** Ein GPIO-Pin (Standard: 17) am Raspberry Pi wird umgeschaltet, um z.B. ein Relais oder ein PWM-Signal zu steuern.
- **Grbl-Konfiguration:** Beim Umschalten werden automatisch die passenden Grbl-Werte gesetzt ($32, $30, etc.).
- **Sicherheit:** Das Umschalten ist nur möglich, wenn die Maschine im Status "Idle" ist.
- **Benutzeroberfläche:** Ein integriertes Widget zur Anzeige des aktuellen Modus und zum Umschalten.

---

## Installations-Guide (Raspberry Pi & Global NPM)

Folge diesen Schritten, um das Plugin auf einem Raspberry Pi korrekt als globales NPM-Paket zu installieren.

### 1. Repository klonen & Python Script vorbereiten
```bash
cd ~
git clone https://github.com/DEIN-USERNAME/CNCjs_SpindleLaser_Switch.git
cd CNCjs_SpindleLaser_Switch

# GPIO-Tool installieren und Script ausführbar machen
sudo apt-get update && sudo apt-get install -y python3-rpi.gpio
cp cnc_mode.py /home/pi/cnc_mode.py
chmod +x /home/pi/cnc_mode.py
```

### 2. Plugin GLOBAL via NPM installieren
Wechsle in das Plugin-Unterverzeichnis und installiere es global.

```bash
cd ~/CNCjs_SpindleLaser_Switch/cncjs-pendant-mode-switch
sudo npm install -g .
```

### 3. Plugin in CNCjs registrieren (Symlink)
Erstelle einen Symlink im CNCjs Plugin-Verzeichnis:
```bash
mkdir -p ~/.cncjs/plugins
ln -s "$(npm root -g)/cncjs-pendant-mode-switch" ~/.cncjs/plugins/cncjs-pendant-mode-switch
```

### 4. CNCjs neu starten
```bash
# Falls du pm2 benutzt:
pm2 restart cncjs

# Falls es als System-Service läuft:
sudo systemctl restart cncjs
```

---

## Widget in CNCjs hinzufügen (WICHTIG)

Damit das Plugin als Widget in der CNCjs Oberfläche erscheint, musst du es als **Custom Widget** hinzufügen:

1. Öffne CNCjs im Browser.
2. Klicke in der rechten Leiste auf das **"Manage Widgets"** Symbol (das "+" oder Zahnrad oben rechts bei den Widgets).
3. Scrolle zu **"Custom Widget"** und klicke auf das **"+"** zum Hinzufügen.
4. Klicke beim neuen Custom Widget auf das **Zahnrad (Edit)**.
5. Gib im Feld **URL** folgendes ein: `/mode-switch/`
6. Klicke auf **Save**.

Das Widget sollte nun geladen werden und den Status der Maschine sowie den aktuellen Modus anzeigen.

---

## Fehlerbehebung (Troubleshooting)

### Plugin wird nicht geladen?
Prüfe die CNCjs Logs auf Fehlermeldungen (z.B. `[ModeSwitch]`):
```bash
pm2 logs cncjs
```

Prüfe, ob der Symlink korrekt ist:
```bash
ls -l ~/.cncjs/plugins/cncjs-pendant-mode-switch
```

### GPIO-Berechtigungen
Sollte die Umschaltung nicht funktionieren, stelle sicher, dass der Benutzer, unter dem CNCjs läuft (meist `pi`), Zugriff auf GPIO hat:
```bash
sudo usermod -a -G gpio pi
```

## Grbl Einstellungen
Die Werte werden beim Umschalten automatisch gesendet:

- **Laser:** `$32=1`, `$30=1000`, `$31=0`, `$110=2000`, `$111=2000` + `M5`
- **Spindel:** `$32=0`, `$30=10000`, `$31=0`, `$110=1000`, `$111=1000` + `M5`

## Hardware-Anschluss
Verbinde den GPIO-Pin 17 (Pin 11 auf dem Header) mit deiner Hardware:
- **Spindel Modus:** GPIO 17 ist LOW (0V)
- **Laser Modus:** GPIO 17 ist HIGH (3.3V)
