---
"@ledgerhq/coin-concordium": patch
---

Decode PLT memos from the bytes the proxy reports

The proxy unwraps the CBOR byte string a PLT memo is held in, so it arrives as raw bytes
while a native CCD memo keeps its CBOR header. Decoding both as CBOR read the memo's first
byte as a length header and dropped the memo from history. PLT memos now decode as UTF-8;
invalid UTF-8 yields no memo rather than replacement characters.
