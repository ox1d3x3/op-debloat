// Debloater WebUI (Simple) - Ox1d3x3
// Stable KSU bridge + background log runner
const UI_VER = "v0.9.0";

const $ = (id) => document.getElementById(id);

const out = $("out");
const verEl = $("ver");
const devEl = $("dev");
const andEl = $("and");
const rootEl = $("root");
const disEl = $("dis");

// Views
const cardsMain = $("cardsMain");
const outputMain = $("outputMain");
const cardsDisabled = $("cardsDisabled");
const outputDisabled = $("outputDisabled");

// Disabled apps UI
const disabledSummary = $("disabledSummary");
const disabledList = $("disabledList");
const out2 = $("out2");

function setOutput(text) {
  out.textContent = String(text ?? "");
  out.scrollTop = out.scrollHeight;
}
function appendOutput(text) {
  const t = String(text ?? "");
  out.textContent = (out.textContent === "(ready)" ? "" : out.textContent) + t;
  out.scrollTop = out.scrollHeight;
}

function setOutput2(text) {
  out2.textContent = String(text ?? "");
  out2.scrollTop = out2.scrollHeight;
}
function appendOutput2(text) {
  const t = String(text ?? "");
  out2.textContent = (out2.textContent === "(ready)" ? "" : out2.textContent) + t;
  out2.scrollTop = out2.scrollHeight;
}
function toast(msg) {
  try {
    if (typeof window.toast === "function") return window.toast(String(msg));
    if (globalThis.kernelsu?.toast) return globalThis.kernelsu.toast.call(globalThis.kernelsu, String(msg));
    if (globalThis.ksu?.toast) return globalThis.ksu.toast.call(globalThis.ksu, String(msg));
  } catch {}
}

async function detectBridge() {
  if (globalThis.kernelsu?.exec) return globalThis.kernelsu;
  if (globalThis.ksu?.exec) return globalThis.ksu;

  try {
    const mod = await import("kernelsu");
    if (mod?.exec) return mod;
    if (mod?.default?.exec) return mod.default;
    return mod;
  } catch {}

  if (globalThis.Android?.exec) return globalThis.Android;

  return null;
}

const bridgePromise = detectBridge();

async function execCmd(cmd) {
  const bridge = await bridgePromise;
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

function debloaterCmd(args) {
  const cmd = (`/system/bin/debloater ${args}`).trim();
  // escape single quotes for su -c '...'
  const safe = cmd.replace(/'/g, `'\\''`);
  return `su -c '${safe}'`;
}

function suCmd(inner) {
  const safe = String(inner ?? "").replace(/'/g, `'\\''`);
  return `su -c '${safe}'`;
}

// --- Background job runner (prevents WebUI stdout limits from breaking big loops) ---
const LOG_DIR = "/data/media/0/debloater";

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

async function tailLog(log, lines = 300) {
  const cmd = `su -c 'if [ -f "${log}" ]; then tail -n ${lines} "${log}"; else echo "(log not created yet)"; fi'`;
  return await execCmd(cmd);
}

async function tailLogUntilExit(log) {
  let tries = 0;
  while (tries < 240) { // ~120s (0.5s)
    const r = await tailLog(log, 300);
    const text = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
    setOutput(text || "(no output)");
    if (text.includes("[exit=")) {
      toast("Done");
      return;
    }
    await new Promise((res) => setTimeout(res, 500));
    tries += 1;
  }
  appendOutput(`\n\n[WebUI] Timed out waiting for exit.\nOpen log: ${log}\n`);
  toast("Done");
}

function showMain() {
  cardsDisabled.classList.add("hidden");
  outputDisabled.classList.add("hidden");
  cardsMain.classList.remove("hidden");
  outputMain.classList.remove("hidden");
  // refresh top pills
  refreshStatus();
}

function showDisabled() {
  cardsMain.classList.add("hidden");
  outputMain.classList.add("hidden");
  cardsDisabled.classList.remove("hidden");
  outputDisabled.classList.remove("hidden");
  setOutput2("(ready)");
  loadDisabledApps();
}

const DIS_TSV = `${LOG_DIR}/webui_disabled.tsv`;

async function generateDisabledTsv() {
  // Generates: label<TAB>package per line, writes to DIS_TSV
  const gen =
    `su -c 'mkdir -p "${LOG_DIR}"; out="${DIS_TSV}"; rm -f "$out"; ` +
    `pm list packages -d 2>/dev/null | cut -d: -f2 | while IFS= read -r p; do ` +
    `  [ -z "$p" ] && continue; ` +
    `  lbl=$(dumpsys package "$p" 2>/dev/null | grep -m1 -E "application-label(:|-[a-zA-Z]{2,})" | sed "s/.*application-label[^:]*://"); ` +
    `  lbl=$(echo "$lbl" | sed "s/^[[:space:]]*//;s/[[:space:]]*$//"); ` +
    `  [ -z "$lbl" ] && lbl="$p"; ` +
    `  printf "%s\t%s\n" "$lbl" "$p" >> "$out"; ` +
    `done; wc -l < "$out" 2>/dev/null || echo 0'`;
  return await execCmd(gen);
}

function renderDisabledRows(rows) {
  disabledList.innerHTML = "";
  if (!rows.length) {
    disabledList.innerHTML = `<div class="muted">No disabled apps found.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const pkg = r.pkg;
    const label = r.label || pkg;
    const row = document.createElement("div");
    row.className = "listitem";
    row.innerHTML = `
      <input class="chk" type="checkbox" data-pkg="${pkg.replace(/"/g, "&quot;")}" />
      <div class="li-text">
        <div class="li-label">${escapeHtml(label)}</div>
        <div class="li-pkg">${escapeHtml(pkg)}</div>
      </div>
    `;
    frag.appendChild(row);
  }
  disabledList.appendChild(frag);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

async function loadDisabledApps() {
  disabledSummary.textContent = "Scanning disabled apps (this may take a bit)...";
  disabledList.innerHTML = `<div class="muted">Loading…</div>`;
  setOutput2("[Quick Restore] Scanning disabled apps...\n");

  // Step 1: generate TSV
  const g = await generateDisabledTsv();
  if (g.stderr) appendOutput2(`\n[stderr]\n${g.stderr}\n`);

  // Step 2: read TSV
  const read = await execCmd(`su -c 'if [ -f "${DIS_TSV}" ]; then cat "${DIS_TSV}"; fi'`);
  const raw = String(read.stdout || "");
  const lines = raw.split(/\r?\n/g).map((x) => x.trim()).filter(Boolean);

  const rows = [];
  for (const line of lines) {
    const parts = line.split("\t");
    const label = (parts[0] ?? "").trim();
    const pkg = (parts[1] ?? "").trim();
    if (pkg) rows.push({ label, pkg });
  }

  disabledSummary.textContent = `Total Disabled apps: ${rows.length}`;
  if (disEl) disEl.textContent = String(rows.length);
  renderDisabledRows(rows);

  appendOutput2(`\nFound ${rows.length} disabled app(s).\n`);
}

async function enablePackages(pkgs) {
  if (!pkgs.length) {
    setOutput2("No apps selected.\n");
    return;
  }
  setOutput2(`[Quick Restore] Enabling ${pkgs.length} app(s)...\n\n`);

  let ok = 0;
  let fail = 0;
  for (const pkg of pkgs) {
    const cmd = `su -c 'pm enable --user 0 "${pkg}" 2>/dev/null && echo "[OK] ${pkg}" || echo "[FAIL] ${pkg}"'`;
    const r = await execCmd(cmd);
    const txt = (r.stdout || r.stderr || "").trim();
    if (txt.includes("[OK]")) ok++;
    else fail++;
    appendOutput2(txt + "\n");
  }
  appendOutput2(`\n----\nEnabled: ${ok}\nFailed: ${fail}\n`);
  toast("Done");
  await loadDisabledApps();
}

async function runQuick(label, cmd) {
  setOutput(`[${label}] Running...\n\n$ ${cmd}\n\n`);
  const r = await execCmd(cmd);
  const outText = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
  setOutput(outText || "(no output)");
  toast("Done");
}

async function refreshStatus() {
  try {
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
    try {
      const dc = await execCmd("su -c 'pm list packages -d 2>/dev/null | grep -c \"^package:\" || echo 0'");
      if (disEl) disEl.textContent = (dc.stdout || "0").trim();
    } catch {
      if (disEl) disEl.textContent = "0";
    }
  } catch (e) {
    verEl.textContent = UI_VER;
    devEl.textContent = "unknown";
    andEl.textContent = "unknown";
    rootEl.textContent = "unknown";
    appendOutput(`\n[WebUI] Status error: ${String(e?.message ?? e)}\n`);
  }
}

// Buttons
$("runDefault").addEventListener("click", async () => {
  await startJob("Default Optimise", "--default", "webui_default.log");
});

$("runBreeno").addEventListener("click", async () => {
  await startJob("Breeno Disable", "--breeno", "webui_breeno.log");
});

$("runDns").addEventListener("click", async () => {
  const mode = $("dnsMode").value || "adguard";
  await runQuick("DNS set", debloaterCmd(`--dns ${mode}`));
});

// Quick restore (disabled apps)
$("openDisabled")?.addEventListener("click", () => showDisabled());
$("backMain")?.addEventListener("click", () => showMain());

$("enableAll")?.addEventListener("click", async () => {
  // enable everything listed
  const boxes = Array.from(disabledList.querySelectorAll('input[type="checkbox"]'));
  const pkgs = boxes.map((b) => b.getAttribute("data-pkg")).filter(Boolean);
  await enablePackages(pkgs);
});

$("enableSelected")?.addEventListener("click", async () => {
  const boxes = Array.from(disabledList.querySelectorAll('input[type="checkbox"]:checked'));
  const pkgs = boxes.map((b) => b.getAttribute("data-pkg")).filter(Boolean);
  await enablePackages(pkgs);
});

$("copyOut").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(out.textContent || "");
    toast("Copied");
  } catch {
    toast("Copy failed");
  }
});

$("clearOut").addEventListener("click", () => setOutput("(ready)"));

$("copyOut2")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(out2.textContent || "");
    toast("Copied");
  } catch {
    toast("Copy failed");
  }
});

$("clearOut2")?.addEventListener("click", () => setOutput2("(ready)"));

// Init
refreshStatus();
