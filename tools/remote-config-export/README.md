# Remote config export

Export the production Firebase Remote Config, as each app receives it, and compare it to the code defaults.

The daily workflow `.github/workflows/remote-config-export-scheduled.yml` runs these scripts.

## How it works

1. `dump-defaults.ts` writes the type and default of every key in `liveConfig` (`libs/ledger-live-common/src/config/sharedConfig.ts`).
2. `fetch-remote-config.mjs` fetches the Remote Config for each preset in `presets.mjs`: `lwd`, `lwm-android` and `lwm-ios`.
   It uses the public client API keys shipped in the apps, like the Firebase SDKs do. No credentials are needed.
3. `build-report.mjs` merges the remote values into the defaults, the same way `LiveConfig.getValueByKey` does. It writes:
   - `<preset>.json`: the effective config of the preset. For each `config_*` key, it gives the value, its source (`remote` or `default`) and both inputs. It also lists the feature flags.
   - `report.json` and `summary.md`: invalid statuses, statuses changed by remote, remote keys unknown to the code and differences between presets.

## Limits

- Each preset uses a fixed Firebase installation ID. So it always gets the same bucket of a percent rollout.
- Conditions on country depend on the IP address of the runner.
- The client fetch endpoint is not documented by Firebase. The fetch step fails if the response shape changes.

## Run locally

```sh
cd libs/ledger-live-common
node --import tsx ../../tools/remote-config-export/dump-defaults.ts /tmp/remote-config-export/defaults.json
cd ../..
node tools/remote-config-export/fetch-remote-config.mjs /tmp/remote-config-export
node tools/remote-config-export/build-report.mjs /tmp/remote-config-export
```

## S3 publication

The workflow publishes to S3 only when the repository variables `REMOTE_CONFIG_EXPORT_ROLE_ARN`, `REMOTE_CONFIG_EXPORT_REGION` and `REMOTE_CONFIG_EXPORT_BUCKET` are set. Files go to `remote-config/latest/` and `remote-config/history/<date>/`.
