# Auto-upgrade

Build a base version and a minor update, serve them from a local signed feed, then open the base so
it upgrades. From `apps/ledger-live-desktop`:

```bash
node tools/testing/autoupgrade.mts   # restart or quit the app to install, Ctrl+C when done
```

| Option                    | Effect                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `--update-from-feed`      | Rebuild the base only, reuse the update from `dist/feed`               |
| `--from-feed`             | Rebuild nothing, reuse both builds from `dist/feed`                    |
| `--bad-signature`         | Sign the update with a key the app does not trust: it must not install |
| `--download-speed <MB/s>` | Serve the feed at this speed to watch the download                     |

## Examples

```bash
# After changing the updater code: rebuild the base only
node tools/testing/autoupgrade.mts --update-from-feed

# Run again without rebuilding
node tools/testing/autoupgrade.mts --from-feed

# Then check that an update with a bad signature is not installed
node tools/testing/autoupgrade.mts --from-feed --bad-signature

# Watch the update download at 2 MB/s
node tools/testing/autoupgrade.mts --from-feed --download-speed 2
```

## Before running

- Quit any running Ledger Wallet.
- macOS: the builds are signed with the code signing identity found in your keychain.
- Each run deletes the updater's pending download, in `ledger-live-desktop-updater/pending` under
  the user cache folder, so the app downloads the update again. An installed Ledger Wallet uses the
  same folder.
- Linux: the script runs the AppImage, which needs `libfuse2` like any packaged LWD.
- Windows: installing and updating show a UAC prompt, and replace any installed Ledger Wallet.
- By default the app uses the same data folder as an installed Ledger Wallet; set
  `LEDGER_CONFIG_DIRECTORY` to use another one.
