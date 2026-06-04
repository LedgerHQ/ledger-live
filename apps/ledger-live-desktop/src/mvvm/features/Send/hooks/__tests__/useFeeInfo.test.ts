/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useFeeInfo } from "../useFeeInfo";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";

jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);

function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}

const usdcUnit = { name: "USD Coin", code: "USDC", magnitude: 6 };
const usdcToken = {
  type: "TokenCurrency",
  id: "celo/erc20/usdc",
  contractAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
  parentCurrency: { id: "celo" },
  name: "USD Coin",
  ticker: "USDC",
  disableCountervalue: false,
  units: [usdcUnit],
};
const usdcSubAccount = {
  type: "TokenAccount",
  id: "usdc-sub-account-id",
  token: usdcToken,
  balance: new BigNumber(100000),
};

function buildParams(overrides?: {
  feeCurrencyAccountId?: string | null;
  subAccounts?: unknown[];
  estimatedFees?: BigNumber;
}) {
  const currency = getCryptoCurrencyById("bitcoin");
  mockedGetAccountCurrency.mockReturnValue(currency);
  mockedGetMainAccount.mockImplementation((account: Account | unknown) => {
    if (!isAccount(account)) {
      throw new Error("TokenAccount is not supported by this test helper");
    }
    return account;
  });

  const account = createMockAccount({
    id: "acc",
    currency,
    subAccounts: (overrides?.subAccounts ?? []) as Account["subAccounts"],
  });
  const status = {
    errors: {},
    warnings: {},
    estimatedFees: overrides?.estimatedFees ?? new BigNumber(500000),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  } as TransactionStatus;

  return {
    account,
    parentAccount: null as Account | null,
    status,
    feeCurrencyAccountId: overrides?.feeCurrencyAccountId,
  };
}

describe("useFeeInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("formats crypto value with the token unit when feeCurrencyAccountId resolves to a sub-account", () => {
    const params = buildParams({
      feeCurrencyAccountId: "usdc-sub-account-id",
      subAccounts: [usdcSubAccount],
    });
    const { result } = renderHook(() => useFeeInfo(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feeSummary).not.toBeNull();
    expect(result.current.feeSummary?.cryptoLabel).toContain("USDC");
    expect(result.current.feeSummary?.cryptoValue).toContain("USDC");
  });

  it("falls back to the parent account unit when feeCurrencyAccountId is not provided", () => {
    const params = buildParams({ feeCurrencyAccountId: null });
    const { result } = renderHook(() => useFeeInfo(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feeSummary?.cryptoLabel).toContain("BTC");
    expect(result.current.feeSummary?.cryptoValue).toContain("BTC");
  });

  it("falls back to the parent account unit when feeCurrencyAccountId is stale", () => {
    const params = buildParams({
      feeCurrencyAccountId: "missing-id",
      subAccounts: [],
    });
    const { result } = renderHook(() => useFeeInfo(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feeSummary?.cryptoLabel).toContain("BTC");
    expect(result.current.feeSummary?.cryptoValue).toContain("BTC");
  });

  it("returns null feeSummary when estimatedFees is zero and no countervalue is available", () => {
    const params = buildParams({ estimatedFees: new BigNumber(0) });
    const { result } = renderHook(() => useFeeInfo(params), {
      initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } },
    });

    expect(result.current.feeSummary).toBeNull();
  });
});
