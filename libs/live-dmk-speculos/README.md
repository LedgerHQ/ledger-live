# live-dmk-speculos

DMK transport adapter for Speculos, Ledger's hardware wallet emulator. Enables automated tests and CI pipelines to run full device-interaction flows without physical Ledger hardware by connecting the Device Management Kit to a running Speculos instance over HTTP/WebSocket.

## What it does

- Implements the DMK `Transport` interface targeting a Speculos emulator endpoint
- Allows CI and integration tests to exercise device-action flows end-to-end

## Key exports / concepts

- `transport/` — Speculos HTTP/WebSocket transport implementing the DMK transport interface

## Usage context

Used in test and CI environments by `libs/coin-tester-modules`, `libs/coin-tester`, and related integration test setups. Not imported by `apps/ledger-live-desktop` or `apps/ledger-live-mobile` in production.
