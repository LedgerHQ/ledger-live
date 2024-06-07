import { expect } from "detox";
import { toAccountRaw } from "@ledgerhq/live-common/account/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadConfig } from "../bridge/server";
import { loadAccountsRaw } from "../bridge/server";
import { Application } from "../page/index";

let app: Application;

setSupportedCurrencies(["bitcoin"]);

const badAccount1 = toAccountRaw(
  genAccount("mock1", {
    currency: getCryptoCurrencyById("bitcoin"),
  }),
);
badAccount1.currencyId = "DO_NOT_EXIST";
badAccount1.id = badAccount1.id.replace("bitcoin", "DO_NOT_EXIST");

const badAccount2 = toAccountRaw(
  genAccount("mock1", {
    currency: getCryptoCurrencyById("bitcoin"),
  }),
);
badAccount2.id += "DO_NOT_EXIST";
badAccount2.derivationMode += "DO_NOT_EXIST";

describe("Portfolio to load with unknown currency data in accounts", () => {
  beforeAll(async () => {
    await loadConfig("onboardingcompleted", true);
    await loadAccountsRaw([
      { data: badAccount1, version: 0 },
      { data: badAccount2, version: 0 },
    ]);

    app = new Application();
  });

  it("opens to empty state", async () => {
    await app.portfolio.waitForPortfolioPageToLoad();
    await expect(app.portfolio.emptyPortfolioList()).toBeVisible();
  });
});
