import { Hex, generateSignedTransaction } from "@aptos-labs/ts-sdk";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { combine } from "../../logic/combine";

const hexRawTx =
  "0xfdde1012c0fac1f9a121eb3c8481c90d473df1c4180c070bd4f2549a6d06180400000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002203f5f0fcc8a909f23806e5efbdc1757e653fcd744de516a7de12b99b8417925c1080a00000000000000400d03000000000064000000000000002c721b6800000000b7";

jest.mock("@aptos-labs/ts-sdk", () => {
  const originalModule = jest.requireActual("@aptos-labs/ts-sdk");
  return {
    ...originalModule,
    generateSignedTransaction: jest
      .fn()
      .mockImplementation(() => Hex.fromHexString(hexRawTx).toUint8Array()),
  };
});

describe("combine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throws an error when no public key is provided", async () => {
    const account = createFixtureAccount();
    const signature = "0x7aa193705193f4";

    expect(() => combine(hexRawTx, signature, account.xpub)).toThrow(
      "account must have a public key",
    );

    expect(generateSignedTransaction).not.toHaveBeenCalled();
  });

  it("should throws an error when no valid hex value is provided for signature", async () => {
    const account = createFixtureAccount();
    const signature = "signature";

    expect(() => combine(hexRawTx, signature, account.xpub)).toThrow(
      "signature must be a valid hex value",
    );

    expect(generateSignedTransaction).not.toHaveBeenCalled();
  });

  it("should throws an error when no valid hex value is provided for tx", async () => {
    const account = createFixtureAccount();
    const signature = "0x7aa193705193f4";

    expect(() => combine("tx", signature, account.xpub)).toThrow("tx must be a valid hex value");

    expect(generateSignedTransaction).not.toHaveBeenCalled();
  });

  it("should sign a transaction", async () => {
    const signature =
      "0xbcdf10dc816488eca24b108056e2109220542f599caa4d81ac54556d63a777636ded8cafe972f68657bbee176f398cf332030df0f1dc2235f8f3d39456a5b90c";
    const account = createFixtureAccount();
    account.xpub = "0xb69a68cc64f7aa193705193f4dd598320a0a74baf7e4b50c9980c5bd60a82390";

    const result = combine(hexRawTx, signature, account.xpub);

    expect(generateSignedTransaction).toHaveBeenCalledTimes(1);
    expect(result).not.toBe("");
  });
});
