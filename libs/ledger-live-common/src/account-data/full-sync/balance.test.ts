import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { mockTronAccount } from "../../families/tron/accountData.mock";
import { toAccountBalances } from "./balance";

registerAllCoins();

const account = {
  ...genAccount("balance", { currency: getCryptoCurrencyById("ethereum") }),
  balance: new BigNumber("1000000000000000000000"),
  spendableBalance: new BigNumber("400"),
  subAccounts: [createFixtureTokenAccount("01")],
};

describe("toAccountBalances", () => {
  it("lists the native coin first, then each token account", async () => {
    expect(await toAccountBalances(account)).toEqual([
      { assetId: "ethereum", balance: "1000000000000000000000", spendableBalance: "400" },
      {
        assetId: "ethereum/erc20/usd_tether__erc20_",
        balance: "51281813126095913",
        spendableBalance: "51281813126095913",
      },
    ]);
  });

  it("lists the native coin alone for an account without token accounts", async () => {
    expect(await toAccountBalances({ ...account, subAccounts: undefined })).toEqual([
      { assetId: "ethereum", balance: "1000000000000000000000", spendableBalance: "400" },
    ]);
  });

  it("floors a negative amount at zero", async () => {
    const [native] = await toAccountBalances({ ...account, spendableBalance: new BigNumber(-5) });
    expect(native.spendableBalance).toBe("0");
  });

  it("breaks down the native coin's locks for a family that tells them, its tokens without", async () => {
    const account = {
      ...mockTronAccount({ frozen: { bandwidth: { amount: new BigNumber(7) }, energy: null } }),
      balance: new BigNumber(10),
      spendableBalance: new BigNumber(3),
      subAccounts: [createFixtureTokenAccount("01")],
    };
    const [native, token] = await toAccountBalances(account);
    expect(native).toEqual({
      assetId: "tron",
      balance: "10",
      spendableBalance: "3",
      locked: [{ reason: "frozen", amount: "7" }],
    });
    expect(token).not.toHaveProperty("locked");
  });

  it("leaves locked out when the family has nothing locked", async () => {
    const [native] = await toAccountBalances(mockTronAccount());
    expect(native).not.toHaveProperty("locked");
  });
});
