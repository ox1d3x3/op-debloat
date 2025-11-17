#!/system/bin/sh
# Oppo Ads Kill (X1) - service.sh
# Runs at late_start service to disable known Oppo/HeyTap ad packages
# without touching /system. Uses configurable killlist + excludelist.

MODDIR="${0%/*}"
LOGFILE="$MODDIR/oppo_ads_kill.log"
KILLLIST="$MODDIR/killlist.txt"
DEFAULT_KILLLIST="$MODDIR/killlist.default"
EXCLUDELIST="$MODDIR/excludelist.txt"
MODEFILE="$MODDIR/mode.conf"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOGFILE"
}

# Ensure log file exists
touch "$LOGFILE"

log "===== Oppo Ads Kill (X1) service start ====="

# Ensure killlist exists (copy default on first boot)
if [ ! -f "$KILLLIST" ]; then
    if [ -f "$DEFAULT_KILLLIST" ]; then
        cp "$DEFAULT_KILLLIST" "$KILLLIST"
        log "No killlist.txt found, created from killlist.default"
    else
        touch "$KILLLIST"
        log "No killlist.default found, created empty killlist.txt"
    fi
fi

# Ensure excludelist exists
if [ ! -f "$EXCLUDELIST" ]; then
    touch "$EXCLUDELIST"
fi

# Read mode (disable or uninstall)
MODE="disable"
if [ -f "$MODEFILE" ]; then
    # shellcheck disable=SC1090
    . "$MODEFILE" 2>/dev/null
fi

case "$MODE" in
    uninstall|UNINSTALL)
        MODE="uninstall"
        ;;
    *)
        MODE="disable"
        ;;
esac

log "Operating mode: $MODE"

# Build exclude set (simple string list)
EXCLUDES=""
while IFS= read -r line; do
    # strip CR + whitespace
    entry=$(echo "$line" | tr -d '\r' | sed 's/^ *//;s/ *$//')
    [ -z "$entry" ] && continue
    case "$entry" in
        \#*) continue ;;
    esac
    EXCLUDES="$EXCLUDES $entry"
done < "$EXCLUDELIST"

# Function: safely disable or uninstall a package for user 0
handle_pkg() {
    pkg="$1"

    # Skip excluded
    for e in $EXCLUDES; do
        if [ "$pkg" = "$e" ]; then
            log "SKIP (excluded): $pkg"
            return 0
        fi
    done

    # Check if package exists
    if ! pm path "$pkg" >/dev/null 2>&1; then
        log "SKIP (not installed): $pkg"
        return 0
    fi

    if [ "$MODE" = "uninstall" ]; then
        # user-0 only uninstall (safe/systemless)
        if pm uninstall -k --user 0 "$pkg" >/dev/null 2>&1; then
            log "UNINSTALL OK: $pkg"
        else
            log "UNINSTALL FAIL: $pkg"
        fi
    else
        # disable-user for user 0
        if pm disable-user --user 0 "$pkg" >/dev/null 2>&1; then
            log "DISABLE OK: $pkg"
        else
            log "DISABLE FAIL: $pkg"
        fi
    fi
}

# Give system a bit of time to boot packages
sleep 25

log "Processing killlist.txt ..."

while IFS= read -r line; do
    pkg=$(echo "$line" | tr -d '\r' | sed 's/^ *//;s/ *$//')
    [ -z "$pkg" ] && continue
    case "$pkg" in
        \#*) continue ;;
    esac

    handle_pkg "$pkg"
done < "$KILLLIST"

log "===== Oppo Ads Kill (X1) service end ====="
