import { TypeRegistry } from "@polkadot/types";
import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";

const registry = new TypeRegistry();

const extrinsicsMethod = jest.fn().mockImplementation(() => ({
  toHex: () => "Hex 4 extrinsicsMethod",
}));
(extrinsicsMethod as any).meta = {
  args: [],
};

const transactionParams = {
  blockHash: "0xb10c4a54",
  genesisHash: "0x83835154a54",
  blockNumber: 12,
  specVersion: 42,
  tip: 8,
  transactionVersion: 22,
};
jest.mock("../network", () => {
  return {
    getRegistry: () => {
      return Promise.resolve({
        registry: registry,
        extrinsics: {
          balances: {
            transferKeepAlive: extrinsicsMethod,
          },
        },
      });
    },
    getTransactionParams: (): Promise<Record<string, any>> => {
      return Promise.resolve(transactionParams);
    },
  };
});

describe("buildTransaction", () => {
  const mockCodec = jest.fn();
  const mockRegistry = jest.spyOn(registry, "createType");

  beforeEach(() => {
    mockRegistry.mockImplementation((type: string, ..._params: unknown[]) => {
      mockCodec.mockReturnValueOnce({
        toHex: () => `HexCodec 4 ${type}`,
      });
      return new mockCodec();
    });
  });

  afterEach(() => {
    mockRegistry.mockClear();
  });

  it("returns unsigned with account address provided", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ mode: "send" });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(mockRegistry).toHaveBeenCalledTimes(6);
    expect(mockRegistry).toHaveBeenCalledWith("BlockNumber", 12);
    expect(mockRegistry).toHaveBeenCalledWith("ExtrinsicEra", {
      current: 12,
      period: 64,
    });
    expect(mockRegistry).toHaveBeenCalledWith("u32", 42);
    expect(mockRegistry).toHaveBeenCalledWith("Compact<Balance>", 8);
    expect(mockRegistry).toHaveBeenCalledWith("u32", 22);
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
