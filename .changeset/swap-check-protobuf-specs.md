---
"@ledgerhq/hw-app-exchange": minor
"@ledgerhq/live-common": patch
---

feat(swap): enrich the device's generic payload deserialization error with the exact Exchange app protobuf field that exceeds its limit

When the Exchange device app rejects a swap `NewTransactionResponse` with the generic `DESERIALIZATION_FAILED` (0x6a81) status, we now decode the payload locally and, if a field is larger than the device's protobuf `max_size` (mirrored from app-exchange `protocol.options`), surface a precise `SwapPayloadFieldExceedsLimit` carrying the field name, limit and actual size (e.g. an oversized `payin_extra_id`).

The device remains the source of truth: this check only runs **after** the device has already rejected the payload, never gates the flow, and silently falls back to the device's error if our hardcoded limits ever drift from the app. The user-facing flow and step (`PROCESS_TRANSACTION`) are unchanged; the added precision is only meant to speed up investigations.
