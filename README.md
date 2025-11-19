# Debloater – Oppo/ColorOS (CN) by Ox1d3x3

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

- 📂 **Profile-based debloat / restore**
  - Uses `.list` files in `/sdcard/debloater`:
    - `disable.list`, `cn_ecosystem.list`, `breeno_minimal.list`, `disabled.list`, `enabled.list`, `coloros16_reference.list`, `CN_bloat-list.list`.
  - Profiles are auto-created on first run and fully user-editable.

- 🔁 **Safe full restore**
  - `disabled.list` keeps track of packages that **this module actually disabled**.
  - Full restore option can re-enable everything from that log (with fallback to `disable.list` if empty).

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
  - [Termux](https://f-droid.org/) or any other terminal app.

> ⚠️ **Warning:** Debloating system apps always carries some risk. While this module tries to be conservative and reversible, you are responsible for your own device. Always keep backups and know how to recover (fastboot / recovery / full OTA).

---

## Installation

1. Download the latest release ZIP:
   https://github.com/ox1d3x3/op-debloat/releases/

2. Open **Magisk** or **KernelSU** app:
   - Go to **Modules** → **Install from storage**.
   - Select the Debloater ZIP.

3. Flash:
   - Confirm the install.
   - You’ll see an install banner with **device model**, **Android version**, and `List dir: /sdcard/debloater`.

4. Reboot your device.

5. Open **Termux** (or any terminal) and run:

   ```sh
   su
   debloater
   ```

   This launches the interactive menu.

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
  - Contains ads, store, CN browsers, media, and Oppo ecosystem extras.

- `cn_ecosystem.list`
  - Extended ecosystem profile.
  - Initially mirrors `disable.list`.
  - Intended for more aggressive debloat; fully user-editable.

- `breeno_minimal.list`
  - List of core Breeno / AI components.
  - Used as a package reference; can also be applied via profile-based actions.

- `coloros16_reference.list`
  - Documentation-only reference file.
  - You can populate it manually with `pm list packages` output or notes.

- `disabled.list`
  - Dynamic log of packages that **this module actually disabled**.
  - Updated automatically when disable operations succeed.
  - Used by full restore and manual restore actions.

- `enabled.list`
  - Dynamic log of packages that were successfully re-enabled via this module.
  - Can also be manually edited for custom restore sets.

- `CN_bloat-list.list`
  - **New in v0.5.0.**
  - Categorised reference list of CN bloat:
    - Ads & Store  
    - CN Browser / Web  
    - CN Media & Extras  
    - Ecosystem & Services  
    - Breeno / AI  
  - Intended as a **master reference** to copy from into `disable.list` or `cn_ecosystem.list`.

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

### 1. Default Optimise apps

- Applies a **hardcoded curated set** of CN bloat:
  - Ads (`com.opos.ads`, `com.heytap.market`)
  - CN browser (HeyTap & ColorOS browser)
  - CN media (music, reader, pictorial, video, karaoke)
  - Ecosystem extras (accessory, mydevices, VIP, yoli, content portal, Omoji, car-related services, etc.)

- For each package:
  - Runs:
    - `pm disable-user --user 0 <pkg>`
    - `pm disable <pkg>`
    - `cmd package suspend --user 0 <pkg>`
  - Logs success/failure.
  - On success, appends to `disabled.list` (if not already present).

### 2. Disable Packages (Manual)

Uses your own `.list` profiles.

Flow:

1. Choose source list:

   ```text
   1) disable.list        (Default disable set - ColorOS 16 CN)
   2) disabled.list       (Dynamic log of actually disabled apps)
   3) cn_ecosystem.list   (Extended CN ecosystem - user editable)
   4) breeno_minimal.list (Breeno / AI minimal)
   0) Back
   ```

2. The module:
   - Parses the selected file (strips comments, CRLF, whitespace, empties).
   - Converts it into a space-separated package list.
   - Loops with a simple `for pkg in $list` and applies the same triple-disable logic used by Default Optimise.

3. At the end, it prints a summary:
   - `targets`
   - `likely disabled/suspended`
   - `skipped (not installed)`
   - `unknown/fail`

### 3. Force Breeno Disable

- Disables all **Breeno / AI** components via the same triple-disable logic.
- Targets packages like:
  - `com.heytap.speechassist`
  - `com.oplus.ovoicemanager`, `com.oplus.ovoicemanager.wakeup`
  - `com.oplus.aicall`, `com.oplus.aiwriter`, `com.oplus.aiwidgets`, `com.oplus.aiunit`
  - `com.oplus.obrain`, `com.oplus.deepthinker`, `com.oplus.metis`, `com.oplus.matrix`, `com.oplus.atlas`
- Successful disables are recorded in `disabled.list`.

> Note: Some ROMs may resurrect parts of Breeno/AI after OTA or major updates. Simply re-run option 3 if it comes back.

### 4. Restore Packages (Manual)

Restores packages based on your chosen list.

Menu:

```text
  1) enabled.list   (Manual restore helper list)
  2) disabled.list  (Everything this module has disabled)
  3) disable.list   (Default profile - restore those)
  0) Back
```

- Uses the same profile parsing logic as disable.
- For each package:
  - Runs:
    - `pm enable <pkg>`
    - `pm enable --user 0 <pkg>`
    - `cmd package unsuspend --user 0 <pkg>`
  - On success, appends to `enabled.list`.

### 5. Full Restore

Best-effort “undo” of what the module did.

Flow:

1. If `disabled.list` **contains any actual entries**:
   - Uses `disabled.list` as the restore profile.
2. Otherwise:
   - Falls back to `disable.list` (restores the default bloat set if you previously disabled it).

Then calls `apply_enable_from_profile()` under the hood and prints a summary.

### 6. List All installed Packages

- Convenience wrapper:
  - `pm list packages | sed 's/^package://' | sort`

### 7. List all disabled packages

- Convenience wrapper:
  - `pm list packages -d | sed 's/^package://' | sort`

### 8. Check updates

- Shows:
  - Current version
  - Module ID
  - GitHub handle (`@ox1d3x3`) so you can check manually for new releases.

---

## Customising Profiles

You can edit `.list` files with any text editor (e.g. a file manager + text editor app, or `nano`/`vim` in Termux).

Rules:

- One package name per line.
- Lines beginning with `#` are comments and ignored.
- Blank lines are ignored.
- Mixed case doesn’t matter in comments; package names must be exact (`com.vendor.app`).

Examples:

**Add extra bloat to disable:**

```text
# Extra CN social app
com.example.cn.socialapp
```

**Temporarily disable a line:**

```text
# com.example.cn.socialapp
```

After editing, simply run `debloater` and use:

- Option **2** (Disable Packages) → appropriate list, _or_
- Option **1** if you’ve extended `disable.list` and want to reuse Default Optimise as your base plus your extras.

---

## Logging & Troubleshooting

All debug logs go to:

```text
/sdcard/debloater/debloater_debug.log
```

The log includes:

- Which profile was used.
- Which packages were parsed from each file.
- Each call to:
  - `pm disable-user`
  - `pm disable`
  - `cmd package suspend`
  - `pm enable`
  - `cmd package unsuspend`
- Return codes and final “status” per package.

If something behaves strangely (e.g. a package is “installed but cannot be disabled”), you can:

1. Reproduce the problem (e.g. run option 2 with `disable.list`).
2. Open `debloater_debug.log`.
3. Look for that package name and check the pm/cmd return codes.

---

## OTA Behaviour

- The module itself is **systemless**, and survives OTAs as long as your root solution does.
- However, **ColorOS may re-enable some system apps** after OTAs or major updates.
- If that happens:
  - Simply open Termux again and run:
    ```sh
    su
    debloater
    ```
  - Re-run:
    - Option 1 (Default Optimise apps), and/or  
    - Option 3 (Force Breeno Disable).

---

## Disclaimer

This tool is designed to be conservative and reversible where possible, but:

- Some vendor apps may refuse to be disabled or re-enabled cleanly.
- Over-aggressive debloating can break system features, notifications, or OTA updates.

Use at your own risk, and always make sure you can recover (e.g. via custom recovery or full ROM package).

---

