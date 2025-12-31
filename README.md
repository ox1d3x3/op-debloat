<p align="center">
  <!-- Put your logo in the repo at: assets/logo.png -->
  <img src="assets/logo.png" alt="Debloater by X1" width="260" />
</p>

<h1 align="center">Debloater by X1</h1>

<p align="center">
  Systemless debloater module for <b>Oppo / OnePlus / Realme</b> devices running <b>ColorOS CN</b>.<br/>
  <sub>Disable CN bloat + Breeno/AI, keep it OTA-friendly, and restore easily.</sub>
</p>

<p align="center">
  <img alt="Android" src="https://img.shields.io/badge/Android-10%2B-3DDC84?style=for-the-badge" />
  <img alt="Root" src="https://img.shields.io/badge/Root-Magisk%20%7C%20KernelSU-111111?style=for-the-badge" />
  <img alt="ROM" src="https://img.shields.io/badge/ROM-ColorOS%20CN-2D6BFF?style=for-the-badge" />
  <img alt="Mode" src="https://img.shields.io/badge/Mode-Systemless-111111?style=for-the-badge" />
  <img alt="Downloads" src="https://img.shields.io/github/downloads/ox1d3x3/op-debloat/total?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://github.com/ox1d3x3/op-debloat/releases">Releases</a> •
  <a href="#features">Features</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#installation">Installation</a> •
  <a href="#webui-kernelsu">WebUI (KernelSU)</a> •
  <a href="#first-run--folder-layout">Folder Layout</a> •
  <a href="#logging--troubleshooting">Troubleshooting</a> •
  <a href="#changelog">Changelog</a> •
  <a href="#disclaimer">Disclaimer</a>
</p>

---

## About

Systemless debloater module for **Oppo / OnePlus / Realme** devices running **ColorOS CN** (tested on ColorOS 16 CN, Android 16) with root via **Magisk** or **KernelSU**.

The module disables common CN bloat, ads, and Breeno/AI components using `pm disable` and `cmd package suspend`, while keeping everything **OTA-safe** by not modifying `/system` directly. All configuration lives under:

```text
/sdcard/debloater
```

You control behaviour via simple text profiles (`*.list`) and a TUI-style shell menu.

---

## Features

- ✅ **Systemless**
  - Installed as a Magisk / KernelSU module.
  - Only drops a `debloater` binary into `system/bin` via overlay.
  - Uses `pm disable/enable` and `cmd package suspend/unsuspend` (no direct `/system` patching).

- 🎯 **Default Optimise Apps**
  - Curated set of **CN ads, store, browser, media, and ecosystem apps**.
  - Applied via option **1 – Default Optimise apps**.

- 🧠 **Force Breeno Disable**
  - Disables core **Breeno/AI** components (speech assist, AI unit, widgets, deepthinker, etc.).
  - Applied via option **3 – Force Breeno Disable**.

- 🌐 **DNS Set (Private DNS helper)**
  - Quick Private DNS presets (fast + reliable).

- ♻️ **Safe full restore**
  - `disabled.list` keeps track of packages that **this module actually disabled**.
  - Full restore option can re-enable everything from that log (with fallback to `disable.list` if empty).

- 📂 **Profile-based debloat / restore**
  - Uses `.list` files in `/sdcard/debloater`:
    - `disable.list`, `cn_ecosystem.list`, `breeno_minimal.list`, `disabled.list`, `enabled.list`, `coloros16_reference.list`, `CN_bloat-list.list`.
  - Profiles are auto-created on first run and fully user-editable.

- 🪵 **Debug logging**
  - Detailed log at:
    - `debloater_debug.log` in `/sdcard/debloater`
  - Logs profile processing, pm/cmd calls, return codes, and statuses.

---

## Requirements

- Rooted device with:
  - **Magisk** or **KernelSU** (APatch should also work if it exposes `/system/bin` in a similar way).
- **ColorOS CN ROM** (tested on ColorOS 16 CN; should be fine on closely related ColorOS-based builds, but YMMV).
- A root-capable shell, e.g.:
  - Termux (F-Droid recommended) or any other terminal app.

> ⚠️ **Warning:** Debloating system apps always carries some risk. While this module tries to be conservative and reversible, you are responsible for your own device. Always keep backups and know how to recover (fastboot / recovery / full OTA).

---

## Installation

1. Download the latest release ZIP from **GitHub Releases**.
2. Flash it in **Magisk** or **KernelSU**:
   - Modules → Install from storage
3. Reboot.
4. Open **Termux** (or any terminal) and run:

```sh
su
debloater
```

This launches the interactive menu.

---

## WebUI (KernelSU)

KernelSU users can open:

**KernelSU → Modules → Debloater → WebUI**

The WebUI is intentionally **simple and stable**.

If you want more customisation, profiles, or deeper restore logic, use **Termux (terminal mode)**.

---

## First Run & Folder Layout

On first run, the script ensures:

```text
/sdcard/debloater/
  disable.list
  cn_ecosystem.list
  breeno_minimal.list
  coloros16_reference.list
  enabled.list
  disabled.list
  CN_bloat-list.list
  debloater_debug.log        (created after actual use)
```

### Profile overview

- `disable.list`
  - Default “safe-ish” disable profile for ColorOS 16 CN.

- `cn_ecosystem.list`
  - Extended ecosystem profile (user editable).

- `breeno_minimal.list`
  - Minimal Breeno / AI reference list.

- `coloros16_reference.list`
  - Documentation-only reference file.

- `disabled.list`
  - Dynamic log of packages that **this module actually disabled**.

- `enabled.list`
  - Dynamic log of packages that were successfully re-enabled via this module.

- `CN_bloat-list.list`
  - Categorised reference list of CN bloat, intended as a master reference.

---

## Main Menu & Options

After `su` → `debloater`, you’ll see:

```text
Main menu
---------
  1. Default Optimise apps (Default selected apps)
  2. Disable Packages (Manual using disable or disabled list)
  3. Force Breeno Disable (Disable all Breeno AI packages)
  4. Restore Packages (Manual restore from enable or enabled list)
  5. Full Restore (Use disabled list / default optimised apps to restore)
  6. List All installed Packages
  7. List all disabled packages
  8. Check updates
  0. Exit
```

---

## Customising Profiles

Edit `.list` files in `/sdcard/debloater` with any text editor.

Rules:
- One package per line
- `#` comments are ignored
- Blank lines are ignored

Example:
```text
# Example extra package
com.example.cn.socialapp
```

---

## Logging & Troubleshooting

Debug log:
```text
/sdcard/debloater/debloater_debug.log
```

If something behaves strangely, reproduce it then check the log for the package name + return codes.

---

## OTA Behaviour

- The module itself is **systemless**, and survives OTAs as long as your root solution does.
- However, **ColorOS may re-enable some apps** after OTAs or major updates.
- If that happens, re-run:
  - Default Optimise
  - Force Breeno Disable

---

## Disclaimer

This tool is provided “as is”, without warranty. Debloating always has risk.
You are responsible for what you disable. Always keep a recovery path (OTA package / fastboot / backups).