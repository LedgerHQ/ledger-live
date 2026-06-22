---
"@ledgerhq/web-tools": patch
---

chore: migrate web-tools trustchain to the DMK (Device Management Kit) WebHID transport and drop the legacy hw-transport-* dependencies (webhid, web-ble, http). Discovery uses DMK startDiscovering (WebHID picker) and APDUs are bridged through DmkCompatTransport. The WebBLE and proxy device options are removed as they have no DMK web equivalent.
