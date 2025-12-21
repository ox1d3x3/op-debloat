#!/system/bin/sh
MODDIR=${0%/*}
MID="debloater_systemless_x1"

# Candidate module directories (Magisk / KernelSU / APatch)
CANDIDATES="
/data/adb/modules/${MID}
/data/adb/ksu/modules/${MID}
/data/adb/apatch/modules/${MID}
"

# Bin dirs that are commonly on PATH for different managers
BIN_DIRS="
/data/adb/ksu/bin
/data/adb/ap/bin
/data/adb/magisk
/data/local/bin
"

# Write launcher helper
write_launcher() {
  DEST="$1"
  [ -z "$DEST" ] && return 1
  mkdir -p "$(dirname "$DEST")" 2>/dev/null
  cat > "$DEST" <<'EOF_LAUNCH'
#!/system/bin/sh
# Debloater universal launcher
MID="debloater_systemless_x1"

# 1) If mounted to /system/bin (Magisk / overlayfs metamodule)
if [ -x /system/bin/debloater ]; then
  exec /system/bin/debloater "\$@"
fi

# 2) Magisk-style module path
if [ -x "/data/adb/modules/\${MID}/system/bin/debloater" ]; then
  exec "/data/adb/modules/\${MID}/system/bin/debloater" "\$@"
fi

# 3) KernelSU / KSU Next style module path
if [ -x "/data/adb/ksu/modules/\${MID}/system/bin/debloater" ]; then
  exec "/data/adb/ksu/modules/\${MID}/system/bin/debloater" "\$@"
fi

# 4) APatch style module path (best-effort)
if [ -x "/data/adb/apatch/modules/\${MID}/system/bin/debloater" ]; then
  exec "/data/adb/apatch/modules/\${MID}/system/bin/debloater" "\$@"
fi

# 5) Fallback copy created by module boot scripts
if [ -x "/data/local/tmp/debloater" ]; then
  exec "/data/local/tmp/debloater" "\$@"
fi

echo "Debloater launcher: debloater not found."
echo "Try running one of these directly:"
echo "  /data/adb/modules/\${MID}/system/bin/debloater"
echo "  /data/adb/ksu/modules/\${MID}/system/bin/debloater"
echo "  /data/local/tmp/debloater"
exit 127

EOF_LAUNCH
  chmod 0755 "$DEST" 2>/dev/null
}

# Ensure debloater binary is executable and create fallback copy
for D in $CANDIDATES; do
  BIN="$D/system/bin/debloater"
  if [ -f "$BIN" ]; then
    chmod 0755 "$BIN" 2>/dev/null
    cp "$BIN" /data/local/tmp/debloater 2>/dev/null
    chmod 0755 /data/local/tmp/debloater 2>/dev/null
  fi
done

# Install launcher into manager bin dirs if present
for BD in $BIN_DIRS; do
  if [ -d "$BD" ]; then
    write_launcher "$BD/debloater"
  fi
done

# Also keep /system/bin overlay executable if it exists
if [ -f /system/bin/debloater ]; then
  chmod 0755 /system/bin/debloater 2>/dev/null
fi

exit 0
