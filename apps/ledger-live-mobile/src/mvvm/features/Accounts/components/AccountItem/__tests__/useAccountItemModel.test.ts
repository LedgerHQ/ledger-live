import { renderHook } from "@tests/test-renderer";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import useAccountItemModel from "../useAccountItemModel";
import { State } from "~/reducers/types";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { ethCurrency, btcCurrency, usdtToken } from "../../../__tests__/shared";

const makeBtcAccount = (overrides?: Partial<Account>): Account => {
  const base = genAccount("useAccountItemModel-btc-1", { currency: btcCurrency });
  return { ...base, ...overrides };
};

const makeTokenAccount = (): { tokenAccount: TokenAccount; parentAccount: Account } => {
  const parentAccount = genAccount("useAccountItemModel-test-parent", { currency: ethCurrency });
  const tokenAccount = genTokenAccount(0, parentAccount, usdtToken);
  return { tokenAccount, parentAccount };
};

const stateWithAccounts = (accounts: Account[]) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: { ...state.accounts, active: accounts },
  }),
});

describe("useAccountItemModel", () => {
  it("should derive currency, tag and use own address for a regular Account", () => {
    const account = makeBtcAccount({ derivationMode: "" as Account["derivationMode"] });

    const { result } = renderHook(
      () => useAccountItemModel({ account, balance: new BigNumber(1000) }),
      stateWithAccounts([account]),
    );

    expect(result.current.currency).toEqual(expect.objectContaining({ id: "bitcoin" }));
    expect(result.current.accountId).toBe(account.id);
    expect(result.current.tag).toBe("legacy");
  });

  it("should use parent address and return false tag for a TokenAccount", () => {
    const { tokenAccount, parentAccount } = makeTokenAccount();

    const { result } = renderHook(
      () => useAccountItemModel({ account: tokenAccount, balance: new BigNumber(500) }),
      stateWithAccounts([parentAccount]),
    );

    expect(result.current.accountId).toBe(tokenAccount.id);
    expect(result.current.tag).toBe(false);
  });
});
