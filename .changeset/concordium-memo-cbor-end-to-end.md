---
"@ledgerhq/concordium-core": minor
"@ledgerhq/coin-concordium": minor
---

Carry a PLT memo as CBOR, the way a CCD memo already is

A PLT memo went on chain as raw UTF-8 while a CCD memo went as a CBOR text
string. The chain types them identically — a CBOR value in `Memo` under one
256-byte cap — and only the envelope differs, so the codec is now shared.

`encodePltMemo` emits `tag 24(byte string(CBOR text string))`; tag 24 declares
the content to be CBOR, which the previous untagged bytes denied. Both paths
bound the memo with `MAX_MEMO_LENGTH` (254), leaving room for the CBOR header;
`PLT_MAX_MEMO_SIZE` is gone. The device app's PLT screen does not decode the
content yet, so the wallet side lands first and the two ship together.

`decodeMemoFromCbor` now requires the value to fill the buffer and reads
integers as well as text strings. Without the first, `616263` decoded to `"b"`.

PLT reads try CBOR and fall back to printable text, since the node strips the
tag and the proxy reports bare bytes either way — so earlier memos still
display. Integers are excluded there: `"0"` through `"7"` are `0x30`-`0x37`,
CBOR major type 1, so a single-digit reference would read as `-17` through
`-24`. The reverse holds for the rarer case, a negative integer reading as its
printable head byte. Nothing separates the two, and text is what senders write.
