# Debloater - Oppo/ColorOS (CN) by Ox1d3x3 (v0.2.3)

Module ID: `debloater_systemless_x1`  

This module provides a `pm disable/enable` based debloat mechanism for Oppo/ColorOS (CN) devices.

- No `/system` modifications.
- No real uninstalls.
- All changes are per-user (user 0) package state.
- Package sets are defined as plain text files on internal storage.

## Paths

Module directory (typical):

```text
/data/adb/modules/debloater_systemless_x1
```

Debloat set directory (user-editable):

```text
/sdcard/debloater
```

On first run, if no `.list` files exist in `/sdcard/debloater`, the module copies default templates from its own `debloat/` directory:

- `disable.list` – default disable set.
- `cn_ecosystem.list` – extended CN ecosystem set.
- `coloros16_reference.list` – reference list for manual review.

Log file:

```text
/data/adb/modules/debloater_systemless_x1/debloater_disable.log
```

## Usage

1. Flash the ZIP via Magisk / KernelSU / APatch.
2. Reboot.
3. Open a root shell (Termux or adb shell):

   ```sh
   su
   debloater
   ```

4. Menu options:

   - Disable packages (debloat set).
   - Enable/restore packages (debloat set).

The tool scans `.list` files in:

```text
/sdcard/debloater
```

Each `.list` file:

- One package name per line.
- Lines starting with `#` are comments.
- A line starting with `# NAME:` defines the identifier shown in the menu.

## Default sets

On first run, the following files are created in `/sdcard/debloater` if they do not exist:

- `disable.list`  
  Default disable set for ColorOS 16 (ads, store, CN media, and non-essential ecosystem services).

- `cn_ecosystem.list`  
  Extended set including Breeno/AI stack and CN ecosystem services.

- `coloros16_reference.list`  
  Reference list of common ColorOS 16 CN bloat. Not used automatically. You can copy lines from here to `disable.list` as needed.

You can edit these files directly with any file manager or text editor.

## Restore / revert

To restore packages from a set:

1. Run `debloater` as root.
2. Choose **Enable/restore packages (debloat set)**.
3. Select the relevant `.list` file.

Internally, the tool executes:

- `pm disable-user --user 0 <pkg>` for disable operations.
- `pm enable --user 0 <pkg>` for restore operations.

No additional behaviour is hidden behind the interface.
