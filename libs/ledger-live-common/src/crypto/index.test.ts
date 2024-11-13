import { bip32asBuffer } from ".";

describe("bip32asBuffer", () => {
  it.each([
    {
      name: "Simple",
      derivationPath: "m/44'/1/1/0",
      expectedResult: "048000002c000000010000000100000000",
    },
    {
      name: "Hardened coin type",
      derivationPath: "m/44'/1'/1/0",
      expectedResult: "048000002c800000010000000100000000",
    },
    {
      name: "Hardened account",
      derivationPath: "m/44'/1'/1'/0",
      expectedResult: "048000002c800000018000000100000000",
    },
  ])("converts path for AppCoins with $name case", ({ derivationPath, expectedResult }) => {
    const path = bip32asBuffer(derivationPath);
    expect(path).toEqual(Buffer.from(expectedResult, "hex"));
  });
});
