# Debloater – Oppo/ColorOS (CN) by Ox1d3x3

**Systemless, profile-based debloater for Oppo / OnePlus / Realme devices running ColorOS CN.**  
Instead of uninstalling apps, it uses `pm disable-user --user 0` so everything is **reversible** and **OTA-friendly**.

- ✅ Works with **Magisk**, **KernelSU**, and **APatch**
- ✅ Targets **ColorOS CN** bloat (Oppo/HeyTap ecosystem / CN extras)
- ✅ Debloat lists live in **`/sdcard/debloater`** (easy to edit)
- ✅ Includes **restore** options and **OTA updates**

---

## ✨ Features

- **Safe debloat via `pm disable-user --user 0`**
  - No APK deletion, no `/system` modification.
  - System apps are simply disabled for **user 0**.
- **Profile-based debloating**
  - All debloat rules live in `/sdcard/debloater/*.list`.
  - You can maintain different sets (minimal, aggressive, CN-only, etc.).
- **Systemless & root-manager agnostic**
  - Install as a standard module in **Magisk**, **KernelSU**, or **APatch**.
- **Interactive CLI (`debloater`)**
  - TUI menu for disabling/enabling packages using profiles.
  - Full restore from log if you went too far.
- **Restore options**
  - Restore **specific profile** (enable all packages listed).
  - Restore **everything this module disabled** by reading its own log.
  - Restore **default profiles** shipped with the module.
- **OTA-friendly**
  - Uses `updateJson` to support in-app updates from KernelSU / Magisk.
  - Also supports manual update check from CLI.

---

## ⚠️ Warnings & Disclaimer

- **You can still break stuff** by disabling the wrong packages.
  - Don’t blindly paste random online lists into `disable.list`.
  - Start with the **safe defaults** and test gradually.
- This module is focused on **Oppo / ColorOS CN** stacks (including some OnePlus/Realme CN builds).
  - Global ROMs may have different package names or dependencies.
- You are responsible for your own device:
  - Make backups where possible (e.g. TWRP / full backup).
  - If you don’t understand a package, **don’t disable it**.
- Root is required. Tested on Android 12–16 with Magisk / KernelSU style root managers.

Use at your own risk. No warranty, no guaranteed safety if you go wild with profiles.

---

## ✅ Requirements

- Rooted device with **one** of:
  - **Magisk 24+**
  - **KernelSU**
  - **APatch**
- Oppo / OnePlus / Realme device running **ColorOS CN** (or very close variant).
- Basic familiarity with:
  - Terminal / ADB shell
  - Editing text files on Android (e.g. via a file manager or Termux)

---

## 📦 Installation

### 1. Flash as a module

1. Download the latest release ZIP from the **Releases** page:

   - `Debloater-OppoColorOS-CN-by-Ox1d3x3-v0.3.6.zip` (or newer)

2. In your root manager:

   - **Magisk**:
     - Modules → Install from storage → pick the ZIP → reboot.
   - **KernelSU**:
     - Modules → Add → pick the ZIP → reboot.
   - **APatch**:
     - Install module from storage → reboot.

