import { BigNumber } from "bignumber.js";
import { createFixtureAccount, networkInfo } from "../../fixtures/common.fixtures";
import { bitcoinPickingStrategy, BitcoinAccount, BitcoinOutput, Transaction } from "../../types";

jest.mock("../../getAccountNetworkInfo", () => ({
  getAccountNetworkInfo: jest.fn(),
}));

jest.mock("../../getWalletAccount", () => ({
  getWalletAccount: jest.fn(),
}));

const resolveFeePerByte = jest.fn();
jest.mock("../../chain-adapters/registry", () => ({
  getChainAdapter: () => ({
    resolveFeePerByte: (...args: unknown[]) => resolveFeePerByte(...args),
  }),
}));

import { prepareTransaction } from "../../prepareTransaction";

const getAccountNetworkInfo = jest.requireMock("../../getAccountNetworkInfo").getAccountNetworkInfo;
const getWalletAccount = jest.requireMock("../../getWalletAccount").getWalletAccount;

const UNFETCHABLE_UTXO = {
  hash: "ff".repeat(32),
  outputIndex: 0,
  blockHeight: 1000,
  address: "1utxoaddress",
  value: new BigNumber(100000),
  rbf: false,
  isChange: false,
} as BitcoinOutput;

// getExcludeUTXOsFromUnfetchable only carries the identity of a UTXO forward.
const AS_EXCLUSION = { hash: UNFETCHABLE_UTXO.hash, outputIndex: UNFETCHABLE_UTXO.outputIndex };

const mockNetworkInfo = {
  ...networkInfo,
  feeItems: {
    ...networkInfo.feeItems,
    items: networkInfo.feeItems.items.map(item => ({
      ...item,
      feePerByte: new BigNumber(item.feePerByte),
    })),
    defaultFeePerByte: new BigNumber("2"),
  },
  relayFeePerByte: new BigNumber("1"),
};

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    utxoStrategy: {
      strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
      excludeUTXOs: [],
    },
    rbf: false,
    feePerByte: new BigNumber(2),
    networkInfo: mockNetworkInfo,
    ...overrides,
  }) as Transaction;

/** An account holding one UTXO whose parent transaction cannot be fetched. */
const accountWithUnfetchableUtxo = () =>
  createFixtureAccount({
    bitcoinResources: { utxos: [UNFETCHABLE_UTXO] },
  }) as unknown as BitcoinAccount;

describe("prepareTransaction — ChainAdapter.resolveFeePerByte", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveFeePerByte.mockReturnValue(undefined);
    getAccountNetworkInfo.mockResolvedValue(mockNetworkInfo);
    getWalletAccount.mockReturnValue({
      xpub: { explorer: { getTxHex: jest.fn().mockResolvedValue("00") } },
    });
  });

  it("hands over the merged exclusions, not the ones the caller came with", async () => {
    // The auto-exclusions decide which UTXOs the selection may use, so a rate
    // resolved before merging them can be too low for the layout finally built.
    getWalletAccount.mockReturnValue({
      xpub: { explorer: { getTxHex: jest.fn().mockRejectedValue(new Error("gone")) } },
    });

    await prepareTransaction(accountWithUnfetchableUtxo(), makeTransaction());

    expect(resolveFeePerByte).toHaveBeenCalledTimes(1);
    const [, handedOver] = resolveFeePerByte.mock.calls[0];
    expect(handedOver.utxoStrategy.excludeUTXOs).toEqual([AS_EXCLUSION]);
  });

  it("hands over the inferred rate and the resolved networkInfo", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;

    await prepareTransaction(account, makeTransaction({ feePerByte: new BigNumber(7) }));

    const [, handedOver] = resolveFeePerByte.mock.calls[0];
    expect(handedOver.feePerByte.toNumber()).toBe(7);
    expect(handedOver.networkInfo).toBe(mockNetworkInfo);
  });

  it("prepares the transaction with the resolved rate", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;
    resolveFeePerByte.mockResolvedValue(new BigNumber(53));

    const result = await prepareTransaction(account, makeTransaction());

    expect(result.feePerByte?.toNumber()).toBe(53);
  });

  it("keeps the inferred rate when the chain declines to resolve one", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;

    const result = await prepareTransaction(
      account,
      makeTransaction({ feePerByte: new BigNumber(9) }),
    );

    expect(result.feePerByte?.toNumber()).toBe(9);
  });

  // A custom fee is the user's explicit choice, so it outranks the chain's
  // resolution — the exclusions still get merged in.
  it("lets a custom fee win over the resolved rate", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;
    resolveFeePerByte.mockResolvedValue(new BigNumber(53));

    const result = await prepareTransaction(
      account,
      makeTransaction({ feesStrategy: "custom", feePerByte: new BigNumber(9) }),
    );

    expect(result.feePerByte?.toNumber()).toBe(9);
    expect(result.utxoStrategy.excludeUTXOs).toEqual([]);
  });

  it("settles at a fixed point, so repeated preparations stop producing new objects", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;
    resolveFeePerByte.mockResolvedValue(new BigNumber(53));

    const first = await prepareTransaction(account, makeTransaction());
    const second = await prepareTransaction(account, first);

    expect(second).toBe(first);
  });
});
