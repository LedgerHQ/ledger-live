# Mobile Test Mocks

Encrypted mock response files used by mitmproxy during Detox CI runs to
intercept Firebase Remote Config and Firebase Installations traffic.

## Files

| File | Platform | Contents |
|------|----------|----------|
| `firebase_feature_flags_ios.tar.gz.enc` | iOS | Firebase RC responses for iOS Detox |
| `firebase_feature_flags_android.tar.gz.enc` | Android | Firebase RC responses for Android Detox |
| `firebase_feature_flags.tar.gz.enc` | Shared | Shared Firebase RC responses |

Each `.tar.gz.enc` archive is AES-256-CBC encrypted with the `MITMPROXY_LOGS_KEY`
secret (available in CI via GitHub Actions secrets). When decrypted, each archive
contains a single `.json` file in the format expected by `mock_responses.py`.

## Mock file format

```json
{
  "https://firebaseremoteconfig.googleapis.com/v1/projects/*/namespaces/firebase:fetch": {
    "response": { "state": "UPDATE", "entries": { "feature_foo": "{\"enabled\":true}" } },
    "headers": { "content-type": "application/json; charset=UTF-8" }
  }
}
```

URL keys are matched without query parameters. A single `*` wildcard is supported
to match path segments (e.g. project IDs). Exact keys take precedence over
wildcard keys.

## Refreshing the mocks

Mock files should be refreshed when Firebase feature flags change in a way that
affects test behaviour.

**Steps:**

1. Temporarily remove `--mock-responses-file` from the mitmproxy start step in
   `test-mobile-mock-reusable.yml` so mitmproxy intercepts without replacing
   responses (passthrough mode).

2. Trigger a CI run. mitmproxy will record the live Firebase responses in
   `mitmproxy.flows`.

3. Download and decrypt the `mitmproxy-logs-detox-*` artifact:
   ```sh
   mise run mitmproxy:decrypt \
     --encrypt-key="$MITMPROXY_LOGS_KEY" \
     --file="mitmproxy-logs.tar.gz.enc" \
     --output-dir="."
   ```

4. Extract the Firebase RC responses from the flows using the mitmproxy Python
   library and save them as a JSON mock file.

5. Encrypt the new mock file and commit:
   ```sh
   tar -czf firebase_feature_flags_<platform>.tar.gz firebase_feature_flags_<platform>.json
   MITMPROXY_LOGS_KEY="..." openssl enc -aes-256-cbc -pbkdf2 \
     -pass env:MITMPROXY_LOGS_KEY \
     -in firebase_feature_flags_<platform>.tar.gz \
     -out apps/ledger-live-mobile/tests/mocks/firebase_feature_flags_<platform>.tar.gz.enc
   ```

## local/

The `local/` subdirectory holds decrypted mock files during CI runs. It is
gitignored — files there are produced at runtime by the `mitmproxy:decrypt`
task and cleaned up by the `mitmproxy:stop` task.
