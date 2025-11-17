#!/system/bin/sh
# Debloater - Oppo/ColorOS (CN) by Ox1d3x3
# customize.sh (install-time)

MODPATH="${0%/*}"
[ -z "$MODPATH" ] && MODPATH="/data/adb/modules/debloater_systemless_x1"

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
                 Version v0.3.7
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
 Version v0.3.7
 Github: @ox1d3x3
─────────────────────────────────────

Installing: Debloater - Oppo/ColorOS (CN) by Ox1d3x3 (v0.3.7)
- Package-state debloater (disable/enable) for ColorOS CN
- Android 12–16, Magisk/KernelSU/APatch
- Debloat lists live in /sdcard/debloater

EOF

TEMPLATE_DIR="$MODPATH/templates"
mkdir -p "$TEMPLATE_DIR" 2>/dev/null

# Safe default CN debloat
cat >"$TEMPLATE_DIR/disable.list" <<'EOL'
# NAME: Safe default Oppo/ColorOS CN debloat set
# Add package names (one per line). Lines starting with # are ignored.
# Example packages (commented out for safety, user can uncomment):
# com.heytap.browser
# com.heytap.market
# com.coloros.video
# com.oppo.reader
# com.heytap.music
EOL

# Oppo / HeyTap ecosystem extras
cat >"$TEMPLATE_DIR/cn_ecosystem.list" <<'EOL'
# NAME: Oppo/HeyTap ecosystem extras (optional)
# Put extra ecosystem / companion apps here.
# com.heytap.accessory
# com.heytap.mydevices
# com.heytap.vip
EOL

# ColorOS 16 reference placeholder
cat >"$TEMPLATE_DIR/coloros16_reference.list" <<'EOL'
# NAME: ColorOS 16 reference bloat list (review before using)
# This is a placeholder list. User should paste reviewed packages here.
EOL

# Breeno / AI (minimal) – front-end only
cat >"$TEMPLATE_DIR/breeno_ai_minimal.list" <<'EOL'
# NAME: Breeno / AI (minimal – front-end only)
# Disables Breeno assistant front-end / voice UI while keeping deeper AI
# engine pieces intact. Safer option if you only want the visible Breeno
# app/features gone.
#
# Core Breeno assistant & voice front-end
com.heytap.speechassist
com.oplus.ovoicemanager
com.oplus.ovoicemanager.wakeup
EOL

# Breeno / AI (aggressive) – full stack
cat >"$TEMPLATE_DIR/breeno_ai_aggressive.list" <<'EOL'
# NAME: Breeno / AI (aggressive – full stack)
# Disables Breeno voice, widgets, AI call and their backing AI services.
# This may impact system AI features, suggestions, and behaviour.
#
# Front-end
com.heytap.speechassist
com.oplus.ovoicemanager
com.oplus.ovoicemanager.wakeup
com.oplus.aicall
com.oplus.aiwriter
com.oplus.aiwidgets
com.oplus.aiunit
com.oplus.obrain
#
# AI engines / frameworks
com.oplus.deepthinker
com.oplus.metis
com.oplus.matrix
com.oplus.atlas
EOL

exit 0
