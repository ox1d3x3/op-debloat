# Debloater – Oppo/ColorOS (CN) by Ox1d3x3

Root-friendly, **list-based debloater** for Oppo/ColorOS (CN) devices.

- Uses `pm disable-user` / `pm enable` (user `0` only)
- No `/system` or `/product` changes
- No background daemons or battery drain
- Profiles live on `/sdcard/debloater` so you can edit them with any file manager
- Works with **Magisk / KernelSU / APatch** (or any root manager that mounts `/system/bin`)

---

## ✨ Features

- **Systemless, reversible debloat**
  - Disables packages via `pm disable-user --user 0`
  - Restores via `pm enable --user 0`
- **Profile-driven**
  - Simple `.list` files on `/sdcard/debloater`
  - Commented, easy to edit, one package per line
- **Safe defaults for ColorOS CN bloat**
  - Oppo ads, HeyTap store, CN browser, CN media, ecosystem fluff
  - No launcher / SystemUI / telephony / core Google services
- **Full restore in one shot**
  - New “restore everything I disabled with this module” option
- **Manual OTA-style update check**
  - Checks latest GitHub release, compares to local version
- **Zero background activity**
  - No `service.sh` work
  - No `post-fs-data` hacks
  - Nothing runs until *you* run `debloater`

---

## ⚠️ Warnings & Safety Notes

> **Read this before you use it.**

- This tool touches **system apps** via package manager. If you add the wrong package to your lists, you *can*:
  - Break notifications, camera, calls, etc.
  - Soft-brick the ROM enough that only a factory reset or reflash fixes it.
- The default profiles are conservative, but **anything you add yourself is your responsibility**.
- **Module uninstall does _not_ automatically re-enable apps.**
  - Android remembers `pm disable-user` state even after the module is gone.
  - If you want everything back, you **must** run the **“Full restore (from log)”** option *before* disabling/uninstalling the module.
- Always:
  - Make a backup / have recovery or fastboot tools ready.
  - Test in small batches if you’re unsure.
  - Avoid disabling obvious core stuff (SystemUI, Settings, Telephony, Google Play Services, etc).

You use this at your own risk. It’s designed to be as safe as possible, but it is still a **power tool**.

---

## ✅ Requirements

- Rooted Android device (Oppo / OnePlus / Realme on **ColorOS/HyperOS-style** base)
- Android 12–16 recommended
- One of:
  - [Magisk](https://github.com/topjohnwu/Magisk)
  - [KernelSU](https://github.com/tiann/KernelSU)
  - [APatch](https://github.com/bmax121/APatch)
- A terminal:
  - Termux on device, or
  - `adb shell` from PC

---

## 📦 Installation

1. Download the latest release `.zip` from:

   ```text
   https://github.com/ox1d3x3/op-debloat/releases
