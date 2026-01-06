import BigNumber from "bignumber.js";
import { parseExtendedPublicKey } from "../kaspaAddresses";
import { scanUtxos } from "../scanUtxos";

// Module-level mocks for network functions
const mockGetBalancesForAddresses = jest.fn();
const mockGetAddressesActive = jest.fn();
const mockGetUtxosForAddresses = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getBalancesForAddresses: (...args: unknown[]) => mockGetBalancesForAddresses(...args),
  getAddressesActive: (...args: unknown[]) => mockGetAddressesActive(...args),
  getUtxosForAddresses: (...args: unknown[]) => mockGetUtxosForAddresses(...args),
}));

describe("scan UTXOs function", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Gets information about addresses being active or not", async () => {
    const xpub =
      "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563";
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));

    mockGetBalancesForAddresses
      .mockResolvedValueOnce([
        {
          address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
          balance: 132655819913451,
        },
        {
          address: "kaspa:qpy2dzp9znrrwqsmxgrj3glqy8dz7nyg6tatcfuy5ku7srkryju3gpmwuar8a",
          balance: 132655819913451,
        },
      ])
      .mockResolvedValue([]);

    mockGetAddressesActive
      .mockResolvedValueOnce([
        {
          address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
          active: true,
          lastTxBlockTime: 1755003516811,
        },
        {
          address: "kaspa:qpy2dzp9znrrwqsmxgrj3glqy8dz7nyg6tatcfuy5ku7srkryju3gpmwuar8a",
          active: true,
          lastTxBlockTime: 1755003516812,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);

    mockGetUtxosForAddresses.mockResolvedValue([
      {
        address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
        outpoint: {
          transactionId: "4a63914664e1de0f0da172fdf684a15553949a3bfddd00b4ded8232ae459a28b",
          index: 0,
        },
        utxoEntry: {
          amount: BigNumber("100000000"),
          scriptPublicKey: {
            scriptPublicKey: "202c0b0a4c1f84e31b7234adb319ae970b6943592f0eae5e8513fcc476d0d211a5ac",
          },
          blockDaaScore: "62643316",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
        outpoint: {
          transactionId: "81a61a5c2fca2aadcca03a3a49288febcbe2f0f75e7420c675e82d66b9bddd54",
          index: 0,
        },
        utxoEntry: {
          amount: BigNumber("100000000"),
          scriptPublicKey: {
            scriptPublicKey: "202c0b0a4c1f84e31b7234adb319ae970b6943592f0eae5e8513fcc476d0d211a5ac",
          },
          blockDaaScore: "29537014",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qpy2dzp9znrrwqsmxgrj3glqy8dz7nyg6tatcfuy5ku7srkryju3gpmwuar8a",
        outpoint: {
          transactionId: "81a61a5c2fca2aadcca03a3a49288febcbe2f0f75e7420c675e82d66b9bddd54",
          index: 0,
        },
        utxoEntry: {
          amount: BigNumber("100000000"),
          scriptPublicKey: {
            scriptPublicKey: "202c0b0a4c1f84e31b7234adb319ae970b6943592f0eae5e8513fcc476d0d211a5ac",
          },
          blockDaaScore: "29537014",
          isCoinbase: false,
        },
      },
    ]);

    const { utxos } = await scanUtxos(compressedPublicKey, chainCode);

    expect(utxos.length).toBe(3);
  });
});

describe("Error while scanning UTXOs", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Gets information about addresses being active or not", async () => {
    const xpub =
      "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563";
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));

    mockGetBalancesForAddresses.mockResolvedValue([]);
    mockGetAddressesActive.mockResolvedValue([]);
    mockGetUtxosForAddresses.mockResolvedValue([
      {
        address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
        outpoint: {
          transactionId: "4a63914664e1de0f0da172fdf684a15553949a3bfddd00b4ded8232ae459a28b",
          index: 0,
        },
        utxoEntry: {
          amount: BigNumber("100000000"),
          scriptPublicKey: {
            scriptPublicKey: "202c0b0a4c1f84e31b7234adb319ae970b6943592f0eae5e8513fcc476d0d211a5ac",
          },
          blockDaaScore: "62643316",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
        outpoint: {
          transactionId: "81a61a5c2fca2aadcca03a3a49288febcbe2f0f75e7420c675e82d66b9bddd54",
          index: 0,
        },
        utxoEntry: {
          amount: BigNumber("100000000"),
          scriptPublicKey: {
            scriptPublicKey: "202c0b0a4c1f84e31b7234adb319ae970b6943592f0eae5e8513fcc476d0d211a5ac",
          },
          blockDaaScore: "29537014",
          isCoinbase: false,
        },
      },
    ]);

    await expect(scanUtxos(compressedPublicKey, chainCode)).rejects.toThrow(
      "not found in addresses set",
    );
  });
});
