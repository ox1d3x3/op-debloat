// Debloater WebUI (Simple + Quick Restore) - Ox1d3x3
// v0.9.2 - stable disabled list (no freezing) + cache-busting
const UI_VER = "v0.9.2";
const $ = (id) => document.getElementById(id);

// Top pills
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

// Output boxes
const out = $("out");
const out2 = $("out2");

// Disabled UI
const disabledSummary = $("disabledSummary");
const disabledList = $("disabledList");

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
  // Keep minimal: only for Copy errors/success; no "Done" popups.
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

// --- Navigation ---
function showMain() {
  cardsDisabled.classList.add("hidden");
  outputDisabled.classList.add("hidden");
  cardsMain.classList.remove("hidden");
  outputMain.classList.remove("hidden");
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

// --- Quick Restore files ---
const DIS_PKGS = `${LOG_DIR}/webui_disabled_pkgs.txt`;
const DIS_TSV  = `${LOG_DIR}/webui_disabled_labeled.tsv`;
const SCAN_LOG = `${LOG_DIR}/webui_disabled_scan.log`;
const LABEL_LOG = `${LOG_DIR}/webui_disabled_labels.log`;
const ENABLE_LOG = `${LOG_DIR}/webui_quick_enable.log`;
const ENABLE_LIST = `${LOG_DIR}/webui_quick_enable.list`;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
function cssEscape(s) {
  const str = String(s ?? "");
  try {
    if (globalThis.CSS && typeof CSS.escape === "function") return CSS.escape(str);
  } catch {}
  // Fallback: escape backslash and double-quote
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderDisabledRows(rows) {
  disabledList.innerHTML = "";
  if (!rows.length) {
    disabledList.innerHTML = `<div class="muted">No disabled apps found.</div>`;
    return;
  }

  // Chunked render to avoid UI jank if list is large
  const chunkSize = 30;
  let i = 0;

  const renderChunk = () => {
    const frag = document.createDocumentFragment();
    for (let n = 0; n < chunkSize && i < rows.length; n++, i++) {
      const r = rows[i];
      const pkg = r.pkg;
      const label = r.label || pkg;
      const row = document.createElement("div");
      row.className = "listitem";
      row.innerHTML = `
        <input class="chk" type="checkbox" data-pkg="${escapeHtml(pkg)}" />
        <div class="li-text">
          <div class="li-label" data-lbl-for="${escapeHtml(pkg)}">${escapeHtml(label)}</div>
          <div class="li-pkg">${escapeHtml(pkg)}</div>
        </div>
      `;
      frag.appendChild(row);
    }
    disabledList.appendChild(frag);
    if (i < rows.length) requestAnimationFrame(renderChunk);
  };

  requestAnimationFrame(renderChunk);
}

async function startPkgScan() {
  // Fast: packages only (no dumpsys)
  const script = `
mkdir -p "${LOG_DIR}" 2>/dev/null
rm -f "${DIS_PKGS}" "${SCAN_LOG}" 2>/dev/null
(
  echo "[Quick Restore] Scanning disabled packages..."
  pm list packages -d 2>/dev/null | cut -d: -f2 | sort > "${DIS_PKGS}"
  c=$(wc -l < "${DIS_PKGS}" 2>/dev/null || echo 0)
  echo "Found $c disabled package(s)."
  echo "[exit=0]"
) > "${SCAN_LOG}" 2>&1 &
echo "[pid=$!]"
`;
  return await execCmd(suCmd(script));
}

async function waitLogExit(logPath, targetOutSetter) {
  const start = Date.now();
  while (Date.now() - start < 60000) { // 60s for pkg scan
    const t = await execCmd(suCmd(`if [ -f "${logPath}" ]; then tail -n 120 "${logPath}"; else echo "(log not created yet)"; fi`));
    const text = (t.stdout || "") + (t.stderr ? `\n[stderr]\n${t.stderr}` : "");
    targetOutSetter(text || "(no output)");
    if (text.includes("[exit=")) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function readPkgsFile() {
  const r = await execCmd(suCmd(`if [ -f "${DIS_PKGS}" ]; then cat "${DIS_PKGS}"; fi`));
  const raw = String(r.stdout || "");
  return raw.split(/\r?\n/g).map((x) => x.trim()).filter(Boolean);
}

async function startLabelScan(pkgs) {
  // Background: build a labeled TSV for convenience. Does NOT block UI.
  // If this takes long, user still has full package list to restore from.
  const script = `
mkdir -p "${LOG_DIR}" 2>/dev/null
rm -f "${DIS_TSV}" "${LABEL_LOG}" 2>/dev/null
(
  echo "[Quick Restore] Resolving app labels (optional)..."
  echo "This may take a while. You can still enable using package list now."
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    lbl=$(dumpsys package "$p" 2>/dev/null | grep -m1 -E "application-label(:|-[a-zA-Z]{2,})" | sed "s/.*application-label[^:]*://")
    lbl=$(echo "$lbl" | sed "s/^[[:space:]]*//;s/[[:space:]]*$//")
    [ -z "$lbl" ] && lbl="$p"
    printf "%s\t%s\n" "$lbl" "$p" >> "${DIS_TSV}"
  done < "${DIS_PKGS}"
  echo "[exit=0]"
) > "${LABEL_LOG}" 2>&1 &
echo "[pid=$!]"
`;
  return await execCmd(suCmd(script));
}

async function tryApplyLabels() {
  // If label scan completed, read TSV and update labels in UI.
  const done = await execCmd(suCmd(`if [ -f "${LABEL_LOG}" ]; then tail -n 5 "${LABEL_LOG}"; fi`));
  const tail = String(done.stdout || "");
  if (!tail.includes("[exit=")) return false;

  const tsv = await execCmd(suCmd(`if [ -f "${DIS_TSV}" ]; then cat "${DIS_TSV}"; fi`));
  const raw = String(tsv.stdout || "");
  const lines = raw.split(/\r?\n/g).map((x) => x.trim()).filter(Boolean);

  const map = new Map();
  for (const line of lines) {
    const parts = line.split("\t");
    const label = (parts[0] ?? "").trim();
    const pkg = (parts[1] ?? "").trim();
    if (pkg) map.set(pkg, label || pkg);
  }

  // Update existing DOM labels without re-rendering whole list
  for (const [pkg, label] of map.entries()) {
    const el = disabledList.querySelector(`[data-lbl-for="${cssEscape(pkg)}"]`);
    if (el) el.textContent = label;
  }

  appendOutput2("\n[Quick Restore] Labels loaded.\n");
  return true;
}

async function loadDisabledApps() {
  disabledSummary.textContent = "Scanning disabled apps…";
  disabledList.innerHTML = `<div class="muted">Loading…</div>`;
  setOutput2("[Quick Restore] Starting…\n");

  // 1) Fast scan packages in background
  const start = await startPkgScan();
  if (start.stderr) appendOutput2(`\n[stderr]\n${start.stderr}\n`);
  if (start.stdout) appendOutput2(`\n${start.stdout}\n`);

  const ok = await waitLogExit(SCAN_LOG, setOutput2);
  if (!ok) {
    disabledSummary.textContent = "Scan timeout. Open output/log and try again.";
    return;
  }

  // 2) Render full list immediately (labels = package for now)
  const pkgs = await readPkgsFile();
  const rows = pkgs.map((p) => ({ label: p, pkg: p }));
  disabledSummary.textContent = `Total Disabled apps: ${rows.length}`;
  renderDisabledRows(rows);

  // Note: do NOT override the top-pill Disabled count here.

  appendOutput2(`\nFound ${rows.length} disabled app(s).\n`);

  // 3) Start optional label resolve in background (non-blocking)
  await startLabelScan(pkgs);

  // 4) Poll a few times to apply labels if it finishes quickly
  let polls = 0;
  const poller = async () => {
    polls += 1;
    // update output with label log tail (lightweight)
    const tl = await execCmd(suCmd(`if [ -f "${LABEL_LOG}" ]; then tail -n 40 "${LABEL_LOG}"; fi`));
    const txt = String(tl.stdout || "");
    if (txt) setOutput2(txt);

    const applied = await tryApplyLabels();
    if (applied) return;
    if (polls < 12) setTimeout(poller, 1500); // ~18s total
    else appendOutput2("\n[Quick Restore] Label resolve still running in background. List is usable now.\n");
  };
  setTimeout(poller, 1200);
}

async function startEnableJob(pkgs) {
  // Write package list to a file, then enable in one background job
  const escaped = pkgs.map((p) => p.replace(/"/g, "\\\"")).join("\\n");
  const script = `
mkdir -p "${LOG_DIR}" 2>/dev/null
rm -f "${ENABLE_LOG}" 2>/dev/null
cat > "${ENABLE_LIST}" <<'PKGS'\n${escaped}\nPKGS
(
  echo "[Quick Restore] Enabling ${pkgs.length} app(s)..."
  ok=0; fail=0
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if pm enable --user 0 "$p" >/dev/null 2>&1; then
      echo "[OK] $p"; ok=$((ok+1))
    else
      echo "[FAIL] $p"; fail=$((fail+1))
    fi
  done < "${ENABLE_LIST}"
  echo "----"
  echo "Enabled: $ok"
  echo "Failed: $fail"
  echo "[exit=0]"
) > "${ENABLE_LOG}" 2>&1 &
echo "[pid=$!]"
`;
  return await execCmd(suCmd(script));
}

async function enableSelected(mode) {
  const selector = mode === "all"
    ? 'input[type="checkbox"]'
    : 'input[type="checkbox"]:checked';

  const boxes = Array.from(disabledList.querySelectorAll(selector));
  const pkgs = boxes.map((b) => b.getAttribute("data-pkg")).filter(Boolean);

  if (!pkgs.length) {
    setOutput2("No apps selected.\n");
    return;
  }

  setOutput2("(ready)");
  const start = await startEnableJob(pkgs);
  if (start.stderr) appendOutput2(`\n[stderr]\n${start.stderr}\n`);
  if (start.stdout) appendOutput2(`\n${start.stdout}\n`);

  const ok = await waitLogExit(ENABLE_LOG, setOutput2);
  if (!ok) appendOutput2("\n[WebUI] Enable job timeout.\n");

  // Refresh list after enabling
  await loadDisabledApps();
}

async function runQuick(label, cmd) {
  setOutput(`[${label}] Running...\n\n$ ${cmd}\n\n`);
  const r = await execCmd(cmd);
  const outText = (r.stdout || "") + (r.stderr ? `\n[stderr]\n${r.stderr}` : "");
  setOutput(outText || "(no output)");
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

    // Disabled apps count (fast, authoritative)
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

$("openDisabled")?.addEventListener("click", showDisabled);
$("backMain")?.addEventListener("click", showMain);

$("enableAll")?.addEventListener("click", async () => {
  await enableSelected("all");
});

$("enableSelected")?.addEventListener("click", async () => {
  await enableSelected("selected");
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
