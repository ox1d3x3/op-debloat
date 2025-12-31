// Debloater WebUI (Simple) - Ox1d3x3
// v0.9.4 - Full Restore (hard-coded) + stable exec bridge
const UI_VER = "v0.9.4";
const $ = (id) => document.getElementById(id);

// Top pills
const verEl = $("ver");
const devEl = $("dev");
const andEl = $("and");
const rootEl = $("root");
const disEl = $("dis");

// Output box
const out = $("out");

function setOutput(text) {
  out.textContent = String(text ?? "");
  out.scrollTop = out.scrollHeight;
}
function appendOutput(text) {
  const t = String(text ?? "");
  out.textContent = (out.textContent === "(ready)" ? "" : out.textContent) + t;
  out.scrollTop = out.scrollHeight;
}

function toast(msg) {
  // Keep minimal: only for Copy errors/success; no noisy popups.
  try {
    if (typeof window.toast === "function") return window.toast(String(msg));
    if (globalThis.kernelsu?.toast) return globalThis.kernelsu.toast.call(globalThis.kernelsu, String(msg));
    if (globalThis.ksu?.toast) return globalThis.ksu.toast.call(globalThis.ksu, String(msg));
  } catch {}
}

// --- Bridge detection (no import; avoids module import failures) ---
function getBridge() {
  if (globalThis.kernelsu?.exec) return globalThis.kernelsu;
  if (globalThis.ksu?.exec) return globalThis.ksu;
  if (globalThis.Android?.exec) return globalThis.Android;
  return null;
}

async function execCmd(cmd) {
  const bridge = getBridge();
  if (!bridge?.exec) throw new Error("KernelSU WebUI bridge not detected");

  const execFn = bridge.exec;

  // Callback style: exec(cmd, "{}", "callbackName")
  if (typeof execFn === "function" && execFn.length >= 3) {
    return await new Promise((resolve) => {
      const cbName = "__deb_cb_" + Date.now() + "_" + Math.random().toString(16).slice(2);
      window[cbName] = (code, stdout, stderr) => {
        try { delete window[cbName]; } catch {}
        resolve({
          code: Number(code ?? 0),
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
        });
      };
      try {
        execFn.call(bridge, cmd, "{}", cbName);
      } catch (e) {
        try { delete window[cbName]; } catch {}
        resolve({ code: 1, stdout: "", stderr: String(e?.message ?? e) });
      }
    });
  }

  // Sync string / Promise style
  try {
    let r = execFn.call(bridge, cmd);
    if (r && typeof r.then === "function") r = await r;
    return { code: 0, stdout: String(r ?? ""), stderr: "" };
  } catch (e) {
    return { code: 1, stdout: "", stderr: String(e?.message ?? e) };
  }
}

function suCmd(inner) {
  const safe = String(inner ?? "").replace(/'/g, `'\\''`);
  return `su -c '${safe}'`;
}

function debloaterCmd(args) {
  const cmd = (`/system/bin/debloater ${args}`).trim();
  const safe = cmd.replace(/'/g, `'\\''`);
  return `su -c '${safe}'`;
}

// --- Background job helpers (stdout-safe) ---
const LOG_DIR = "/data/media/0/debloater";

async function tailLog(log, lines = 350) {
  return await execCmd(suCmd(`if [ -f "${log}" ]; then tail -n ${lines} "${log}"; else echo "(log not created yet)"; fi`));
}

async function tailLogUntilExit(log) {
  let tries = 0;
  while (tries < 240) { // ~120s
    const r = await tailLog(log, 350);
    const text = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
    setOutput(text || "(no output)");
    if (text.includes("[exit=")) return;
    await new Promise((res) => setTimeout(res, 500));
    tries += 1;
  }
  appendOutput(`\n\n[WebUI] Timed out waiting for exit.\nOpen log: ${log}\n`);
}

async function startJob(label, args, logName) {
  const log = `${LOG_DIR}/${logName}`;
  setOutput(`[${label}] Starting...\n\nLog: ${log}\n`);

  const start =
    `su -c 'mkdir -p ${LOG_DIR}; rm -f "${log}"; ` +
    `( (command -v nohup >/dev/null 2>&1 && nohup /system/bin/debloater ${args} || /system/bin/debloater ${args}) > "${log}" 2>&1; ` +
    `echo "[exit=$?]" >> "${log}" ) & echo "[pid=$!]"'`;

  const r = await execCmd(start);
  if (r.stderr) appendOutput(`\n[stderr]\n${r.stderr}\n`);
  if (r.stdout) appendOutput(`\n${r.stdout}\n`);
  await tailLogUntilExit(log);
}

async function runQuick(label, cmd) {
  setOutput(`[${label}] Running...\n\n$ ${cmd}\n\n`);
  const r = await execCmd(cmd);
  const outText = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
  setOutput(outText || "(no output)");
}

async function refreshStatus() {
  try {
    // Read module version from any supported manager path
    const verCmd = `sh -c 'for p in /data/adb/ksu/modules/debloater_systemless_x1/module.prop /data/adb/modules/debloater_systemless_x1/module.prop /data/adb/apatch/modules/debloater_systemless_x1/module.prop; do [ -f "$p" ] && grep -m1 "^version=" "$p" | cut -d= -f2- && exit 0; done; echo "unknown"'`;
    const v = await execCmd(verCmd);
    verEl.textContent = (v.stdout || "unknown").trim();

    const d = await execCmd("getprop ro.product.model");
    devEl.textContent = (d.stdout || "unknown").trim() || "unknown";

    const a = await execCmd("getprop ro.build.version.release");
    andEl.textContent = (a.stdout || "unknown").trim() || "unknown";

    const r = await execCmd("su -c 'id -u'");
    rootEl.textContent = (String(r.stdout || "").trim() === "0") ? "root" : "no";

    // Disabled apps count (fast)
    const dc = await execCmd("su -c 'pm list packages -d 2>/dev/null | grep -c \"^package:\" || echo 0'");
    if (disEl) disEl.textContent = (dc.stdout || "0").trim();
  } catch (e) {
    verEl.textContent = UI_VER;
    devEl.textContent = "unknown";
    andEl.textContent = "unknown";
    rootEl.textContent = "unknown";
    if (disEl) disEl.textContent = "0";
    appendOutput(`\n[WebUI] Status error: ${String(e?.message ?? e)}\n`);
  }
}

// --- Wire buttons ---
$("runDefault")?.addEventListener("click", async () => {
  await startJob("Default Optimise", "--default", "webui_default.log");
});

$("runBreeno")?.addEventListener("click", async () => {
  await startJob("Breeno Disable", "--breeno", "webui_breeno.log");
});

$("runDns")?.addEventListener("click", async () => {
  const mode = $("dnsMode")?.value || "adguard";
  await runQuick("DNS set", debloaterCmd(`--dns ${mode}`));
});

$("runFullRestore")?.addEventListener("click", async () => {
  await startJob("Full Restore", "--full-restore", "webui_full_restore.log");
});

$("copyOut")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(out.textContent || "");
    toast("Copied");
  } catch {
    toast("Copy failed");
  }
});

$("clearOut")?.addEventListener("click", () => setOutput("(ready)"));

// Init
refreshStatus();
