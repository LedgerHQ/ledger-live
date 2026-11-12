# Auto-upgrade

Build a base version and a minor update, serve them from a local signed feed, then open the base so
it upgrades. From `apps/ledger-live-desktop`:

```bash
node tools/autoupgrade.mts        # manual: restart or quit the app to install, Ctrl+C when done
node tools/autoupgrade-test.mts   # automated: quits the app, checks the install, prints PASS or FAIL
```

| Option               | Effect                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `--update-from-feed` | Rebuild the base only, reuse the update from `dist/feed`         |
| `--from-feed`        | Rebuild nothing, reuse both builds from `dist/feed`              |
| `--wrong-key`        | Open the app without the feed's key: the update must be rejected |

## Examples

```bash
# After changing the updater code: rebuild the base only
node tools/autoupgrade-test.mts --update-from-feed

# Run again without rebuilding
node tools/autoupgrade-test.mts --from-feed

# Then check that the app rejects an update signed with another key
node tools/autoupgrade-test.mts --from-feed --wrong-key
```

## Before running

- Quit any running Ledger Wallet.
- macOS: the builds are signed with the code signing identity found in your keychain.
- Linux: the scripts run the AppImage, which needs `libfuse2` like any packaged LWD.
- Windows: installing and updating show a UAC prompt, and replace any installed Ledger Wallet.
- By default the app uses the same data folder as an installed Ledger Wallet; set
  `LEDGER_CONFIG_DIRECTORY` to use another one.

Only macOS has been run end to end so far.
