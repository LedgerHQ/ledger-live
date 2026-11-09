import BigNumber from "bignumber.js";
import { of } from "rxjs";
import type { Account, AccountLike } from "@ledgerhq/types-live";

import { fetchNetworkFeeContext } from "./fetchNetworkFeeContext";

jest.mock("../../converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  getParentAccount: jest.fn(),
  getMainAccount: jest.fn(),
}));

jest.mock("../../../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

import { getAccountIdFromWalletAccountId } from "../../converters";
import { getMainAccount, getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountBridge } from "../../../bridge";

const mockedResolveId = getAccountIdFromWalletAccountId as jest.MockedFunction<
  typeof getAccountIdFromWalletAccountId
>;
const mockedGetMain = getMainAccount as jest.MockedFunction<typeof getMainAccount>;
const mockedGetParent = getParentAccount as jest.MockedFunction<typeof getParentAccount>;
const mockedGetBridge = getAccountBridge as jest.MockedFunction<typeof getAccountBridge>;

function makeEvmAccount(overrides: Partial<Account> = {}): Account {
  return {
    type: "Account",
    id: "evm:1",
    spendableBalance: new BigNumber("1000000000000000000"),
    currency: {
      id: "ethereum",
      units: [{ magnitude: 18 }],
    },
    ...overrides,
  } as unknown as Account;
}

function makeBtcAccount(overrides: Partial<Account> = {}): Account {
  return {
    type: "Account",
    id: "btc:1",
    spendableBalance: new BigNumber("100000000"),
    currency: {
      id: "bitcoin",
      units: [{ magnitude: 8 }],
    },
    ...overrides,
  } as unknown as Account;
}

type MockBridge = {
  sync: jest.Mock;
  createTransaction: jest.Mock;
  prepareTransaction: jest.Mock;
  getTransactionStatus: jest.Mock;
  getEstimationRecipient: jest.Mock;
};

function makeBridge(overrides: Partial<MockBridge> = {}): MockBridge {
  return {
    sync: jest.fn().mockReturnValue(of((acc: Account) => acc)),
    getEstimationRecipient: jest.fn().mockReturnValue("0xabandon"),
    createTransaction: jest.fn().mockReturnValue({}),
    prepareTransaction: jest.fn().mockResolvedValue({
      maxFeePerGas: "20000000000",
      gasPrice: "10000000000",
      gasLimit: "21000",
    }),
    getTransactionStatus: jest.fn().mockResolvedValue({
      estimatedFees: new BigNumber("420000000000000"),
    }),
    ...overrides,
  };
}

describe("fetchNetworkFeeContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the wallet account id cannot be resolved", async () => {
    mockedResolveId.mockReturnValue(undefined);

    const result = await fetchNetworkFeeContext({
      accounts: [],
      fromAccountId: "wallet:unknown",
      amountFrom: "1",
    });

    expect(result).toBeNull();
    expect(mockedGetBridge).not.toHaveBeenCalled();
  });

  it("returns null when the resolved account is not in the accounts list", async () => {
    mockedResolveId.mockReturnValue("evm:1");

    const result = await fetchNetworkFeeContext({
      accounts: [],
      fromAccountId: "wallet:evm:1",
      amountFrom: "1",
    });

    expect(result).toBeNull();
    expect(mockedGetBridge).not.toHaveBeenCalled();
  });

  it("returns null when bridge.prepareTransaction throws", async () => {
    const account = makeEvmAccount();
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    mockedGetBridge.mockReturnValue(
      makeBridge({
        prepareTransaction: jest.fn().mockRejectedValue(new Error("boom")),
      }) as unknown as ReturnType<typeof getAccountBridge>,
    );

    const result = await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:evm:1",
      amountFrom: "1",
    });

    expect(result).toBeNull();
  });

  it("builds an EVM context from the prepared transaction and balance", async () => {
    const account = makeEvmAccount();
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    const bridge = makeBridge();
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    const result = await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:evm:1",
      amountFrom: "1",
    });

    expect(result).toEqual({
      maxFeePerGas: new BigNumber("20000000000"),
      gasPrice: new BigNumber("10000000000"),
      defaultGasLimit: "21000",
      estimatedFeesAtomic: new BigNumber("420000000000000"),
      balanceAtomic: account.spendableBalance,
      feeCurrencyId: "ethereum",
      feeCurrencyMagnitude: 18,
      mainAccountCurrencyId: "ethereum",
    });

    expect(bridge.sync).not.toHaveBeenCalled();
    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    expect(preparedArg.feesStrategy).toBe("medium");
    expect(preparedArg.recipient).toBe("0xabandon");
    // 90% of `1 * 10^18` rounded down.
    expect(preparedArg.amount.toFixed()).toBe("900000000000000000");
  });

  it("syncs bitcoin accounts before preparing the fee transaction", async () => {
    const account = makeBtcAccount();
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    const bridge = makeBridge({
      getEstimationRecipient: jest
        .fn()
        .mockReturnValue("bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs"),
      prepareTransaction: jest.fn().mockResolvedValue({}),
      getTransactionStatus: jest.fn().mockResolvedValue({
        estimatedFees: new BigNumber("3000"),
      }),
    });
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    const result = await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:btc:1",
      amountFrom: "0.5",
    });

    expect(bridge.sync).toHaveBeenCalledTimes(1);
    expect(result?.feeCurrencyId).toBe("bitcoin");
    expect(result?.estimatedFeesAtomic).toEqual(new BigNumber("3000"));
    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    expect(preparedArg.recipient).toBe("bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs");
  });

  it("caps the prepared amount on the freshly-synced bitcoin balance, not the stale one", async () => {
    // Regression: the cap must read `mainAccount.spendableBalance` after
    // the sync so a freshly-synced lower balance is honored. Using
    // `fromAccount.spendableBalance` (stale) would let the cap exceed the
    // synced balance and bridges would reject `prepareTransaction` with
    // `InsufficientBalance`, collapsing the entire fee context to null.
    const stale = makeBtcAccount({
      // 1 BTC stale spendable.
      spendableBalance: new BigNumber("100000000"),
    } as Partial<Account>);
    mockedResolveId.mockReturnValue(stale.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(stale);
    const bridge = makeBridge({
      // Sync emits an updater that drops spendable from 1 BTC to 0.5 BTC,
      // mirroring the BTC bridge behavior when confirmed UTXOs are reconciled.
      sync: jest.fn().mockReturnValue(
        of((acc: Account) => ({
          ...acc,
          spendableBalance: new BigNumber("50000000"),
        })),
      ),
    });
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    await fetchNetworkFeeContext({
      accounts: [stale as unknown as AccountLike],
      fromAccountId: "wallet:btc:1",
      // 0.7 BTC sits between the stale and synced balances — the only
      // amount where the bug is observable.
      amountFrom: "0.7",
    });

    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    // 0.9 × 0.5 BTC synced = 45_000_000 sats. Without the fix this would be
    // min(0.9 × 0.7 BTC, 0.9 × 1 BTC stale) = 63_000_000 sats.
    expect(preparedArg.amount.toFixed()).toBe("45000000");
  });

  it("recovers from a bitcoin sync failure and still produces a context", async () => {
    const account = makeBtcAccount();
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    const bridge = makeBridge({
      sync: jest.fn().mockImplementation(() => {
        throw new Error("sync failed");
      }),
      prepareTransaction: jest.fn().mockResolvedValue({}),
      getTransactionStatus: jest.fn().mockResolvedValue({
        estimatedFees: new BigNumber("4000"),
      }),
    });
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    const result = await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:btc:1",
      amountFrom: "0.1",
    });

    expect(result).not.toBeNull();
    expect(result?.estimatedFeesAtomic).toEqual(new BigNumber("4000"));
  });

  it("falls back to 10% of spendable balance when the display amount is zero", async () => {
    const account = makeEvmAccount({
      spendableBalance: new BigNumber("5000000000000000000"),
    } as Partial<Account>);
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    const bridge = makeBridge();
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:evm:1",
      amountFrom: "0",
    });

    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    // 10% of 5 ETH in wei.
    expect(preparedArg.amount.toFixed()).toBe("500000000000000000");
  });

  it("uses fromAccount.id as subAccountId for token sub-accounts", async () => {
    const tokenAccount = {
      type: "TokenAccount",
      id: "token:1",
      // 100 USDC spendable — comfortably above amountFrom so the clamp
      // doesn't shadow the magnitude-conversion assertion below.
      spendableBalance: new BigNumber("100000000"),
      token: { units: [{ magnitude: 6 }] },
    } as unknown as AccountLike;
    const parent = makeEvmAccount();
    mockedResolveId.mockReturnValue("token:1");
    mockedGetParent.mockReturnValue(parent);
    mockedGetMain.mockReturnValue(parent);
    const bridge = makeBridge();
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    await fetchNetworkFeeContext({
      accounts: [tokenAccount, parent as unknown as AccountLike],
      fromAccountId: "wallet:token:1",
      amountFrom: "1",
    });

    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    expect(preparedArg.subAccountId).toBe("token:1");
    // amountFrom "1" × 10^6 (token magnitude) × 0.9 → 900000 token-atomic units.
    // Locks in the contract that token sub-accounts get token-atomic units, not
    // main-account wei: the EVM bridge interprets `amount` in token units when
    // `subAccountId` is set, so emitting wei here would silently corrupt the
    // ERC-20 transfer calldata used for fee estimation.
    expect(preparedArg.amount.toFixed()).toBe("900000");
  });

  it("clamps the prepared amount to 90% of spendable balance when the display amount exceeds balance", async () => {
    // Regression: without the clamp, a user-entered amount above their
    // spendable balance would produce 0.9 × displayAmount, and the bridge
    // would reject `prepareTransaction` with InsufficientBalance — the
    // entire fee context would fall back to null and every quote in the
    // response would silently lose its fee fields.
    const account = makeEvmAccount({
      spendableBalance: new BigNumber("1000000000000000000"), // 1 ETH
    } as Partial<Account>);
    mockedResolveId.mockReturnValue(account.id);
    mockedGetParent.mockReturnValue(undefined as unknown as Account);
    mockedGetMain.mockReturnValue(account);
    const bridge = makeBridge();
    mockedGetBridge.mockReturnValue(bridge as unknown as ReturnType<typeof getAccountBridge>);

    await fetchNetworkFeeContext({
      accounts: [account as unknown as AccountLike],
      fromAccountId: "wallet:evm:1",
      amountFrom: "100", // 100 ETH > 1 ETH balance → clamp kicks in
    });

    const [, preparedArg] = bridge.prepareTransaction.mock.calls[0];
    // 0.9 × 1 ETH spendable = 0.9 × 10^18 wei.
    expect(preparedArg.amount.toFixed()).toBe("900000000000000000");
  });
});
