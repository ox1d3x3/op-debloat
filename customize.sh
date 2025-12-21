#!/system/bin/sh

# Simple device detection for install banner
DEVICE="$(getprop ro.product.model 2>/dev/null)"
[ -z "$DEVICE" ] && DEVICE="$(getprop ro.product.device 2>/dev/null)"
[ -z "$DEVICE" ] && DEVICE="Unknown"

ANDROID="$(getprop ro.build.version.release 2>/dev/null)"
[ -z "$ANDROID" ] && ANDROID="Unknown"

ui_print "===================================================="
ui_print " Debloater - Oppo/ColorOS (CN) by Ox1d3x3"
ui_print " Version v0.6.2"
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

ui_print "- Install complete. Open Termux, run 'su' then 'debloater'."
