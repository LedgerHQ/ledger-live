# Build on LLB

Trigger a build workflow on ledger-live-build repository from the current branch.

## Prompt Variables

$BUILD_TARGET

> Select what to build: android | ios | mobile (both android + ios) | desktop

## Instructions

### Step 1: Validate and get current branch

```bash
# Validate BUILD_TARGET
if [[ ! "$BUILD_TARGET" =~ ^(android|ios|mobile|desktop)$ ]]; then
  echo "❌ Invalid BUILD_TARGET: $BUILD_TARGET (expected: android | ios | mobile | desktop)"
  exit 1
fi

# Get current branch name
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  Warning: You have uncommitted changes that won't be included in the build."
fi
```

### Step 2: Push branch to origin

```bash
# Ensure branch is pushed to origin
if ! git push origin "$BRANCH"; then
  echo "❌ Failed to push branch to origin"
  exit 1
fi
```

### Step 3: Trigger the build(s)

Based on `$BUILD_TARGET`, trigger the appropriate workflow(s) on `LedgerHQ/ledger-live-build`:

**For android:**

```bash
if ! gh workflow run "[Build](Mobile) Android" -R LedgerHQ/ledger-live-build \
  -f ref="$BRANCH" \
  -f repo="LedgerHQ/ledger-live"; then
  echo "❌ Failed to trigger Android build"
  exit 1
fi
```

**For ios:**

```bash
if ! gh workflow run "[Build](Mobile) iOS" -R LedgerHQ/ledger-live-build \
  -f ref="$BRANCH" \
  -f repo="LedgerHQ/ledger-live"; then
  echo "❌ Failed to trigger iOS build"
  exit 1
fi
```

**For mobile (both android and ios):**

```bash
if ! gh workflow run "[Build](Mobile) Android" -R LedgerHQ/ledger-live-build \
  -f ref="$BRANCH" \
  -f repo="LedgerHQ/ledger-live"; then
  echo "❌ Failed to trigger Android build"
  exit 1
fi

if ! gh workflow run "[Build](Mobile) iOS" -R LedgerHQ/ledger-live-build \
  -f ref="$BRANCH" \
  -f repo="LedgerHQ/ledger-live"; then
  echo "❌ Failed to trigger iOS build"
  exit 1
fi
```

**For desktop:**

```bash
if ! gh workflow run "[Build] Desktop" -R LedgerHQ/ledger-live-build \
  -f ref="$BRANCH" \
  -f repo="LedgerHQ/ledger-live"; then
  echo "❌ Failed to trigger Desktop build"
  exit 1
fi
```

### Step 4: Wait and fetch the triggered run URLs

Wait for the workflow to be queued, then fetch the most recent run:

```bash
# Retry configuration
MAX_RETRIES=6
RETRY_DELAY=5

fetch_run_url() {
  local workflow_file=$1
  local retries=0

  while [ $retries -lt $MAX_RETRIES ]; do
    result=$(gh run list -R LedgerHQ/ledger-live-build \
      --workflow="$workflow_file" \
      --limit 1 \
      --json url,name,status \
      --jq '.[0] | "[\(.name) (\(.status))](\(.url))"')

    if [ -n "$result" ] && [ "$result" != "null" ]; then
      echo "$result"
      return 0
    fi

    retries=$((retries + 1))
    sleep $RETRY_DELAY
  done

  echo "⚠️  Could not find run for $workflow_file (check manually)"
  return 1
}

# Fetch run URL based on BUILD_TARGET
case "$BUILD_TARGET" in
  android)
    fetch_run_url "build-apk.yml"
    ;;
  ios)
    fetch_run_url "build-ipa.yml"
    ;;
  mobile)
    fetch_run_url "build-apk.yml"
    fetch_run_url "build-ipa.yml"
    ;;
  desktop)
    fetch_run_url "build-desktop.yml"
    ;;
esac
```

### Output Format

After triggering builds, display a summary using markdown for clickable links. Example output:

```
✅ **Build(s) triggered for branch:** `feat/my-feature`

📦 **Triggered workflow(s):**

- [Build] Desktop

🔗 **Workflow run URL(s):**

- [[Build] Desktop (queued)](https://github.com/LedgerHQ/ledger-live-build/actions/runs/123456789)

You can also view all runs at: https://github.com/LedgerHQ/ledger-live-build/actions
```

## Workflow Reference

| Target  | Workflow Name             | Workflow File       | Description        |
| ------- | ------------------------- | ------------------- | ------------------ |
| android | `[Build](Mobile) Android` | `build-apk.yml`     | Builds Android APK |
| ios     | `[Build](Mobile) iOS`     | `build-ipa.yml`     | Builds iOS IPA     |
| desktop | `[Build] Desktop`         | `build-desktop.yml` | Builds Desktop app |

## Notes

- The `ledger-live-build` repository is **private** — this command is only usable by Ledger employees with access to it
- Builds are triggered on the `ledger-live-build` repository, not `ledger-live`
- The run URL fetching doesn't filter by actor or branch — since we query immediately after triggering, the most recent run is reliably ours. Branch filtering isn't possible because `head_branch` refers to the `ledger-live-build` repo's branch (always `main`), not the `ref` parameter passed for `ledger-live`.
- The branch must exist on `LedgerHQ/ledger-live` (origin)
- Android builds typically take ~30 minutes
- iOS builds typically take ~40 minutes
- Desktop builds typically take ~20 minutes
