import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { toAccountBalances } from "./balance";

const account = {
  ...genAccount("balance", { currency: getCryptoCurrencyById("ethereum") }),
  balance: new BigNumber("1000000000000000000000"),
  spendableBalance: new BigNumber("400"),
  subAccounts: [createFixtureTokenAccount("01")],
};

describe("toAccountBalances", () => {
  it("lists the native coin first, then each token account", () => {
    expect(toAccountBalances(account)).toEqual([
      { assetId: "ethereum", balance: "1000000000000000000000", spendableBalance: "400" },
      {
        assetId: "ethereum/erc20/usd_tether__erc20_",
        balance: "51281813126095913",
        spendableBalance: "51281813126095913",
      },
    ]);
  });

  it("lists the native coin alone for an account without token accounts", () => {
    expect(toAccountBalances({ ...account, subAccounts: undefined })).toEqual([
      { assetId: "ethereum", balance: "1000000000000000000000", spendableBalance: "400" },
    ]);
  });

  it("floors a negative amount at zero", () => {
    const [native] = toAccountBalances({ ...account, spendableBalance: new BigNumber(-5) });
    expect(native.spendableBalance).toBe("0");
  });
});
