# Lottie to .lottie Migration Guide

This directory contains scripts to migrate your Lottie animations from `.json` format to the optimized `.lottie` format.

## Benefits of .lottie Format

- **70-80% file size reduction** compared to JSON
- **Bundled assets**: Images are included in the archive
- **Better performance**: Compressed format loads faster
- **Same rendering**: Compatible with existing lottie-react-native

## Scripts

### 1. `list-lottie-files.mjs` - Inventory

Scans the entire `src/` directory to find all Lottie JSON files and generates a detailed inventory.

**Usage:**
```bash
pnpm animations:list
```

**Output:**
- Generates `scripts/lottie-files-list.json` with:
  - Total files count
  - Total size in MB
  - Estimated size after conversion
  - List of all files with sizes
  - Directory structure
- Displays top 10 largest files
- Shows estimated savings (20-23 MB for this project)

### 2. `convert-to-lottie.mjs` - Conversion

Converts all Lottie JSON files to `.lottie` format based on the inventory.

**Usage:**
```bash
pnpm animations:convert
```

**Features:**
- Reads from `lottie-files-list.json`
- Skips already converted files
- Shows conversion progress with size reduction
- Displays summary at the end

### 3. `update-lottie-imports.mjs` - Update Code

Automatically updates all imports in your TypeScript/TSX files to use `.lottie` instead of `.json`.

**Usage:**
```bash
pnpm animations:update-imports
```

**Features:**
- Scans all `.ts` and `.tsx` files in `src/`
- Updates only animation-related imports
- Preserves other JSON imports (configs, translations, etc.)
- Shows detailed summary of changes

### 4. `cleanup-json-animations.mjs` - Cleanup

Removes old `.json` files that have been converted to `.lottie`.

**Usage:**
```bash
pnpm animations:cleanup
```

**Safety features:**
- Only deletes `.json` files with a `.lottie` equivalent
- Shows total space freed
- Skips files without `.lottie` backup

### Complete Migration Workflow

Run all steps automatically:

```bash
pnpm animations:list
pnpm animations:convert
pnpm animations:update-imports
# Test your app
pnpm animations:cleanup
```

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
cd apps/ledger-live-mobile
pnpm install
```

This will install `@dotlottie/dotlottie-js` automatically.

### Step 2: List All Lottie Files

```bash
pnpm animations:list
```

Review the output to see:
- How many Lottie files you have
- Total current size
- Expected size after conversion

### Step 3: Convert Files

```bash
pnpm animations:convert
```

This will create `.lottie` files alongside the original `.json` files.

### Step 4: Update Metro Config ✅

Metro config has been automatically updated to support `.lottie` files!

The `assetExts` now includes `'lottie'` extension.

### Step 5: Update Imports

Run the automated import updater:

```bash
pnpm animations:update-imports
```

This will automatically replace all imports like:
```typescript
import animation from './animation.json';
```

With:
```typescript
import animation from './animation.lottie';
```

The script only updates animation-related imports, leaving other JSON files (configs, translations, etc.) untouched.

### Step 6: Test

Test your app to ensure animations still work:

```bash
pnpm android
# or
pnpm ios
```

### Step 7: Cleanup Old JSON Files

Once everything works with `.lottie` files, clean up the old `.json` files:

```bash
pnpm animations:cleanup
```

This will:
- Delete all `.json` files that have a corresponding `.lottie` file
- Show you how much space was freed
- Keep any `.json` files without a `.lottie` equivalent (safety)

## Current Project Stats

Based on initial scan:
- **Total files**: ~127 Lottie animations
- **Current size**: ~29 MB
- **After conversion**: ~6-9 MB
- **Savings**: ~20-23 MB (70-80% reduction)

### Largest Files

1. `infinityPassPart1.json` - 4.7 MB
2. `infinityPass.json` - 4.7 MB
3. `infinityPassPart2.json` - 4.6 MB
4. `infinityPassCentered.json` - 4.5 MB
5. `device/customLockScreen/stax.json` - 2.4 MB

## Troubleshooting

### Script fails with "lottie-files-list.json not found"

Run `pnpm animations:list` first to generate the inventory.

### Conversion errors

Check that the JSON file is a valid Lottie animation. The script validates files before conversion.

### Metro bundler doesn't recognize .lottie

Update `metro.config.js` to include `'lottie'` in `assetExts`.

## Notes

- Original `.json` files are **not deleted** automatically
- You can run the conversion multiple times - already converted files are skipped
- The scripts work recursively through all subdirectories
- Configuration files (package.json, etc.) are automatically excluded
