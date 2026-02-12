import BigNumber from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { renderHook } from "@tests/test-renderer";
import { useOperationsV1 } from "../useOperationsV1";
import { State } from "~/reducers/types";

const ETH = getCryptoCurrencyById("ethereum");

const EVM_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
};

const ZERO_VALUE_TOKEN_OP_ID = "zero-value-token-op-id";

function createZeroValueTokenOperation(tokenAccountId: string): Operation {
  return {
    id: ZERO_VALUE_TOKEN_OP_ID,
    hash: "0xzero",
    type: "IN",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHash: "0xblock",
    blockHeight: 1,
    accountId: tokenAccountId,
    date: new Date(),
    extra: {},
  };
}

function createAccountWithZeroValueTokenOperation(): Account {
  const parentAccount = genAccount("eth-zero-value-token", {
    currency: ETH,
    operationsSize: 0,
    tokensData: [EVM_TOKEN],
    tokenIds: [EVM_TOKEN.id],
  });

  const tokenAccount = parentAccount.subAccounts?.[0] as TokenAccount;
  if (!tokenAccount) throw new Error("expected one token subAccount");

  const zeroValueOp = createZeroValueTokenOperation(tokenAccount.id);

  const tokenAccountWithZeroOp: TokenAccount = {
    ...tokenAccount,
    operations: [
      zeroValueOp,
      { ...zeroValueOp, id: "non-zero-value-token-op-id", value: new BigNumber(1) },
    ],
    operationsCount: 2,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
  };

  return {
    ...parentAccount,
    subAccounts: [tokenAccountWithZeroOp],
  };
}

const initialStateWithFilterEnabled = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    filterTokenOperationsZeroAmount: true,
    overriddenFeatureFlags: {
      ...state.settings.overriddenFeatureFlags,
      addressPoisoningOperationsFilter: {
        enabled: true,
        params: { families: ["evm"] },
      },
    },
  },
});

const initialStateWithFilterEnabledButNoEvmFamily = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    filterTokenOperationsZeroAmount: true,
    overriddenFeatureFlags: {
      ...state.settings.overriddenFeatureFlags,
      addressPoisoningOperationsFilter: {
        enabled: true,
        params: { families: ["algorand"] },
      },
    },
  },
});

describe("useOperationsV1 integration", () => {
  it("should filter out token operations with 0 value (address poisoning) when filter is enabled", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithFilterEnabled,
    });

    expect(result.current.sections[0].data.length).toBe(1);
    expect(result.current.sections[0].data[0].id).toBe("non-zero-value-token-op-id");
  });

  it("should not filter zero-value token operations when families do not include the token family", () => {
    const accountWithZeroValueTokenOp = createAccountWithZeroValueTokenOperation();

    const { result } = renderHook(() => useOperationsV1([accountWithZeroValueTokenOp], 50), {
      overrideInitialState: initialStateWithFilterEnabledButNoEvmFamily,
    });

    expect(result.current.sections[0].data.length).toBe(2);
  });
});
