import { renderHook, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { useAccountStatus } from "./useAccountStatus";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  isAccountEmpty: jest.fn(account =>
    Promise.resolve(!account.balance || (account.balance.isZero() && account.operationsCount === 0)),
  ),
}));

const ethereumCurrency = getCryptoCurrencyById("ethereum");

const createAccountWithFunds = () =>
  genAccount("eth-with-funds", {
    currency: ethereumCurrency,
    operationsSize: 1,
  });

const createEmptyAccount = () => {
  const account = genAccount("eth-empty", {
    currency: ethereumCurrency,
    operationsSize: 0,
  });
  account.balance = new BigNumber(0);
  account.spendableBalance = new BigNumber(0);
  return account;
};

describe("useAccountStatus", () => {
  it("returns hasFunds=true when user has at least one funded account", async () => {
    const { result } = renderHook(() => useAccountStatus(), {
      initialState: {
        accounts: [createAccountWithFunds()],
      },
    });

    await waitFor(() => expect(result.current.hasFunds).toBe(true));
    expect(result.current).toEqual({
      hasAccount: true,
      hasFunds: true,
    });
  });

  it("returns hasFunds=false when all accounts are empty", () => {
    const { result } = renderHook(() => useAccountStatus(), {
      initialState: {
        accounts: [createEmptyAccount()],
      },
    });

    expect(result.current).toEqual({
      hasAccount: true,
      hasFunds: false,
    });
  });

  it("returns hasFunds=false when there is no account", () => {
    const { result } = renderHook(() => useAccountStatus(), {
      initialState: {
        accounts: [],
      },
    });

    expect(result.current).toEqual({
      hasAccount: false,
      hasFunds: false,
    });
  });
});
