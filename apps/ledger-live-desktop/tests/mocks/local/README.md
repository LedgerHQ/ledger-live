# local/

This folder holds decrypted feature flag mock files for local development and
testing. **Everything here except this README is gitignored and must never be
committed or pushed.**

## Purpose

The encrypted archive `../firebase_feature_flags.tar.gz.enc` contains real
Firebase Remote Config responses used by the mitmproxy mock addon. Decrypt it
here to use those responses when running tests locally.

## Setup

You need the decryption key (`MITMPROXY_LOGS_KEY`). Ask a team member or look
it up in the CI secrets.

```bash
mise run mitmproxy:decrypt \
  --file="apps/ledger-live-desktop/tests/mocks/firebase_feature_flags.tar.gz.enc" \
  --encrypt-key="<MITMPROXY_LOGS_KEY>" \
  --output-dir="apps/ledger-live-desktop/tests/mocks/local"
```

## Usage

Pass the decrypted file to `mitmproxy:start` via `--mock-responses-file`:

```bash
mise run mitmproxy:start \
  --mock-responses-file="apps/ledger-live-desktop/tests/mocks/local/firebase_feature_flags.json"
```

See `.mise/tasks/mitmproxy/README.md` for the full mitmproxy workflow.
