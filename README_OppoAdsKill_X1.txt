Oppo Ads Kill (X1) v0.1.1
=========================

Author: Ox1d3x3  
ID: oppo.ads.kill.x1  

Changes in v0.1.1
-----------------
- Now targets **com.oppo.ads** **and** **com.heytap.market** by default.
- Everything else remains configurable via killlist.txt / excludelist.txt.

What this module does
---------------------
- Runs at boot (late_start service) on rooted Oppo/Realme/OnePlus ColorOS devices.
- Systemlessly **disables** (or optionally uninstalls for user 0) Oppo/HeyTap ad and promo packages.
- Uses a configurable **killlist.txt** and **excludelist.txt** so you stay in control.
- Designed to be *aggressive* on ads but *safe* for the system.

Default active targets
----------------------
- `com.oppo.ads`        – Core Oppo ads framework.
- `com.heytap.market`   – HeyTap App Market (store + promos).
  - You will lose access to HeyTap App Market UI when this is disabled/uninstalled.
  - Google Play Store and third-party stores remain unaffected.

Key files
---------
- `module.prop`        – Magisk/KernelSU module meta
- `service.sh`         – Engine that processes killlist/excludelist at boot
- `killlist.default`   – Default template (copied to killlist.txt on first boot)
- `killlist.txt`       – Active killlist (edit this to add/remove packages)
- `excludelist.txt`    – Safety overrides (packages here are never touched)
- `mode.conf`          – Optional mode switch (disable vs uninstall)

Modes
-----
- Default: **disable**
  - Uses: `pm disable-user --user 0 <package>`
  - Safe, reversible, OTA-friendly.

- Optional: **uninstall**
  - Uses: `pm uninstall -k --user 0 <package>`
  - Still systemless (only user 0), but more aggressive.

To change mode, create/edit `mode.conf` in the module folder:

- For DISABLE mode (default):
    MODE=disable

- For UNINSTALL mode:
    MODE=uninstall

Install
-------
1. Zip this folder as a standard Magisk/KernelSU module:
   - Name example: `OppoAdsKill_X1_v0.1.1.zip`
2. In Magisk / KernelSU Manager:
   - Modules → Install from storage → select the ZIP → reboot.

Log file
--------
- `oppo_ads_kill.log` inside the module folder shows exactly what happened:
  - DISABLE OK / FAIL
  - UNINSTALL OK / FAIL
  - SKIP (not installed / excluded)

If you ever want HeyTap Market back
-----------------------------------
- Add this line to `excludelist.txt`:

    com.heytap.market

- Reboot → module will skip it.
- Then you can manually re-enable / reinstall it if needed.

Enjoy the even-cleaner, no-App-Market Oppo experience 🔥
