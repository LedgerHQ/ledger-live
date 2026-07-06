---
"@ledgerhq/live-common": patch
"live-mobile": patch
---

Guard mobile charts (line, ring, balance graph, distribution) and market chart series against non-finite values so invalid data points no longer produce broken SVG paths.
