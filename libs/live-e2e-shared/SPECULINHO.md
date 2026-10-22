# Speculinho (remote Speculos)

Speculinho is the infra service that starts Speculos instances on demand. E2E suites use it through [`src/speculosCI.ts`](src/speculosCI.ts) when `REMOTE_SPECULOS=true`. Local runs use Docker by default, which stays the recommended setup. Use Speculinho locally to debug a CI run on the same Speculos setup, or when Docker can't run Speculos.

## Run locally

You need the infra VPN and the Speculinho operator URL; ask the infra or QAA team for it. Check that you can reach it:

```bash
curl "$SPECULINHO_URL/_version"
```

Set up the suite as its README describes ([desktop](../../e2e/desktop/README.md), [mobile](../../e2e/mobile/README.md)), then add:

```bash
export REMOTE_SPECULOS=true
export SPECULINHO_URL=<Speculinho operator URL>
```

Run the tests with the usual commands. Compared with Docker:

- `SEED` is still required: Speculinho starts each Speculos with it.
- `COINAPPS` isn't used: Speculinho images ship the coin apps.
- Only the tag of `SPECULOS_IMAGE_TAG` is used, as the Speculos version (`latest` when unset). Docker tags such as `v0.27.1` don't exist on Speculinho. nanoS needs the snapshot tag the E2E workflows set (`.github/workflows/test-ui-e2e-only-desktop.yml`, `.github/workflows/test-mobile-e2e-reusable.yml`).

## Sessions

Each Speculos is a session named by its `run_id` (`<app>-lw-local-<id>` locally, `-lw-ci-` in CI). The suite acquires it with `POST /acquire`, waits for `/status/<run_id>` to report it ready, and releases it at the end of the test.

Sessions are protected: Speculinho returns a session token, and every request about the session (`/status`, `/logs`, `/release` and the Speculos URL itself) must carry it as `Authorization: Bearer <token>`. A browser therefore can't open the Speculos URL; see [Watch the device](#watch-the-device). An operator without protected sessions makes the suite warn `Speculinho sessions are not protected` and carry on without tokens.

The suite keeps each token in memory and, for other processes such as the mobile teardown, in `ledger-live-speculinho-sessions/<run_id>` under the system temp directory, readable by your user only. The file is deleted on release.

## Debug a session

Failed tests attach the session's Speculos logs to the Allure report before releasing it; mobile also attaches its status.

While a test runs, you can query its session yourself:

```bash
RUN_ID=<run_id from the test output>
TOKEN_FILE="$(node -p 'require("os").tmpdir()')/ledger-live-speculinho-sessions/$RUN_ID"
curl -H "Authorization: Bearer $(cat "$TOKEN_FILE")" "$SPECULINHO_URL/status/$RUN_ID"
curl -H "Authorization: Bearer $(cat "$TOKEN_FILE")" "$SPECULINHO_URL/logs/$RUN_ID"
```

Common failures:

- **`Timeout: …/status/<run_id> did not become ready within …ms`**: the Speculos never started. Most often its pod can't pull its image, because of a `SPECULOS_IMAGE_TAG` Speculinho doesn't have or a registry problem on the infra side. `/status/<run_id>` shows the pod error while the session exists.
- **`Speculinho rejected the session token`**: `/status` answered 401 to the session's token, so the suite stopped waiting for it.
- **`/acquire` fails**: when Speculinho is at its instance cap, which every CI and QAA run shares, the test fails without retrying. `$SPECULINHO_URL/_metrics` shows the load (`speculinho_active_instances`, `speculinho_capacity_rejections_total`).

## Watch the device

To watch the device during a local run, on Docker or Speculinho, `export SPECULOS_SCREEN=web` or `SPECULOS_SCREEN=vnc` (ignored in CI). Each test then opens a view of its device once it is ready (on mobile, its main Speculos once the app is connected to it):

- `web` opens the Speculos web page in your browser. On Speculinho the page goes through a proxy on `127.0.0.1` that keeps the session token to itself: the browser signs in through a single-use link and needs service workers, which Firefox private windows lack.
- `vnc` opens macOS Screen Sharing; on other systems the address and password are logged. On Speculinho it goes through a local bridge to the session's VNC websocket, which needs operator 2.0.0 with chart 0.6.0; without them the run carries on without a viewer. Each session has 4 viewer slots, and the gateway cuts connections after 10 minutes, so reconnect from Screen Sharing if the window goes blank.

Watching is safe, but pressing buttons while the test drives the device will throw it off. Each test opens its own view, so on desktop run a single spec with `--workers 1`.

## CI

CI reads the operator URL from the `SPECULINHO_URL` secret.

- Mobile E2E always uses Speculinho.
- The desktop E2E workflow uses Docker unless it is dispatched with `remote_speculos`. The desktop smoke job uses Speculinho when its caller passes `SPECULINHO_URL`.
