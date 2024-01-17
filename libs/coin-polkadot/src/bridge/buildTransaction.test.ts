import BigNumber from "bignumber.js";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import { PolkadotAccount, PolkadotOperationMode, Transaction } from "../types";
import { buildTransaction } from "./buildTransaction";
import { PolkadotAPI } from "../network";
import { TypeRegistry } from "@polkadot/types";
import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { makeNoCache } from "@ledgerhq/coin-framework/cache";

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
jest.mock("../network", () => ({
  PolkadotAPI: jest.fn().mockImplementation(() => {
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
  }),
}));

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
    const account = createAccount();
    const transaction = createTransaction();
    const mockNetwork: NetworkRequestCall = (_): Promise<any> => {
      return Promise.resolve();
    };
    const polkadotAPI = new PolkadotAPI(mockNetwork, makeNoCache);

    // WHEN
    const result = await buildTransaction(polkadotAPI)(account, transaction);

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

function createAccount(): PolkadotAccount {
  return {
    type: "Account",
    id: "12",
    seedIdentifier: "seed",
    derivationMode: "mode",
    index: 0,
    freshAddress: "0xff",
    freshAddressPath: "/path/to",
    // freshAddressPath: "44'/60'/0'/0/0",
    freshAddresses: [],
    name: "polkadot account",
    starred: false,
    used: false,
    balance: BigNumber("0"),
    spendableBalance: BigNumber("0"),
    creationDate: new Date(),
    blockHeight: 0,
    currency: cryptocurrenciesById["polkadot"],
    unit: {
      name: "dot",
      code: "DOT",
      magnitude: 5,
    },
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: {
        balances: [],
        latestDate: undefined,
      },
      DAY: {
        balances: [],
        latestDate: undefined,
      },
      WEEK: {
        balances: [],
        latestDate: undefined,
      },
    },
    swapHistory: [],
    polkadotResources: {
      controller: null,
      stash: null,
      nonce: 0,
      lockedBalance: BigNumber("0"),
      unlockedBalance: BigNumber("0"),
      unlockingBalance: BigNumber("0"),
      unlockings: null,
      nominations: null,
      numSlashingSpans: 0,
    },
  };
}

function createTransaction(mode: PolkadotOperationMode = "send"): Transaction {
  return {
    amount: BigNumber("0"),
    recipient: "",
    // useAllAmount?: boolean;
    // subAccountId?: string | null | undefined;
    // feesStrategy?: "slow" | "medium" | "fast" | "custom" | null;

    mode: mode,
    family: "polkadot",
    fees: null,
    validators: undefined,
    era: null,
    rewardDestination: null,
    numSlashingSpans: null,
  };
}
