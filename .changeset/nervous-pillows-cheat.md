---
"@ledgerhq/hw-app-exchange": patch
"@ledgerhq/live-common": patch
---

Added support for fund providers in test mode.

Fixed an issue with payload generation so it supports the fund flow as written in our documentation.

Added validation to our decodePayload method (used in the exchangeSDK) so we can fail early if it is not in the format we require
