import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { toAccountBalances } from "./toAccountBalances";

const erc20 = (id: string, ticker: string): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`ethereum/erc20/${id}`),
  contractAddress: `0x${ticker}`,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
  tokenType: "erc20",
  name: ticker,
  ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: ticker, code: ticker, magnitude: 6 }],
});

const tokensData = [erc20("usd__coin", "USDC"), erc20("makerdao", "MKR")];
const tokenIds = tokensData.map(each => each.id);

const account = genAccount("balances", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 2,
  tokensData,
  tokenIds,
});

describe("toAccountBalances", () => {
  it("answers the native balance first, then one row per token account", () => {
    expect(toAccountBalances(account).map(row => row.assetId)).toEqual(["ethereum", ...tokenIds]);
    expect(toAccountBalances(account)).toEqual([
      {
        assetId: "ethereum",
        balance: account.balance.toFixed(),
        spendableBalance: account.spendableBalance.toFixed(),
      },
      ...(account.subAccounts ?? []).map(token => ({
        assetId: token.token.id,
        balance: token.balance.toFixed(),
        spendableBalance: token.spendableBalance.toFixed(),
      })),
    ]);
  });

  it("floors a spendable balance the locked part took below zero", () => {
    const [native] = toAccountBalances({
      ...account,
      spendableBalance: account.balance.minus(account.balance).minus(1),
    });
    expect(native.spendableBalance).toBe("0");
  });
});
