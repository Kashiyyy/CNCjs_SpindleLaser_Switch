
# CNCjs Mode Switcher (Spindle/Laser)

Dieses Plugin ermöglicht das Umschalten zwischen Spindel- und Laser-Modus in CNCjs, inklusive Hardware-Umschaltung via GPIO und automatischer Anpassung der Grbl-Einstellungen.

## Funktionen

- **Hardware-Umschaltung:** Ein GPIO-Pin (Standard: 17) am Raspberry Pi wird umgeschaltet, um z.B. ein Relais oder ein PWM-Signal zu steuern.
- **Grbl-Konfiguration:** Beim Umschalten werden automatisch die passenden Grbl-Werte gesetzt ($32, $30, etc.).
- **Sicherheit:** Das Umschalten ist nur möglich, wenn die Maschine im Status "Idle" ist.
- **Benutzeroberfläche:** Ein einfaches Widget zur Anzeige des aktuellen Modus und zum Umschalten.

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
Wechsle in das Plugin-Unterverzeichnis und installiere es global. Dies macht das Paket systemweit verfügbar (normalerweise unter `/usr/local/lib/node_modules/` oder `/usr/lib/node_modules/`).

```bash
cd ~/CNCjs_SpindleLaser_Switch/cncjs-pendant-mode-switch
sudo npm install -g .
```

### 3. Plugin in CNCjs registrieren (Symlink)
CNCjs sucht Plugins standardmäßig im Verzeichnis `~/.cncjs/plugins`. Wir erstellen dort einen Symlink auf das global installierte Paket.

Finde zuerst heraus, wo dein globales `node_modules` liegt:
```bash
npm root -g
# Beispiel-Ausgabe: /usr/local/lib/node_modules
```

Verwende diesen Pfad (hier als `/usr/local/lib/node_modules` angenommen), um den Link zu erstellen:
```bash
mkdir -p ~/.cncjs/plugins
ln -s /usr/local/lib/node_modules/cncjs-pendant-mode-switch ~/.cncjs/plugins/cncjs-pendant-mode-switch
```

### 4. CNCjs neu starten
Damit CNCjs das neue Plugin lädt:
```bash
# Falls du pm2 benutzt:
pm2 restart cncjs

# Falls es als System-Service läuft:
sudo systemctl restart cncjs
```

---

## Fehlerbehebung (Troubleshooting)

### Plugin wird nicht geladen?
Prüfe, ob der Symlink korrekt ist:
```bash
ls -l ~/.cncjs/plugins/cncjs-pendant-mode-switch
```
Dies sollte auf den Pfad zeigen, den `npm root -g` ausgegeben hat.

Prüfe die CNCjs Logs auf Fehler beim Laden von Plugins:
```bash
# Bei pm2:
pm2 logs cncjs
```

### GPIO-Berechtigungen
Sollte die Umschaltung nicht funktionieren, stelle sicher, dass der Benutzer, unter dem CNCjs läuft (meist `pi`), Zugriff auf GPIO hat:
```bash
sudo usermod -a -G gpio pi
```

---

## Konfiguration & Nutzung

### Plugin-Widget hinzufügen
1. Öffne CNCjs im Browser.
2. Klicke oben rechts auf **"Manage Widgets"**.
3. Aktiviere das **"Mode Switcher"** Plugin.

### Grbl Einstellungen
Die Werte werden beim Umschalten automatisch gesendet:

- **Laser:** `$32=1`, `$30=1000`, `$31=0`, `$110=2000`, `$111=2000` + `M5`
- **Spindel:** `$32=0`, `$30=10000`, `$31=0`, `$110=1000`, `$111=1000` + `M5`

*Hinweis: Du kannst diese Werte direkt im Plugin-Widget unter "Settings" anpassen.*

## Hardware-Anschluss
Verbinde den GPIO-Pin 17 (Pin 11 auf dem Header) mit deiner Hardware:
- **Spindel Modus:** GPIO 17 ist LOW (0V)
- **Laser Modus:** GPIO 17 ist HIGH (3.3V)
