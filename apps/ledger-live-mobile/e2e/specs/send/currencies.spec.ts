import { expect } from "detox";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { loadAccounts, loadBleState, loadConfig } from "../../bridge/server";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import { tapByElement } from "../../helpers";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { formattedAmount } from "../../page/common.page";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Application } from "../../page/index";

let app: Application;
let deviceAction: DeviceAction;

let first = true;

const testedCurrencies: CryptoCurrencyId[] = [
  "bitcoin",
  "ethereum",
  "bsc",
  //"ripple", // TOFIX Error during flow
  //"solana", // TOFIX Error during flow
  //"cardano", // TOFIX Error during flow
  "dogecoin",
  //"tron", // TOFIX Error during flow
  //"avalanche_c_chain", // TOFIX Error during flow
  "polygon",
  "polkadot",
  "cosmos",
];
const testAccounts = testedCurrencies.map(currencyId =>
  genAccount("mock" + currencyId, { currency: getCryptoCurrencyById(currencyId) }),
);
setSupportedCurrencies(testedCurrencies);

$TmsLink("B2CQA-1823");
describe("Send flow", () => {
  beforeAll(async () => {
    await loadConfig("onboardingcompleted", true);
    await loadBleState({ knownDevices: [knownDevice] });
    await loadAccounts(testAccounts);
    app = new Application();
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it.each(testAccounts.map(account => [account.currency.name, account]))(
    "%s: open send flow, sends half balance and displays the new operation",
    async (_currency, account: Account) => {
      const halfBalance = account.balance.div(2);
      const amount =
        // half of the balance, formatted with the same unit as what the input should use
        formatCurrencyUnit(getAccountCurrency(account).units[0], halfBalance, {
          useGrouping: false,
        });

      const amountWithCode = formattedAmount(getAccountCurrency(account).units[0], halfBalance);

      await app.portfolio.openViaDeeplink();
      await app.send.openViaDeeplink();
      await app.common.performSearch(getDefaultAccountName(account));
      await app.send.selectAccount(account.id);
      await app.send.setRecipient(account.freshAddress);
      await app.send.recipientContinue();
      await app.send.setAmount(amount);
      await app.send.amountContinue();

      await expect(app.send.summaryAmount()).toHaveText(amountWithCode);
      await app.send.summaryContinue();

      if (first) {
        await deviceAction.selectMockDevice();
        first = false;
      }
      await deviceAction.openApp();

      await app.send.successContinue();
      await app.portfolio.scrollToTransactions();
      const lastTransaction = app.portfolio.lastTransactionAmount();
      await expect(lastTransaction).toHaveText(`-${amountWithCode}`);
      await tapByElement(lastTransaction);
      await app.operationDetails.isOpened();
      await app.operationDetails.checkAccount(getDefaultAccountName(account));
      await app.operationDetails.checkAmount(`-${amountWithCode}`);
    },
  );
});
