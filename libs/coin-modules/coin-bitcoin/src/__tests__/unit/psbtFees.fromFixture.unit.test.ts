import { feeFromPsbtBase64 } from "../../psbtFees";

/*
 * NOTE: in all psbts below, the fee is 5000 since:
 * The input has a WITNESS_UTXO amount: first 8 bytes of data = 20 4e 00 00 00 00 00 00 (little-endian) → 0x0000000000004e20 = 20,000 sats.
 * The output AMOUNT is 98 3a 00 00 00 00 00 00 (little-endian) → 0x0000000000003a98 = 15,000 sats.
 * Fee = Σinputs − Σoutputs = 20,000 − 15,000 = 5,000 sats.
 * all the psbts where generated from https://learnmeabitcoin.com/technical/transaction/psbt/
 *
 */

describe("feeFromPsbtBase64 (PSBT v2 via PsbtV2)", () => {
  it("parses the v2 PSBT (signer stage) and returns the correct fee", () => {
    // signer stage, decode it https://learnmeabitcoin.com/technical/transaction/psbt/
    const psbtB64 =
      "cHNidP8BAgQCAAAAAQMEAAAAAAEEAQEBBQEBAQYBAAH7BAIAAAAAAQEfIE4AAAAAAAAWABRtTfPDGS0+/pTZAN6itD4d+v/DdyICAoHczplgGVV4+rXYBtC/VsKfZU8OhrrUST2++hq4Lzy9SDBFAiEAisjYLjV0afIPV8fNtfKDEep5qWE+Q4ykeLRVQFMVhJsCIE9Q+4CcW6Cwmnuox4kYpUocoFIWp8pa2OGcuf801ecvAQEOIBpm0EPKluAy05yTYGzOS3gm/qhPQLDCSWqQpVE2pyVMAQ8EAQAAAAABAwiYOgAAAAAAAAEEFgAUgOCAoBDcwBoMygQ0Q5VYjll5FTgA";

    const fee = feeFromPsbtBase64(psbtB64);
    expect(fee!.toNumber()).toBe(5000);
  });

  it("parses the v2 PSBT (input finalizer stage) and returns the correct fee", () => {
    // input finalizer stage, decode it https://learnmeabitcoin.com/technical/transaction/psbt/
    const psbtB64 =
      "cHNidP8BAgQCAAAAAQMEAAAAAAEEAQEBBQEBAQYBAAH7BAIAAAAAAQEfIE4AAAAAAAAWABRtTfPDGS0+/pTZAN6itD4d+v/DdwEIbAJIMEUCIQCKyNguNXRp8g9Xx8218oMR6nmpYT5DjKR4tFVAUxWEmwIgT1D7gJxboLCae6jHiRilShygUhanylrY4Zy5/zTV5y8BIQKB3M6ZYBlVePq12AbQv1bCn2VPDoa61Ek9vvoauC88vQEOIBpm0EPKluAy05yTYGzOS3gm/qhPQLDCSWqQpVE2pyVMAQ8EAQAAAAABAwiYOgAAAAAAAAEEFgAUgOCAoBDcwBoMygQ0Q5VYjll5FTgA";

    const fee = feeFromPsbtBase64(psbtB64);
    expect(fee!.toNumber()).toBe(5000);
  });
});
