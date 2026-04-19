import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import DeviceAction from "../../models/DeviceAction";

export type ReceiveCurrencyScanningCase = readonly [currencyId: string, network?: string];

/**
 * Receive flow: portfolio → transfer → receive → search currency → add account at index 1 → skip verify.
 * `firstDeviceSelectRef` ensures mock device is selected only on the first currency in a suite.
 */
export async function runReceiveCurrencyScanningFlow(
  deviceAction: DeviceAction,
  firstDeviceSelectRef: { value: boolean },
  currencyId: string,
  network = "",
) {
  const currency = getCryptoCurrencyById(currencyId);
  const currencyName = currency.name;

  await app.portfolio.openViaDeeplink();
  await app.portfolio.waitForPortfolioPageToLoad();
  await app.transferMenu.open();
  await app.transferMenu.navigateToReceive();
  await app.modularDrawer.performSearchByTicker(currency.ticker);
  await app.modularDrawer.selectCurrencyByTicker(currency.ticker);
  await app.modularDrawer.selectNetworkIfAsked(currency.name);
  await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
  if (firstDeviceSelectRef.value) {
    await deviceAction.selectMockDevice();
    firstDeviceSelectRef.value = false;
  }
  await deviceAction.openApp();
  await app.addAccount.addAccountAtIndex(currency.name, network || currency.id, 1);
  await app.receive.doNotVerifyAddress();
  await app.receive.expectReceivePageIsDisplayed(currency.ticker, `${currencyName} 2`);
}
