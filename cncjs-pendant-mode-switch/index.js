
module.exports = function (app) {
  const express = app.express;
  const router = express.Router();
  const fs = require("fs");
  const path = require("path");
  const { exec } = require("child_process");

  const CONFIG_FILE = "/tmp/cnc_mode_config.json";
  const STATE_FILE = "/tmp/cnc_mode_state";
  const PY_SCRIPT = "/home/pi/cnc_mode.py";

  let machineState = "Unknown";
  let controller = null;

  console.log("[ModeSwitch] Plugin starting up. Path:", __dirname);

  // Track the controller instance
  app.on("serialport:open", (options) => {
    const { port, controller: ctrl } = options;
    controller = ctrl;
    console.log("[ModeSwitch] Serial port opened:", port);
  });

  app.on("serialport:read", (data) => {
    const line = data.toString();
    if (line.includes("<") && line.includes(">")) {
      const match = line.match(/<([^,|>]+)/);
      if (match) machineState = match[1];
    }
  });

  function loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch {
      return {
        laser: {
          $32: 1,
          $30: 1000,
          $31: 0,
          $110: 2000,
          $111: 2000,
          commands: ["M5"]
        },
        spindle: {
          $32: 0,
          $30: 10000,
          $31: 0,
          $110: 1000,
          $111: 1000,
          commands: ["M5"]
        }
      };
    }
  }

  function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  }

  function runPython() {
    return new Promise((resolve, reject) => {
      exec(`python3 ${PY_SCRIPT}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`[ModeSwitch] GPIO exec error: ${error}`);
          return reject(error);
        }
        resolve(stdout);
      });
    });
  }

  function sendGCode(commands) {
    if (!controller) {
      console.error("[ModeSwitch] Controller not connected. Commands skipped.");
      return;
    }
    commands.forEach(cmd => {
      controller.write(cmd + "\n");
    });
    console.log("[ModeSwitch] Sent G-code:", commands.join(", "));
  }

  // API Routes for the Widget
  router.get("/state", (req, res) => {
    const mode = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, "utf8").trim() : "spindle";
    res.send({ mode, machine: machineState, config: loadConfig() });
  });

  router.post("/toggle", async (req, res) => {
    if (machineState !== "Idle" && machineState !== "Unknown") {
      return res.status(400).send({ ok: false, error: "Machine is not Idle", machine: machineState });
    }

    try {
      await runPython();
      const mode = fs.readFileSync(STATE_FILE, "utf8").trim();
      const cfg = loadConfig();
      const settings = cfg[mode] || {};

      const gcode = ["M5"];
      for (const key in settings) {
        if (key.startsWith("$")) gcode.push(`${key}=${settings[key]}`);
      }
      if (Array.isArray(settings.commands)) {
        settings.commands.forEach(c => gcode.push(c));
      }

      sendGCode(gcode);
      res.send({ ok: true, mode, machine: machineState });
    } catch (err) {
      res.status(500).send({ ok: false, error: err.message });
    }
  });

  router.post("/config", express.json(), (req, res) => {
    saveConfig(req.body);
    res.send({ ok: true });
  });

  // Serve static UI assets from the plugin's public directory
  const publicPath = path.join(__dirname, 'public');
  router.use(express.static(publicPath));

  // Mount the plugin's router to /mode-switch
  app.use("/mode-switch", router);

  console.log("[ModeSwitch] Mounted at /mode-switch. Static assets in:", publicPath);
};
