// Debloater WebUI (simple mode) - legacy bridge
(function(){
  function $(id){ return document.getElementById(id); }
  var out = $("out");
  var verEl = $("ver"), devEl = $("dev"), andEl = $("and"), rootEl = $("root");

  function setOutput(t){ out.textContent = String(t||""); out.scrollTop = out.scrollHeight; }
  function appendOutput(t){
    t = String(t||"");
    out.textContent = (out.textContent === "(ready)" ? "" : out.textContent) + t;
    out.scrollTop = out.scrollHeight;
  }
  function toast(msg){
    try{
      if(typeof window.toast==="function") return window.toast(String(msg));
      if(window.kernelsu && window.kernelsu.toast) return window.kernelsu.toast.call(window.kernelsu, String(msg));
      if(typeof kernelsu==="object" && kernelsu && kernelsu.toast) return kernelsu.toast.call(kernelsu, String(msg));
      if(window.ksu && window.ksu.toast) return window.ksu.toast.call(window.ksu, String(msg));
      if(typeof ksu==="object" && ksu && ksu.toast) return ksu.toast.call(ksu, String(msg));
    }catch(e){}
  }

  function getBridge(){
    try{
      if(window.kernelsu && window.kernelsu.exec) return window.kernelsu;
      if(typeof kernelsu==="object" && kernelsu && kernelsu.exec) return kernelsu;
      if(window.ksu && window.ksu.exec) return window.ksu;
      if(typeof ksu==="object" && ksu && ksu.exec) return ksu;
      if(window.Android && window.Android.exec){
        return {
          exec: function(cmd){ return window.Android.exec(cmd); },
          toast: function(msg){ try{ return window.Android.toast && window.Android.toast(String(msg)); }catch(e){} }
        };
      }
    }catch(e){}
    return null;
  }

  function execCmd(cmd, cb){
    var b = getBridge();
    if(!b || !b.exec) return cb({code:1, stdout:"", stderr:"KernelSU bridge not detected"});
    var fn = b.exec;

    // callback style
    if(typeof fn === "function" && fn.length >= 3){
      var cbName = "__deb_cb_" + Date.now() + "_" + Math.random().toString(16).slice(2);
      window[cbName] = function(code, stdout, stderr){
        try{ delete window[cbName]; }catch(e){}
        cb({ code: Number(code||0), stdout: String(stdout||""), stderr: String(stderr||"") });
      };
      try{ fn(cmd, "{}", cbName); }catch(e){
        try{ delete window[cbName]; }catch(_e){}
        cb({code:1, stdout:"", stderr:String(e && e.message ? e.message : e)});
      }
      return;
    }

    // sync
    try{
      var r = fn(cmd);
      cb({code:0, stdout:String(r||""), stderr:""});
    }catch(e){
      cb({code:1, stdout:"", stderr:String(e && e.message ? e.message : e)});
    }
  }

  function run(cmd, label){
    setOutput("(running) " + label + "\n\n$ " + cmd + "\n\n");
    execCmd(cmd, function(res){
      var combined = "";
      if(res.stdout) combined += String(res.stdout).replace(/\r/g,"");
      if(res.stderr) combined += (combined ? "\n" : "") + String(res.stderr).replace(/\r/g,"");
      combined = combined.replace(/\s+$/,"");
      appendOutput((combined ? combined : "(no output)") + "\n");
      if(res.code !== 0) toast("Error: " + label);
    });
  }

  function debloaterCmd(args){ var cmd = ("/system/bin/debloater " + args).replace(/\s+$/,""); return 'su -c "' + cmd.replace(/"/g, '\\\"') + '"' ; }

  function refreshStatus(){
    execCmd('sh -c \'for p in /data/adb/ksu/modules/debloater_systemless_x1/module.prop /data/adb/modules/debloater_systemless_x1/module.prop /data/adb/apatch/modules/debloater_systemless_x1/module.prop; do [ -f "$p" ] && grep -m1 "^version=" "$p" | cut -d= -f2- && exit 0; done; echo "unknown"\'', function(v){
      verEl.textContent = (v.stdout || "unknown").trim();
    });
    execCmd('getprop ro.product.model', function(d){ devEl.textContent = (d.stdout||"unknown").trim(); });
    execCmd('getprop ro.build.version.release', function(a){ andEl.textContent = (a.stdout||"unknown").trim(); });
    execCmd('id -u', function(r){ rootEl.textContent = (String(r.stdout||"").trim()==="0") ? "root" : "no"; });
  }

  $("runDefault").addEventListener("click", function(){ run(debloaterCmd("--default"), "Default Optimise"); });
  $("runBreeno").addEventListener("click", function(){ run(debloaterCmd("--breeno"), "Breeno Disable"); });
  $("runDns").addEventListener("click", function(){
    var mode = $("dnsMode").value || "adguard";
    run(debloaterCmd("--dns " + mode), "DNS Set");
  });

  $("clearOut").addEventListener("click", function(){ setOutput("(ready)"); });
  $("copyOut").addEventListener("click", function(){
    try{
      var ta = document.createElement("textarea");
      ta.value = out.textContent || "";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Copied");
    }catch(e){ toast("Copy failed"); }
  });

  refreshStatus();
})();
