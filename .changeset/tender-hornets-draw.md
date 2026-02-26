---
"@ledgerhq/psbtv2": patch
---

fix: correct previous transaction ID handling in PsbtV2

#### What changed
- Updated `PsbtV2.addInputsFromV0` txid handling logic in `libs/psbtv2/src/psbtv2.ts`
- Adjusted `fromV0.test.ts` expected values to match canonical txid behavior

#### Impact
- Prevents incorrect previous output references caused by byte-order mismatch.
- Aligns PSBTv0 -> PSBTv2 conversion behavior with expected transaction ID encoding.
