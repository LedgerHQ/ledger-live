import { validateAddress, validateMemo, validatePrincipal } from "./validation";

const VALID_ADDRESS = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";
const VALID_PRINCIPAL = "qmja6-ma7bq-kxeep-f3lpi-bmu4n-aefcl-xpc5o-iqbsi-5wi5u-b37vi-wae";

describe("validateAddress", () => {
  it("accepts a valid account identifier", () => {
    expect(validateAddress(VALID_ADDRESS).isValid).toBe(true);
  });

  // Mirrors AccountIdentifier.fromHex: only non-hex or empty input is rejected. The CRC32
  // checksum is not verified, so any well-formed hex is accepted.
  it.each(["nothex", "zz", ""])("rejects non-hex address %p", address => {
    const result = validateAddress(address);
    expect(result.isValid).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});

describe("validatePrincipal", () => {
  it("accepts a valid principal", () => {
    expect(validatePrincipal(VALID_PRINCIPAL).isValid).toBe(true);
  });

  it("rejects an invalid principal", () => {
    const result = validatePrincipal("not-a-principal");
    expect(result.isValid).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});

describe("validateMemo", () => {
  it.each(["0", "42", "18446744073709551615", undefined])("accepts %p", memo => {
    expect(validateMemo(memo).isValid).toBe(true);
  });

  it.each(["-1", "18446744073709551616", "abc", "1.5"])("rejects %p", memo => {
    expect(validateMemo(memo).isValid).toBe(false);
  });
});
