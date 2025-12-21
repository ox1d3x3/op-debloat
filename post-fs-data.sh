#!/system/bin/sh
MODDIR=${0%/*}

# Module id (expected)
MID="debloater_systemless_x1"

# Candidate locations of the module directory (Magisk, KernelSU, APatch, compat layers)
CANDIDATES="
/data/adb/modules/${MID}
/data/adb/ksu/modules/${MID}
/data/adb/apatch/modules/${MID}
"

for D in $CANDIDATES; do
  BIN="$D/system/bin/debloater"
  if [ -f "$BIN" ]; then
    chmod 0755 "$BIN" 2>/dev/null
    # Create a runnable fallback (PATH-independent)
    cp "$BIN" /data/local/tmp/debloater 2>/dev/null
    chmod 0755 /data/local/tmp/debloater 2>/dev/null
    # Optional: if /data/local/bin exists, place a copy there too
    if [ -d /data/local/bin ]; then
      cp "$BIN" /data/local/bin/debloater 2>/dev/null
      chmod 0755 /data/local/bin/debloater 2>/dev/null
    fi
  fi
done

# Also ensure /system/bin overlay copy is executable if present
if [ -f /system/bin/debloater ]; then
  chmod 0755 /system/bin/debloater 2>/dev/null
fi

exit 0
