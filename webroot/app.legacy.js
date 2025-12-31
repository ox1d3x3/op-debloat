// Debloater WebUI legacy (non-module) - v0.9.0
(function(){
  function $(id){ return document.getElementById(id); }

  var out = $("out");
  var out2 = $("out2");

  var verEl = $("ver"), devEl = $("dev"), andEl = $("and"), rootEl = $("root");
  var disEl = $("dis");

  var cardsMain = $("cardsMain");
  var outputMain = $("outputMain");
  var cardsDisabled = $("cardsDisabled");
  var outputDisabled = $("outputDisabled");

  var disabledSummary = $("disabledSummary");
  var disabledList = $("disabledList");

  var LOG_DIR = "/data/media/0/debloater";
  var DIS_TSV = LOG_DIR + "/webui_disabled.tsv";

  function setOutput(t){ out.textContent = String(t||""); out.scrollTop = out.scrollHeight; }
  function appendOutput(t){
    t = String(t||"");
    out.textContent = (out.textContent === "(ready)" ? "" : out.textContent) + t;
    out.scrollTop = out.scrollHeight;
  }

  function setOutput2(t){ out2.textContent = String(t||""); out2.scrollTop = out2.scrollHeight; }
  function appendOutput2(t){
    t = String(t||"");
    out2.textContent = (out2.textContent === "(ready)" ? "" : out2.textContent) + t;
    out2.scrollTop = out2.scrollHeight;
  }

  function toast(msg){
    try{
      if(typeof window.toast === "function") return window.toast(String(msg));
      if(window.kernelsu && window.kernelsu.toast) return window.kernelsu.toast.call(window.kernelsu, String(msg));
      if(window.ksu && window.ksu.toast) return window.ksu.toast.call(window.ksu, String(msg));
    }catch(e){}
  }

  function detectBridge(cb){
    if(window.kernelsu && window.kernelsu.exec) return cb(window.kernelsu);
    if(window.ksu && window.ksu.exec) return cb(window.ksu);
    if(window.Android && window.Android.exec) return cb(window.Android);
    cb(null);
  }

  function execCmd(bridge, cmd, cb){
    if(!bridge || !bridge.exec) return cb({code:1, stdout:"", stderr:"KernelSU bridge not detected"});
    try{
      if(typeof bridge.exec === "function" && bridge.exec.length >= 3){
        var cbName = "__deb_cb_"+Date.now()+"_"+Math.random().toString(16).slice(2);
        window[cbName] = function(code, stdout, stderr){
          try{ delete window[cbName]; }catch(e){}
          cb({code:Number(code||0), stdout:String(stdout||""), stderr:String(stderr||"")});
        };
        bridge.exec.call(bridge, cmd, "{}", cbName);
      }else{
        var r = bridge.exec.call(bridge, cmd);
        cb({code:0, stdout:String(r||""), stderr:""});
      }
    }catch(e){
      cb({code:1, stdout:"", stderr:String(e && e.message ? e.message : e)});
    }
  }

  function debloaterCmd(args){
    var cmd = ("/system/bin/debloater "+args).replace(/'/g, "'\\''").trim();
    return "su -c '"+cmd+"'";
  }

  function suCmd(inner){
    inner = String(inner||"").replace(/'/g, "'\\''");
    return "su -c '"+inner+"'";
  }

  function startJob(bridge, label, args, logName){
    var log = LOG_DIR+"/"+logName;
    setOutput("["+label+"] Starting...\n\nLog: "+log+"\n");
    var start = "su -c 'mkdir -p "+LOG_DIR+"; rm -f \""+log+"\"; ( (command -v nohup >/dev/null 2>&1 && nohup /system/bin/debloater "+args+" || /system/bin/debloater "+args+") > \""+log+"\" 2>&1; echo \"[exit=$?]\" >> \""+log+"\" ) & echo \"[pid=$!]\"'";
    execCmd(bridge, start, function(r){
      if(r.stderr) appendOutput("\n[stderr]\n"+r.stderr+"\n");
      if(r.stdout) appendOutput("\n"+r.stdout+"\n");
      tailUntilExit(bridge, log, 0);
    });
  }

  function tail(bridge, log, cb){
    var cmd = "su -c 'if [ -f \""+log+"\" ]; then tail -n 300 \""+log+"\"; else echo \"(log not created yet)\"; fi'";
    execCmd(bridge, cmd, cb);
  }

  function tailUntilExit(bridge, log, tries){
    if(tries > 240){ appendOutput("\n\n[WebUI] Timed out waiting for exit.\nOpen log: "+log+"\n"); toast("Done"); return; }
    tail(bridge, log, function(r){
      var text = (r.stdout||"") + (r.stderr ? ("\n[stderr]\n"+r.stderr) : "");
      setOutput(text||"(no output)");
      if(text.indexOf("[exit=") >= 0){ toast("Done"); return; }
      setTimeout(function(){ tailUntilExit(bridge, log, tries+1); }, 500);
    });
  }

  function runQuick(bridge, label, cmd){
    setOutput("["+label+"] Running...\n\n$ "+cmd+"\n\n");
    execCmd(bridge, cmd, function(r){
      var t = (r.stdout||"") + (r.stderr ? ("\n[stderr]\n"+r.stderr) : "");
      setOutput(t || "(no output)");
      toast("Done");
    });
  }

  function showMain(){
    cardsDisabled.classList.add("hidden");
    outputDisabled.classList.add("hidden");
    cardsMain.classList.remove("hidden");
    outputMain.classList.remove("hidden");
  }

  function showDisabled(){
    cardsMain.classList.add("hidden");
    outputMain.classList.add("hidden");
    cardsDisabled.classList.remove("hidden");
    outputDisabled.classList.remove("hidden");
    setOutput2("(ready)");
  }

  function escapeHtml(s){
    s = String(s||"");
    return s.replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];
    });
  }

  function renderDisabledRows(items){
    disabledList.innerHTML = "";
    if(!items.length){
      disabledList.innerHTML = '<div class="muted">No disabled apps found.</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    for(var i=0;i<items.length;i++){
      var it = items[i];
      var row = document.createElement("div");
      row.className = "listitem";
      row.innerHTML = '<input type="checkbox" class="chk" data-pkg="'+escapeHtml(it.pkg)+'" />'
        + '<div class="li-text">'
        + '<div class="li-label">'+escapeHtml(it.label)+'</div>'
        + '<div class="li-pkg">'+escapeHtml(it.pkg)+'</div>'
        + '</div>';
      frag.appendChild(row);
    }
    disabledList.appendChild(frag);
  }

  function generateDisabledTsv(bridge, cb){
    var script = "mkdir -p \""+LOG_DIR+"\"; out=\""+DIS_TSV+"\"; rm -f \"$out\"; "
      + "pm list packages -d 2>/dev/null | cut -d: -f2 | while IFS= read -r p; do "
      + "  [ -z \"$p\" ] && continue; "
      + "  lbl=$(dumpsys package \"$p\" 2>/dev/null | grep -m1 -E 'application-label(:|-[a-zA-Z_]+):' | sed 's/.*application-label[^:]*://'); "
      + "  lbl=$(echo \"$lbl\" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'); "
      + "  [ -z \"$lbl\" ] && lbl=\"$p\"; "
      + "  printf '%s\t%s\n' \"$lbl\" \"$p\" >> \"$out\"; "
      + "done; wc -l < \"$out\" 2>/dev/null || echo 0";
    execCmd(bridge, suCmd(script), cb);
  }

  function loadDisabledApps(bridge){
    disabledSummary.textContent = "Scanning disabled apps (this may take a bit)...";
    disabledList.innerHTML = '<div class="muted">Loading…</div>';
    setOutput2("[Quick Restore] Scanning disabled apps...\n");

    generateDisabledTsv(bridge, function(g){
      if(g.stderr) appendOutput2("\n[stderr]\n"+g.stderr+"\n");
      execCmd(bridge, "su -c 'if [ -f \""+DIS_TSV+"\" ]; then cat \""+DIS_TSV+"\"; fi'", function(read){
        var raw = String(read.stdout||"");
        var lines = raw.split(/\r?\n/);
        var items = [];
        for(var i=0;i<lines.length;i++){
          var line = lines[i];
          if(!line) continue;
          var idx = line.indexOf("\t");
          if(idx < 0) continue;
          var label = line.slice(0, idx).trim();
          var pkg = line.slice(idx+1).trim();
          if(pkg) items.push({label:label, pkg:pkg});
        }
        disabledSummary.textContent = "Total Disabled apps: "+items.length;
        if(disEl) disEl.textContent = String(items.length);
        items.sort(function(a,b){ return a.label.localeCompare(b.label); });
        renderDisabledRows(items);
        appendOutput2("\nFound "+items.length+" disabled app(s).\n");
      });
    });
  }

  function enablePackages(bridge, pkgs){
    if(!pkgs.length){ setOutput2("No apps selected.\n"); return; }
    setOutput2("[Quick Restore] Enabling "+pkgs.length+" app(s)...\n\n");
    var ok = 0, fail = 0;

    function step(i){
      if(i >= pkgs.length){
        appendOutput2("\n----\nEnabled: "+ok+"\nFailed: "+fail+"\n");
        toast("Done");
        loadDisabledApps(bridge);
        return;
      }
      var pkg = pkgs[i];
      var cmd = "su -c 'pm enable --user 0 \""+pkg+"\" 2>/dev/null && echo \"[OK] "+pkg+"\" || echo \"[FAIL] "+pkg+"\"'";
      execCmd(bridge, cmd, function(r){
        var txt = String((r.stdout || r.stderr || "")).trim();
        if(txt.indexOf("[OK]") >= 0) ok++; else fail++;
        appendOutput2(txt + "\n");
        setTimeout(function(){ step(i+1); }, 20);
      });
    }
    step(0);
  }

  function refreshStatus(bridge){
    var verCmd = "sh -c 'for p in /data/adb/ksu/modules/debloater_systemless_x1/module.prop /data/adb/modules/debloater_systemless_x1/module.prop /data/adb/apatch/modules/debloater_systemless_x1/module.prop; do [ -f \"$p\" ] && grep -m1 \"^version=\" \"$p\" | cut -d= -f2- && exit 0; done; echo \"unknown\"'";
    execCmd(bridge, verCmd, function(v){
      verEl.textContent = String(v.stdout||"unknown").trim();
      execCmd(bridge, "getprop ro.product.model", function(d){
        devEl.textContent = String(d.stdout||"unknown").trim() || "unknown";
        execCmd(bridge, "getprop ro.build.version.release", function(a){
          andEl.textContent = String(a.stdout||"unknown").trim() || "unknown";
          execCmd(bridge, "su -c 'id -u'", function(r){
            rootEl.textContent = (String(r.stdout||"").trim() === "0") ? "root" : "no";
            execCmd(bridge, "su -c 'pm list packages -d 2>/dev/null | grep -c \"^package:\" || echo 0'", function(dc){
              if(disEl) disEl.textContent = String(dc.stdout||"0").trim();
            });
          });
        });
      });
    });
  }

  detectBridge(function(bridge){
    if(!bridge){
      setOutput("[WebUI] KernelSU bridge not detected.\nOpen from KSU WebUI.\n");
      return;
    }

    // Buttons
    $("runDefault").addEventListener("click", function(){ startJob(bridge, "Default Optimise", "--default", "webui_default.log"); });
    $("runBreeno").addEventListener("click", function(){ startJob(bridge, "Breeno Disable", "--breeno", "webui_breeno.log"); });
    $("runDns").addEventListener("click", function(){
      var mode = $("dnsMode").value || "adguard";
      runQuick(bridge, "DNS set", debloaterCmd("--dns "+mode));
    });

    $("openDisabled").addEventListener("click", function(){ showDisabled(); loadDisabledApps(bridge); });
    $("backMain").addEventListener("click", function(){ showMain(); refreshStatus(bridge); });

    $("enableAll").addEventListener("click", function(){
      var boxes = disabledList.querySelectorAll('input[type="checkbox"]');
      var pkgs = [];
      for(var i=0;i<boxes.length;i++) pkgs.push(boxes[i].getAttribute("data-pkg"));
      enablePackages(bridge, pkgs);
    });

    $("enableSelected").addEventListener("click", function(){
      var boxes = disabledList.querySelectorAll('input[type="checkbox"]:checked');
      var pkgs = [];
      for(var i=0;i<boxes.length;i++) pkgs.push(boxes[i].getAttribute("data-pkg"));
      enablePackages(bridge, pkgs);
    });

    $("copyOut").addEventListener("click", function(){
      try{ navigator.clipboard.writeText(out.textContent||""); toast("Copied"); }catch(e){ toast("Copy failed"); }
    });
    $("clearOut").addEventListener("click", function(){ setOutput("(ready)"); });

    $("copyOut2").addEventListener("click", function(){
      try{ navigator.clipboard.writeText(out2.textContent||""); toast("Copied"); }catch(e){ toast("Copy failed"); }
    });
    $("clearOut2").addEventListener("click", function(){ setOutput2("(ready)"); });

    // Init
    refreshStatus(bridge);
  });
})();
