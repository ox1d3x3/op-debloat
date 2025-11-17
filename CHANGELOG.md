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
