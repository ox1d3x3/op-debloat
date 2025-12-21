# Changelog – Debloater (Oppo/ColorOS CN) by Ox1d3x3

## v0.6.2 🚀 – Universal Root Manager Compatibility

### Added
- **Universal boot-time permission & fallback execution fix**
  - Ensures the `debloater` binary is executable on every boot (`chmod 0755`) across common module locations:
    - `/data/adb/modules/debloater_systemless_x1/system/bin/debloater` (Magisk / compat)
    - `/data/adb/ksu/modules/debloater_systemless_x1/system/bin/debloater` (KernelSU / KSU Next)
    - `/data/adb/apatch/modules/debloater_systemless_x1/system/bin/debloater` (APatch, best-effort)
  - Creates a **PATH-independent fallback launcher** at:
    - `/data/local/tmp/debloater`
  - Optionally installs a helper copy to:
    - `/data/local/bin/debloater` (only if `/data/local/bin` exists)

- **Root manager detection (best-effort) for diagnostics**
  - Displays an inferred `RootMgr` value in the terminal banner to help identify the active root environment.

### Fixed
- **Resolved `debloater: inaccessible or not found`** issues seen on certain root managers/compat layers (notably SukiSU Ultra / Magisk-compat installs) where install-time `set_perm` may not apply correctly.

### Notes
- No changes were made to debloat/restore logic, package lists, or menu workflows.
- Module remains systemless and OTA-safe; changes are limited to execution reliability across root managers.




## v0.6.0 🚀 (AdGuard-DNS added + optimise the code)

### Added
- **AdGuard DNS (Private DNS helper)**  
  - New main menu option: `8. AdGuard DNS (Private DNS helper)`.
  - Uses Android’s global Private DNS settings via the `settings` tool:
    - `settings put global private_dns_mode …`
    - `settings put global private_dns_specifier …`
  - Options:
    - `1` – Set **AdGuard DNS** (`dns.adguard-dns.com`).
    - `2` – Set **AdGuard Family DNS** (`family.adguard-dns.com`) for additional blocking.
    - `3` – Reset to **Automatic / opportunistic** (Android default).
  - Shows current and updated Private DNS mode/host so users can verify what’s applied.
  - Respects ROMs where `settings` is missing by gracefully exiting with a message instead of breaking.


## v0.5.0 🚀 (Major bug Fixed + New feature)
-Fixed the logic bugs for disabled list caching issue
- Added `CN_bloat-list.list` reference file under `/sdcard/debloater`:
  - Categorised CN bloat by sections (Ads & Store, CN Browser/Web, CN Media & Extras, Ecosystem & Services, Breeno/AI).
  - Intended as a master reference so users can copy package names into `disable.list`, `cn_ecosystem.list`, or other profiles.
- Extended profile initialisation to always create `CN_bloat-list.list` on first run if missing.
- Improved install-time script:
  - Now reads device model (`ro.product.model` / `ro.product.device`) and Android release (`ro.build.version.release`) and prints them during flashing.
- Updated metadata to `version=v0.5.0`, `versionCode=500` and clarified OTA-safe, systemless design in `module.prop`.
- Reworked list-based operations to match the behaviour of hardcoded flows:
  - Introduced `build_pkg_list_from_file()` to sanitise `.list` files (strip comments, Windows `\r`, extra whitespace, blank lines).
  - Switched from `while read` loops to `for pkg in $pkg_list` using a space-flattened list, avoiding hangs and mis-parsing on some Android shells.
- Unified disable/enable logic:
  - `apply_disable_from_profile()` and `apply_enable_from_profile()` now share the same loop pattern and summary reporting as Default Optimise / Force Breeno.
- Kept all debloating logic systemless and user-space only (no direct `/system` writes).
- Introduced structured, profile-driven debloat engine:
  - Default Optimise Apps: hardcoded, curated ColorOS CN bloat set (ads, store, CN browser, media, ecosystem).
  - Force Breeno Disable: hardcoded Breeno/AI package set with triple-disable (user + global + suspend).
- Added profile auto-init under `/sdcard/debloater`:
  - `disable.list` – default disable profile for ColorOS 16 CN.
  - `cn_ecosystem.list` – extended ecosystem profile (user-editable).
  - `breeno_minimal.list` – Breeno/AI package reference.
  - `coloros16_reference.list` – documentation-only reference list.
  - `enabled.list` – user-maintained restore helper.
  - `disabled.list` – dynamic log of packages actually disabled by the module.
- Implemented tracking helpers:
  - `record_disabled_pkg()` appends successfully disabled packages to `disabled.list` (no duplicates).
  - `record_enabled_pkg()` appends successfully enabled packages to `enabled.list`.
- Added debug logging:
  - `debloater_debug.log` in `/sdcard/debloater` capturing each pm/cmd call, return codes, and profile processing for troubleshooting.
- New main menu layout focusing on:
  - Default optimise, profile-based debloat/restore, full restore, package listing, and basic update stub.


## v0.4.1 🚀 (Minor fixes)
-Fixes code bugs
-Fixes logic bugs

## v0.4.0 – Major Upgrade (Recommended Update)
🚀 New Features

Automatic template generation
Creates the full set of debloat profiles on first run:

disable.list

cn_ecosystem.list

breeno_minimal.list

coloros16_reference.list

enabled.list

Full Restore (List-Based)
Restores all packages found in:

disable.list

cn_ecosystem.list

breeno_minimal.list
Writes restored apps into:

enabled.list

Force Breeno Disable (Advanced)
Aggressive Breeno/AI kill routine:

pm disable-user

pm disable

cmd package suspend (if supported)
Useful for stubborn Breeno services that auto-reappear.

App Visibility Tools

List all installed packages

List disabled packages (pm list packages -d)

GitHub Auto-Update Checker

Automatically checks for new releases from
ox1d3x3/op-debloat

Compares semantic version numbers

Provides download link for latest release

✨ Improvements

Now always visible in Magisk / KSU / APatch installers

Dynamic info:

Device model

Android version

Root manager type

Shows:

Device

Android version

Root environment

Module ID & version

No more false “not installed” messages
Removed pm path dependency → ColorOS was hiding packages.
Now relies on direct pm disable-user / pm enable status.

Cleaner Folder & Naming Logic

Uses /sdcard/debloater/

Profiles are readable, editable, user-friendly

Safer System Behavior

No background services

No daemons

No loops

No battery drain

Purely on-demand execution






## v0.3.7
- Added dedicated **Breeno / AI profiles**:
  - `breeno_ai_minimal.list` – disables only the visible Breeno assistant / voice front-end:
    - `com.heytap.speechassist`
    - `com.oplus.ovoicemanager`
    - `com.oplus.ovoicemanager.wakeup`
    - Safer option if you just want the Breeno UI gone but keep most AI backend intact.
  - `breeno_ai_aggressive.list` – nukes the full Breeno / AI stack:
    - Front-end: speech assistant, voice manager, wakeup, AI call, AI writer, AI widgets, AI unit, OBrain.
    - Backend engines: `com.oplus.deepthinker`, `com.oplus.metis`, `com.oplus.matrix`, `com.oplus.atlas`.
    - Gives a “Breeno OFF everywhere” experience but may affect system AI features.
- Both Breeno profiles are shipped as **templates** and auto-copied to `/sdcard/debloater` on first run
  (or via “Restore default profiles”), and can be toggled with:
  - **Disable**: Main menu → Option 1 → select Breeno profile.
  - **Re-enable**: Main menu → Option 2 → select the same profile.
- Improved **“Full restore from log”** behaviour:
  - Cleans CRLF and stray whitespace from package names read from `debloater_disable.log`.
  - If `pm path` reports a package “not installed”, it now **still attempts** `pm enable --user 0 <pkg>`
    instead of silently skipping.
  - Logs outcomes as `ENABLE_FROM_LOG_OK` / `ENABLE_FROM_LOG_FAIL` for better traceability.
  - Fixes cases where apps were actually present but were being skipped as “not found”.
- Template/profile handling:
  - Ensures all built-in `.list` templates (default CN debloat, ecosystem, ColorOS 16 ref, Breeno profiles)
    are written to the module’s `templates/` directory at install time and copied to `/sdcard/debloater`
    when the CLI runs the first time.
