##v0.4.0 – Major Upgrade (Recommended Update)
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

Flashable ASCII Banner Fixed

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
