# mitmproxy mise tasks

Four tasks for running [mitmproxy](https://mitmproxy.org/) as a transparent
intercepting proxy during tests. They handle the full lifecycle: starting the
proxy (with optional response mocking), stopping it, and encrypting/decrypting
the captured traffic for later analysis.

## Tasks

### `mitmproxy:start`

Installs and starts `mitmdump` in the background. Automatically:

- Generates the mitmproxy CA certificate if it doesn't already exist.
- Registers the certificate with the host OS trust store (macOS Keychain or
  Linux system CA store).
- Configures system-wide HTTP/HTTPS proxy settings.
- On GitHub Actions, also writes `http_proxy`, `https_proxy`,
  `NODE_EXTRA_CA_CERTS`, and `MITMPROXY_PID` to `$GITHUB_ENV` so that every
  subsequent step picks them up automatically.
- Optionally loads the `mock_responses` addon to intercept specific URLs and
  return pre-recorded JSON responses.

**Flags**

| Flag                           | Default         | Description                                                   |
| ------------------------------ | --------------- | ------------------------------------------------------------- |
| `--port`                       | `8080`          | Port mitmproxy listens on                                     |
| `--mock-responses-file <path>` | _(none)_        | JSON file of URL → response mappings (enables the mock addon) |
| `--setup-ios-simulator`        | `false`         | Install the CA cert into the iOS Simulator trust store        |
| `--setup-android-simulator`    | `false`         | Configure the Android emulator                                |
| `--ios-simulator-name`         | `iOS Simulator` | Name of the simulator to configure                            |
| `--android-simulator-name`     | `avd-emulator`  | Name of the emulator to configure                             |

Logs and flow captures are written to `~/.mitmproxy/logs/`.

**Examples**

```bash
# Basic — intercept all traffic, no mocks
mise run mitmproxy:start

# With mock responses — decrypt the feature flags first, then start with the decrypted file
mise run mitmproxy:decrypt \
  --encrypt-key="<MITMPROXY_LOGS_KEY>" \
  --file="apps/ledger-live-desktop/tests/mocks/firebase_feature_flags.tar.gz.enc" \
  --output-dir="apps/ledger-live-desktop/tests/mocks/local"
mise run mitmproxy:start --mock-responses-file="apps/ledger-live-desktop/tests/mocks/local/firebase_feature_flags.json"

# Custom port + iOS Simulator
mise run mitmproxy:start --port=9090 --setup-ios-simulator --ios-simulator-name="iPhone 15"
```

---

### `mitmproxy:stop`

Gracefully stops the mitmproxy process (SIGINT, then SIGKILL after 30 s),
removes the CA certificate from the system trust store, clears proxy
environment variables, and calls `mitmproxy:encrypt` to archive and encrypt
the captured logs.

**Flags**

| Flag                     | Env var              | Description                                |
| ------------------------ | -------------------- | ------------------------------------------ |
| `--mitmproxy-pid <pid>`  | `MITMPROXY_PID`      | PID of the running mitmdump process        |
| `--encrypt-key <string>` | `MITMPROXY_LOGS_KEY` | Passphrase used to encrypt the log archive |

Both flags are required. On GitHub Actions, `mitmproxy:start` writes
`MITMPROXY_PID` to `$GITHUB_ENV` automatically, so you don't need extra
plumbing.

**Examples**

```bash
# Using env vars (typical local workflow after `mise run mitmproxy:start`)
MITMPROXY_PID=12345 MITMPROXY_LOGS_KEY=my-secret mise run mitmproxy:stop

# Passing flags explicitly
mise run mitmproxy:stop --mitmproxy-pid=12345 --encrypt-key="my-secret"
```

---

### `mitmproxy:encrypt`

Archives and encrypts mitmproxy log files with AES-256-CBC (OpenSSL
`pbkdf2`). The task passes the key via the environment so it never appears
in the process list. `mitmproxy:stop` calls this task automatically, but you
can also run it standalone, for example to re-encrypt or encrypt a custom set
of files.

On GitHub Actions, the output path is written to `$GITHUB_OUTPUT` as
`mitmproxy_logs_archive`, making it available to subsequent steps.

**Flags**

| Flag                     | Env var              | Default                                       | Description                                |
| ------------------------ | -------------------- | --------------------------------------------- | ------------------------------------------ |
| `--encrypt-key <string>` | `MITMPROXY_LOGS_KEY` | _(required)_                                  | Encryption passphrase                      |
| `--out-file <string>`    |                      | `~/.mitmproxy/logs/mitmproxy-logs.tar.gz.enc` | Destination path for the encrypted archive |
| `[files...]`             |                      | `~/.mitmproxy/logs/mitmproxy.{log,flows}`     | Files to include in the archive            |

> **Note:** the flag is `--out-file`, not `--output`. `mise run` reserves `--output` / `-o` for its own output-format option, so using `--output` would be silently intercepted and cause a "Matching variant not found" error.

**Examples**

```bash
# Encrypt default logs
mise run mitmproxy:encrypt --encrypt-key="my-secret"

# Custom output path
mise run mitmproxy:encrypt --encrypt-key="my-secret" --out-file="/tmp/ci-logs.tar.gz.enc"

# Encrypt specific files
mise run mitmproxy:encrypt --encrypt-key="my-secret" /path/to/mitmproxy.log /path/to/mitmproxy.flows
```

---

### `mitmproxy:decrypt`

Decrypts and extracts an archive produced by `mitmproxy:encrypt`. Use this
locally to inspect traffic captured in CI.

**Flags**

| Flag                     | Env var              | Default                 | Description                         |
| ------------------------ | -------------------- | ----------------------- | ----------------------------------- |
| `--file <path>`          |                      | _(required)_            | Path to the `.tar.gz.enc` archive   |
| `--encrypt-key <string>` | `MITMPROXY_LOGS_KEY` | _(required)_            | Decryption passphrase               |
| `--output-dir <path>`    |                      | `.` (current directory) | Directory where files are extracted |

**Examples**

```bash
# Decrypt into the current directory
mise run mitmproxy:decrypt --file="mitmproxy-logs.tar.gz.enc" --encrypt-key="my-secret"

# Decrypt into a specific directory
mise run mitmproxy:decrypt \
  --file="mitmproxy-logs.tar.gz.enc" \
  --encrypt-key="my-secret" \
  --output-dir="/tmp/mitmproxy-logs"
```

---

## Mock responses

The `mock_responses.py` addon, enabled by `--mock-responses-file`, intercepts
outbound requests and returns stored JSON responses without hitting the
network. The addon matches on the URL path only — it ignores query parameters
such as API keys and tokens.

The JSON file maps URLs to response bodies:

```json
{
  "https://firebaseremoteconfig.googleapis.com/v1/projects/my-project/namespaces/firebase:fetch": {
    "headers": {},
    "response": {
      "entries": {
        "feature_counter_value": "{\"enabled\":true}",
        "feature_discover": "{ \"enabled\": true, \"params\": { \"version\": \"2\" } }"
      },
      "state": "UPDATE",
      "templateVersion": "264"
    }
  }
}
```

Example files live in `apps/ledger-live-desktop/tests/mocks/`.

---

## Usage in CI

The tasks are used in the `e2e-tests-linux` job ("Ubuntu Mock") in
`.github/workflows/test-desktop-reusable.yml`:

```yaml
- name: Start mitmproxy
  run: mise run mitmproxy:start --mock-responses-file="apps/ledger-live-desktop/tests/mocks/firebase_feature_flags.json"

- name: Run playwright tests [Linux => xvfb-run]
  id: tests
  run: xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" -- pnpm desktop test:playwright

- name: Stop mitmproxy
  id: stop-mitmproxy
  if: ${{ !cancelled() }}
  run: mise run mitmproxy:stop --encrypt-key="${{ secrets.MITMPROXY_LOGS_KEY }}"

- name: Upload mitmproxy logs
  if: ${{ !cancelled() && steps.stop-mitmproxy.outputs.mitmproxy_logs_archive != '' }}
  uses: actions/upload-artifact@v4
  with:
    name: mitmproxy-logs
    path: ${{ steps.stop-mitmproxy.outputs.mitmproxy_logs_archive }}
    retention-days: 1
```

`mitmproxy:start` writes `MITMPROXY_PID` to `$GITHUB_ENV`, so `mitmproxy:stop`
picks it up automatically in the next step. `mitmproxy:encrypt` (called
internally by `mitmproxy:stop`) writes the encrypted archive path to
`$GITHUB_OUTPUT` as `mitmproxy_logs_archive`.

To inspect logs from a failed CI run, download the `mitmproxy-logs` artifact,
then run:

```bash
MITMPROXY_LOGS_KEY="<secret>" mise run mitmproxy:decrypt \
  --file="mitmproxy-logs.tar.gz.enc" \
  --output-dir="./ci-logs"
```

---

## Local workflow

```bash
# 1. Decrypt the feature flags into the local folder (gitignored)
mise run mitmproxy:decrypt \
  --encrypt-key="<MITMPROXY_LOGS_KEY>" \
  --file="apps/ledger-live-desktop/tests/mocks/firebase_feature_flags.tar.gz.enc" \
  --output-dir="apps/ledger-live-desktop/tests/mocks/local"

# 2. Start the proxy with the decrypted mock responses
mise run mitmproxy:start \
  --mock-responses-file="apps/ledger-live-desktop/tests/mocks/local/firebase_feature_flags.json"

# 3. Run your app or tests — traffic is now proxied
pnpm desktop test:playwright

# 4. Stop and encrypt logs
MITMPROXY_PID=<pid printed by start> \
MITMPROXY_LOGS_KEY=local-dev-key \
  mise run mitmproxy:stop

# 5. Inspect the captured flows
mise run mitmproxy:decrypt \
  --file="$HOME/.mitmproxy/logs/mitmproxy-logs.tar.gz.enc" \
  --encrypt-key="local-dev-key" \
  --output-dir="./logs"

# Open the flow file in mitmweb for interactive inspection
mitmweb -r ./logs/mitmproxy.flows
```
