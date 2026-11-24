# Auto-upgrade

Build a base version and a minor update, serve them from a local signed feed, then open the base so
it upgrades. From `apps/ledger-live-desktop`:

```bash
node tools/testing/autoupgrade.mts        # manual: restart or quit the app to install, Ctrl+C when done
node tools/testing/autoupgrade-test.mts   # automated: quits the app, checks the install, prints PASS or FAIL
```

When the app quits, `autoupgrade.mts` waits for Return to open it again with the same feed, for
example to check the installed version. After a restart to install, the updater reopens the app
itself: Return then only focuses it.

| Option                    | Effect                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `--update-from-feed`      | Rebuild the base only, reuse the update from `dist/feed`               |
| `--from-feed`             | Rebuild nothing, reuse both builds from `dist/feed`                    |
| `--bad-signature`         | Sign the update with a key the app does not trust: it must not install |
| `--corrupted-update`      | Serve a corrupted copy of the update: it must download but not install |
| `--download-speed <MB/s>` | Serve the feed at this speed to watch the download (manual only)       |

## Examples

```bash
# After changing the updater code: rebuild the base only
node tools/testing/autoupgrade.mts --update-from-feed

# Run again without rebuilding
node tools/testing/autoupgrade.mts --from-feed

# Then check that an update with a bad signature does not download
node tools/testing/autoupgrade.mts --from-feed --bad-signature

# Check that a corrupted download of the update is not installed
node tools/testing/autoupgrade.mts --from-feed --corrupted-update

# Watch the update download at 2 MB/s
node tools/testing/autoupgrade.mts --from-feed --download-speed 2
```

## Prerelease builds

`preprod-auto-upgrade.mts` downloads a build from https://download.live.ledger.com, installs it
like the local builds and opens it. The build updates from the real feed to the version the
platform's `next` yml announces. Its hash file and signature come from a local copy of the
prerelease signature feed, served as the app's `UPDATE_CHECK_FEED`. Nothing checks the result:
watch the app.

```bash
node tools/testing/preprod-auto-upgrade.mts ledger-live-desktop-4.30.0-next.0-mac.zip
node tools/testing/preprod-auto-upgrade.mts ledger-live-desktop-4.30.0-next.0-mac.zip --bad-signature
```

Pass the `-mac.zip` build on macOS, the `.AppImage` on Linux and the `-win-x64.exe` on Windows. It
must be a prerelease older than the update: a release ignores `UPDATE_CHECK_FEED`, and the latest
prerelease has no update.

With `--bad-signature`, the local feed replaces the signature with one from an ephemeral key. The
app must show an update error and not download the update.

## Before running

- Quit any running Ledger Wallet.
- macOS: the builds are signed with the code signing identity found in your keychain.
- Each run deletes the updater's pending download, in `ledger-live-desktop-updater/pending` under
  the user cache folder, so the app downloads the update again. An installed Ledger Wallet uses the
  same folder.
- Linux: the scripts run the AppImage, which needs `libfuse2` like any packaged LWD.
- Windows: installing and updating show a UAC prompt, and replace any installed Ledger Wallet.
- By default the app uses the same data folder as an installed Ledger Wallet; set
  `LEDGER_CONFIG_DIRECTORY` to use another one.
