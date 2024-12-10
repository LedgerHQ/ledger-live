import { toAccountRaw } from "@ledgerhq/live-common/account/index";
import { loadAccountsRaw } from "../bridge/server";
import { Application } from "../page";
import { initTestAccounts } from "../models/currencies";

const app = new Application();

const [badAccount1, badAccount2] = initTestAccounts(["bitcoin", "bitcoin"]).map(account =>
  toAccountRaw(account),
);

badAccount1.currencyId = "DO_NOT_EXIST";
badAccount1.id = badAccount1.id.replace("bitcoin", "DO_NOT_EXIST");

badAccount2.id += "DO_NOT_EXIST";
badAccount2.derivationMode += "DO_NOT_EXIST";

describe("Portfolio to load with unknown currency data in accounts", () => {
  beforeAll(async () => {
    await loadAccountsRaw([
      { data: badAccount1, version: 0 },
      { data: badAccount2, version: 0 },
    ]);

    await app.init({ userdata: "skip-onboarding" });
  });

  it("opens to empty state", async () => {
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });
});
