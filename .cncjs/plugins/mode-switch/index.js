
module.exports = function (app) {
  const express = app.express;
  const router = express.Router();
  const fs = require("fs");
  const path = require("path");
  const { exec } = require("child_process");

  const CONFIG_FILE = "/tmp/cnc_mode_config.json";
  const STATE_FILE = "/tmp/cnc_mode_state";
  const PY_SCRIPT = "/app/cnc_mode.py"; // Use relative path from root if possible or absolute for pi

  let machineState = "Unknown";
  let controller = null;

  // Track the controller instance
  app.on("serialport:open", (options) => {
    const { port, controller: ctrl } = options;
    controller = ctrl;
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
          console.error(`exec error: ${error}`);
          return reject(error);
        }
        resolve(stdout);
      });
    });
  }

  function sendGCode(commands) {
    if (!controller) {
      console.error("No controller connected");
      return;
    }
    commands.forEach(cmd => {
      controller.write(cmd + "\n");
    });
  }

  router.get("/state", (req, res) => {
    const mode = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, "utf8").trim() : "spindle";
    res.send({ mode, machine: machineState, config: loadConfig() });
  });

  router.post("/toggle", async (req, res) => {
    // For safety during development/testing, check for "Idle" but allow "Unknown" if no port open
    if (machineState !== "Idle" && machineState !== "Unknown") {
      return res.status(400).send({ ok: false, error: "Machine is not Idle", machine: machineState });
    }

    try {
      await runPython();
      const mode = fs.readFileSync(STATE_FILE, "utf8").trim();
      const cfg = loadConfig();
      const settings = cfg[mode] || {};

      const gcode = [];
      // Always send M5 first to ensure things are stopped
      gcode.push("M5");

      // Grbl settings
      for (const key in settings) {
        if (key.startsWith("$")) {
          gcode.push(`${key}=${settings[key]}`);
        }
      }

      // Additional commands if any
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

  app.use("/mode-switch", router);
};
