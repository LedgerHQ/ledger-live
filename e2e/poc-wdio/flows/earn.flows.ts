import pages from "../pages/pages.ts";

import type { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export async function performInlineAddAccountFlow(account: Account) {
  await pages.earnV2Dashboard.verifyIceColdStartPage();
  await pages.earnV2Dashboard.clickIceColdStartEarnCTA();
  await pages.modularDrawer.checkSelectAssetPage();
  await pages.modularDrawer.performSearchByTicker(account.currency.ticker);
  await pages.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
  await pages.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
  await pages.addAccount.addAccountAtIndex(`${account.currency.name} 1`, account.currency.id, 0);
  await pages.earnV2Dashboard.verifyEarnFlowStarted(account.currency.ticker);
}
