
module.exports = function (app) {
  const express = app.express;
  const router = express.Router();
  const fs = require("fs");
  const http = require("http");
  const { exec } = require("child_process");

  const CONFIG_FILE = "/tmp/cnc_mode_config.json";
  const STATE_FILE = "/tmp/cnc_mode_state";

  let machineState = "Unknown";

  app.on("serialport:read", (data) => {
    const line = data.toString();
    if (line.startsWith("<")) {
      if (line.includes("Idle")) machineState = "Idle";
      else if (line.includes("Run")) machineState = "Run";
      else if (line.includes("Hold")) machineState = "Hold";
      else if (line.includes("Alarm")) machineState = "Alarm";
      else if (line.includes("Door")) machineState = "Door";
      else if (line.includes("Check")) machineState = "Check";
    }
  });

  function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE)); }
    catch {
      return {
        gpio:{pin:17},
        active:{laser:"wood_engrave", spindle:"wood"},
        materials:{
          laser:{},
          spindle:{}
        }
      };
    }
  }

  function saveConfig(cfg){
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg,null,2));
  }

  function runPython(){
    exec("python3 /home/pi/cnc_mode.py");
  }

  function loadWorkspace(name){
    http.get(`http://localhost:8000/api/workspace/load?name=${name}`, ()=>{});
  }

  router.get("/state",(req,res)=>{
    const cfg = loadConfig();
    res.send({mode: fs.existsSync(STATE_FILE)?fs.readFileSync(STATE_FILE,"utf8"):"spindle", machine: machineState, config: cfg});
  });

  router.get("/toggle",(req,res)=>{
    if(["Run","Hold"].includes(machineState))
      return res.send({ok:false,error:"BUSY",machine:machineState});

    if(["Alarm","Door","Check"].includes(machineState))
      return res.send({ok:false,error:"NOT READY",machine:machineState});

    runPython();

    setTimeout(()=>{
      const mode = fs.readFileSync(STATE_FILE,"utf8").trim();
      const cfg = loadConfig();

      if(mode==="laser") loadWorkspace("laser_mode");
      else loadWorkspace("spindle_mode");

      res.send({ok:true,mode,machine:machineState,config:cfg});
    },800);
  });

  router.get("/config",(req,res)=>{
    res.send(loadConfig());
  });

  router.post("/config", express.json(), (req,res)=>{
    saveConfig(req.body);
    res.send({ok:true});
  });

  app.use("/mode-switch", router);

  setTimeout(()=>{
    const cfg = loadConfig();
    if(cfg.active?.laser) loadWorkspace("laser_mode");
    else loadWorkspace("spindle_mode");
  },2000);
};
