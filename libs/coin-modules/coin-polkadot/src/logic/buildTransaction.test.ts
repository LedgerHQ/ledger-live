import { TypeRegistry } from "@polkadot/types";
import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";

const registry = new TypeRegistry();

const mockExtrinsicsMethod = jest.fn().mockImplementation(() => ({
  toHex: () => "Hex 4 extrinsicsMethod",
}));
(mockExtrinsicsMethod as any).meta = {
  args: [],
};

const mockGetTransactionParams = jest.fn();

jest.mock("../network", () => {
  return {
    getRegistry: () => {
      return Promise.resolve({
        registry: registry,
        extrinsics: {
          balances: {
            transferKeepAlive: mockExtrinsicsMethod,
          },
        },
      });
    },
    getTransactionParams: () => mockGetTransactionParams(),
  };
});

describe("buildTransaction", () => {
  const spyRegistry = jest.spyOn(registry, "createType");

  afterEach(() => {
    spyRegistry.mockClear();
  });

  it("returns unsigned with account address provided", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ mode: "send" });
    const mockCodec = jest.fn();
    spyRegistry.mockImplementation((type: string) => {
      mockCodec.mockReturnValueOnce({
        toHex: () => `HexCodec 4 ${type}`,
      });
      return new mockCodec();
    });
    mockGetTransactionParams.mockResolvedValueOnce({
      blockHash: "0xb10c4a54",
      genesisHash: "0x83835154a54",
      blockNumber: 12,
      specVersion: 42,
      tip: 8,
      transactionVersion: 22,
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(spyRegistry).toHaveBeenCalledTimes(6);
    expect(spyRegistry).toHaveBeenCalledWith("BlockNumber", 12);
    expect(spyRegistry).toHaveBeenCalledWith("ExtrinsicEra", {
      current: 12,
      period: 64,
    });
    expect(spyRegistry).toHaveBeenCalledWith("u32", 42);
    expect(spyRegistry).toHaveBeenCalledWith("Compact<Balance>", 8);
    expect(spyRegistry).toHaveBeenCalledWith("u32", 22);
    expect(mockCodec).toHaveBeenCalledTimes(6);
    const expectedResult = {
      registry: registry,
      unsigned: {
        address: account.freshAddress,
        blockHash: "0xb10c4a54",
        genesisHash: "0x83835154a54",
        method: "Hex 4 extrinsicsMethod",
        signedExtensions: [
          "CheckVersion",
          "CheckGenesis",
          "CheckEra",
          "CheckNonce",
          "CheckWeight",
          "ChargeTransactionPayment",
          "CheckBlockGasLimit",
        ],
        blockNumber: "HexCodec 4 BlockNumber",
        era: "HexCodec 4 ExtrinsicEra",
        nonce: "HexCodec 4 Compact<Index>",
        specVersion: "HexCodec 4 u32",
        tip: "HexCodec 4 Compact<Balance>",
        transactionVersion: "HexCodec 4 u32",
        version: 4,
      },
    };
    expect(result).toEqual(expectedResult);
  });
});
