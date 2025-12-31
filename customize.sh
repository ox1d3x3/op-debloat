#!/system/bin/sh

# Simple device detection for install banner
DEVICE="$(getprop ro.product.model 2>/dev/null)"
[ -z "$DEVICE" ] && DEVICE="$(getprop ro.product.device 2>/dev/null)"
[ -z "$DEVICE" ] && DEVICE="Unknown"

ANDROID="$(getprop ro.build.version.release 2>/dev/null)"
[ -z "$ANDROID" ] && ANDROID="Unknown"

# Read version from module.prop (always correct)
MOD_VER="$(grep -m1 '^version=' "$MODPATH/module.prop" 2>/dev/null | cut -d= -f2-)"
[ -z "$MOD_VER" ] && MOD_VER="unknown"

ui_print "===================================================="
ui_print " Debloater - Oppo/ColorOS (CN) by Ox1d3x3"
ui_print " Version ${MOD_VER}"
ui_print " Github: @ox1d3x3"
ui_print "                   __   __  __"
ui_print "                  \\ \\ / / /_ |"
ui_print "                   \\ V /   | |"
ui_print "                    > <    | |"
ui_print "                   / . \\   | |"
ui_print "                  /_/ \\_\\  |_|"
ui_print "===================================================="
ui_print " Device   : $DEVICE"
ui_print " Android  : $ANDROID"
ui_print " List dir : /sdcard/debloater"
ui_print " ModuleID : debloater_systemless_x1"
ui_print "===================================================="
ui_print ""
ui_print "- Installing into: $MODPATH"

# Ensure binary is executable
if [ -f "$MODPATH/system/bin/debloater" ]; then
  set_perm "$MODPATH/system/bin/debloater" 0 0 0755
fi

ui_print ""
ui_print "- Optional: Run Default Optimise now?"
ui_print "  Vol+ = Yes (run now)"
ui_print "  Vol- = No  (skip)"
ui_print "  (Auto-skip after 8 seconds if no key detected)"

TMPDIR="${TMPDIR:-/data/local/tmp}"
run_now=0

# Volume key prompt (safe): waits up to 8 seconds, then auto-skips
if command -v getevent >/dev/null 2>&1 && [ -d /dev/input ]; then
  TMPF="$TMPDIR/debloater_volkey.$$"
  (getevent -qlc 1 2>/dev/null > "$TMPF") &
  GE_PID=$!
  (sleep 8; kill $GE_PID 2>/dev/null) &
  KILL_PID=$!
  wait $GE_PID 2>/dev/null
  kill $KILL_PID 2>/dev/null
  EVENT="$(cat "$TMPF" 2>/dev/null)"
  rm -f "$TMPF"
  echo "$EVENT" | grep -q "KEY_VOLUMEUP" && run_now=1
  echo "$EVENT" | grep -q "KEY_VOLUMEDOWN" && run_now=0
fi

if [ "$run_now" = "1" ]; then
  ui_print "- Running Default Optimise..."
  sh "$MODPATH/system/bin/debloater" --default
  ui_print "- Default Optimise finished."
else
  ui_print "- Skipped Default Optimise."
fi

ui_print ""
ui_print "NOTE: For more customisation or full restore:"
ui_print "      Use Termux -> run: su ; debloater"
ui_print ""
ui_print "- Install complete."
