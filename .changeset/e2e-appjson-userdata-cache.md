---
"@ledgerhq/live-common": minor
"@ledgerhq/live-cli": minor
---

e2e: pre-generate and reuse app.json userdata and receive addresses (account + dedicated UTXO caches) so desktop and mobile E2E skip live Speculos account scanning. Adds a daily cache-generation workflow, CLI generator commands, and a release-validation guard that keeps release runs (desktop build_type=js, mobile production_firebase) on the legacy live scan; coins missing from the cache fall back to the live scan (QAA-1285).
