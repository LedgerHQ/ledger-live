import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";
import { resolveWalletApiSpendableBalance } from "@ledgerhq/live-common/wallet-api/converters";
import aleoExtensions from "@ledgerhq/live-common/families/aleo/bridgeExtensions";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { act, renderHook } from "tests/testSetup";
import { useAddAccountFlowNavigation } from "../useAddAccountFlowNavigation";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../analytics/useAddAccountAnalytics", () => ({
  __esModule: true,
  default: () => ({ trackAddAccountEvent: jest.fn() }),
}));

// The two ARC-22 stablecoins promoted into the production swap whitelist. Aleo token sync is off
// (`enableTokens: false`), so neither ever has a sub-account: selecting one always makes the
// drawer build an empty token account on the fly.
const makeArc22Token = (id: string, ticker: string, programId: string): TokenCurrency =>
  ({
    type: "TokenCurrency",
    id: `aleo/arc22/${id}`,
    name: ticker,
    ticker,
    contractAddress: programId,
    parentCurrencyId: getCryptoCurrencyById("aleo").id,
    tokenType: "arc22",
    units: [{ name: ticker, code: ticker, magnitude: 6 }],
  }) as TokenCurrency;

const USAD = makeArc22Token("usad", "USAD", "usad_stablecoin.aleo");
const USDCX = makeArc22Token("usdcx", "USDCx", "usdcx_stablecoin.aleo");

/** Selects `token` in the drawer against `parentAccount`, returning what the drawer hands back. */
function selectTokenInDrawer(parentAccount: Account, token: TokenCurrency) {
  const onAccountSelected = jest.fn();

  const { result } = renderHook(() =>
    useAddAccountFlowNavigation({
      selectedAccounts: [parentAccount],
      onAccountSelected,
      originalCurrency: token,
    }),
  );

  act(() => {
    result.current.navigateToFundAccount(parentAccount);
  });

  expect(onAccountSelected).toHaveBeenCalledTimes(1);
  const [account, parent] = onAccountSelected.mock.calls[0] as [AccountLike, Account | undefined];
  return { account, parent };
}

describe("selecting an Aleo ARC-22 token with no sub-account", () => {
  const aleoAccount: Account = genAccount("aleo-1", {
    currency: getCryptoCurrencyById("aleo"),
  });

  beforeEach(() => {
    jest.mocked(getAccountBridge).mockReturnValue(aleoExtensions as never);
  });

  it.each([
    ["USAD", USAD],
    ["USDCx", USDCX],
  ])("hands back a token account with no transparentBalance for %s", (_ticker, token) => {
    const { account, parent } = selectTokenInDrawer(aleoAccount, token);

    expect(account.type).toBe("TokenAccount");
    expect((account as TokenAccount).token.id).toBe(token.id);
    expect(parent).toBe(aleoAccount);
    // The shape the crash hinged on: the sync never ran, so the family field is simply absent.
    expect(account).not.toHaveProperty("transparentBalance");
  });

  it.each([
    ["USAD", USAD],
    ["USDCx", USDCX],
  ])("resolves a usable wallet-api spendable balance for %s", async (_ticker, token) => {
    const { account, parent } = selectTokenInDrawer(aleoAccount, token);

    // Same call the account.request / account.list handlers make (wallet-api/react.ts:611, :644).
    const spendableBalance = await resolveWalletApiSpendableBalance(account, parent);

    // Undefined here is what used to reach the wallet-api serializer and throw
    // "Cannot read properties of undefined (reading 'toString')". The serializer end of the
    // chain is covered in live-common's converters.test.ts, which owns that dependency.
    expect(BigNumber.isBigNumber(spendableBalance)).toBe(true);
    expect(spendableBalance).toEqual(new BigNumber(0));
  });
});
