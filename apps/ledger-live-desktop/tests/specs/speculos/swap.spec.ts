import test from "../../fixtures/common";
import { specs, setExchangeDependencies, Dependency } from "../../utils/speculos";
import { Application } from "tests/page";
import { Account } from "tests/enum/Account";

const accounts: Account[][] = [[Account.ETH_1, Account.BTC_1]];

for (const [i, account] of accounts.entries()) {
  test.describe.serial("Swap", () => {
    const accPair: string[] = account.map(acc => acc.currency.deviceLabel.replace(/ /g, "_"));
    const dependencies: Dependency[] = accPair.map(appName => ({
      name: appName,
    }));
    setExchangeDependencies(dependencies);
    test.use({
      userdata: "speculos-tests-app",
      testName: `Swap from (${account[0].accountName}) to (${account[1].accountName})`,
      speculosCurrency: specs["Exchange"],
      speculosOffset: i,
    });

    test(`Swap ${account[0].currency.name} to ${account[1].currency.name}`, async ({ page }) => {
      const app = new Application(page);
      await app.portfolio.openAddAccountModal();
      await app.addAccount.expectModalVisiblity();

      await app.addAccount.addAccounts();
      await app.addAccount.done();

      await app.layout.goToAccounts();
      await app.account.expectAccountBalance();
      await app.account.expectLastOperationsVisibility();
      await app.account.expectAddressIndex(0);
      await app.account.expectShowMoreButton();
    });
  });
}
