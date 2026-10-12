import { memo } from "./memo";

// Unified Addresses built with the forward F4Jumble encoder of coin-zcash's tests
// (src/__tests__/fixtures/unifiedAddress.ts): HRP "utest" with an Orchard receiver, and with a
// single transparent receiver.
const UTEST_ORCHARD =
  "utest1hap277en6ayclu5027232d44kv0s6nd0tacmnj07v0avarpuv4vzyfjreu3qexw05v9jvpx8ce37lpt5j4qexyrwhrlrma9msypee8x4";
const UTEST_TRANSPARENT_ONLY =
  "utest18kxtgdnr2xah44dsf0lfn62yzmc8u832drmfnqxnc3aazwppkhr59j29nmss2ycr356";

describe("zcash memo descriptor", () => {
  it("applies to a testnet unified address with an Orchard receiver", () => {
    expect(memo.appliesToRecipient?.(UTEST_ORCHARD)).toBe(true);
  });

  it.each([UTEST_TRANSPARENT_ONLY, "not-an-address", ""])("does not apply to %s", recipient => {
    expect(memo.appliesToRecipient?.(recipient)).toBe(false);
  });
});
