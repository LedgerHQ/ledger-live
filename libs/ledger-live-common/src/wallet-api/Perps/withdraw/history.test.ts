import BigNumber from "bignumber.js";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import {
  addPerpsWithdrawToSwapHistory,
  createPerpsWithdrawSwapOperation,
  getPerpsWithdrawHistoryUpdate,
} from "./history";

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = { ...ethereum.units[0], magnitude: 6 };
const hypercore: Account = {
  ...genAccount("hypercore", { operationsSize: 0, currency: ethereum }),
  currency: { ...ethereum, units: [usdc] },
};
const receiver = genAccount("receiver", { operationsSize: 0, currency: ethereum });

const entry = (destination: AccountLike = receiver) =>
  createPerpsWithdrawSwapOperation({
    swapId: "swap-id",
    sourceAccount: hypercore,
    destinationAccount: destination,
    amountFrom: new BigNumber("5.5"),
    amountTo: new BigNumber("0.001920889859402573"),
    payoutNetworkFees: new BigNumber("0.0004"),
  });

describe("createPerpsWithdrawSwapOperation", () => {
  it("is pending, from the HyperCore account and not anchored to an operation yet", () => {
    expect(entry()).toEqual({
      provider: PERPS_SWAPKIT_PROVIDER,
      swapId: "swap-id",
      status: "pending",
      receiverAccountId: receiver.id,
      fromAccountId: hypercore.id,
      operationId: "",
      fromAmount: new BigNumber(5_500_000),
      toAmount: new BigNumber("1920889859402573"),
      feesAmount: "1000000",
      payoutFeesAmount: "400000000000000",
    });
  });

  it("has no payout fees when the quote takes none", () => {
    const withoutPayoutFees = createPerpsWithdrawSwapOperation({
      swapId: "swap-id",
      sourceAccount: hypercore,
      destinationAccount: receiver,
      amountFrom: new BigNumber("5.5"),
      amountTo: new BigNumber("1"),
      payoutNetworkFees: new BigNumber(0),
    });

    expect(withoutPayoutFees).not.toHaveProperty("payoutFeesAmount");
    expect(withoutPayoutFees.feesAmount).toBe("1000000");
  });
});

describe("addPerpsWithdrawToSwapHistory", () => {
  it("adds the entry to the receiving main account", () => {
    const updated = addPerpsWithdrawToSwapHistory(receiver, entry());

    expect(updated.swapHistory).toEqual([entry()]);
  });

  it("adds the entry to the receiving token account", () => {
    const usdcToken: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
      name: "USD Coin",
      ticker: "USDC",
      contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
      tokenType: "erc20",
      units: [usdc],
    };
    const token = genTokenAccount(0, receiver, usdcToken);
    const parent: Account = { ...receiver, subAccounts: [{ ...token, swapHistory: [] }] };

    const updated = addPerpsWithdrawToSwapHistory(parent, entry(token));

    expect(updated.swapHistory).toEqual([]);
    expect(updated.subAccounts?.[0].swapHistory).toEqual([entry(token)]);
  });

  it("adds a token account the user never held, with the entry", () => {
    const usdcToken: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
      name: "USD Coin",
      ticker: "USDC",
      contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
      tokenType: "erc20",
      units: [usdc],
    };
    const neverHeld = { ...genTokenAccount(0, receiver, usdcToken), swapHistory: [] };
    const parent: Account = { ...receiver, subAccounts: [] };

    const updated = addPerpsWithdrawToSwapHistory(parent, entry(neverHeld), neverHeld);

    expect(updated.subAccounts).toEqual([{ ...neverHeld, swapHistory: [entry(neverHeld)] }]);
  });

  it("leaves the account unchanged when the receiving account is not one of its own", () => {
    const other = genAccount("other", { operationsSize: 0, currency: ethereum });

    expect(addPerpsWithdrawToSwapHistory(other, entry())).toBe(other);
  });

  it("keeps a single entry when the same swap is added twice", () => {
    const once = addPerpsWithdrawToSwapHistory(receiver, entry());

    expect(addPerpsWithdrawToSwapHistory(once, entry()).swapHistory).toHaveLength(1);
  });
});

describe("getPerpsWithdrawHistoryUpdate", () => {
  it("updates the main account holding the receiving account", () => {
    const { accountId, updater } = getPerpsWithdrawHistoryUpdate({
      swapId: "swap-id",
      sourceAccount: hypercore,
      destinationAccount: receiver,
      amountFrom: new BigNumber("5.5"),
      amountTo: new BigNumber("0.001920889859402573"),
      payoutNetworkFees: new BigNumber("0.0004"),
    });

    expect(accountId).toBe(receiver.id);
    expect(updater(receiver).swapHistory).toEqual([entry()]);
  });
});
