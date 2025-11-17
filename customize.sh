#!/system/bin/sh

# Dynamic env info for banner
DEVICE="$(getprop ro.product.model)"
[ -z "$DEVICE" ] && DEVICE="$(getprop ro.product.product.model)"
ANDROID_VER="$(getprop ro.build.version.release)"
[ -z "$ANDROID_VER" ] && ANDROID_VER="$(getprop ro.system.build.version.release)"

ROOTMGR="Unknown"
if [ -d /data/adb/magisk ] || getprop persist.magisk.version >/dev/null 2>&1 || command -v magisk >/dev/null 2>&1; then
  ROOTMGR="Magisk"
elif [ -d /data/adb/ksu ] || getprop persist.ksu.version >/dev/null 2>&1; then
  ROOTMGR="KernelSU"
elif [ -d /data/adb/ap ] || getprop persist.apatch.version >/dev/null 2>&1; then
  ROOTMGR="APatch"
fi

cat <<EOF

====================================================
        Debloater - Oppo/ColorOS (CN) by Ox1d3x3
                 Version v0.3.4
                 Github: @ox1d3x3
                   __   __  __ 
                  \ \ / / /_ |
                   \ V /   | |
                    > <    | |
                   / . \   | |
                  /_/ \_\  |_|
====================================================
 Device    : ${DEVICE:-unknown}
 Android   : ${ANDROID_VER:-unknown}
 Root      : ${ROOTMGR:-unknown}
─────────────────────────────────────
 Debloater - Oppo/ColorOS (CN) by X1
 Compatible: Magisk / KernelSU / APatch
 Version v0.3.4
 Github: @ox1d3x3
─────────────────────────────────────

Installing: Debloater - Oppo/ColorOS (CN) by Ox1d3x3 (v0.3.4)
- Package-state debloater (disable/enable)
- Android 12–16
- Debloat lists in /sdcard/debloater

EOF
