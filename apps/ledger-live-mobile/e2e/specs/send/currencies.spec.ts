import { expect } from "detox";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadAccounts, loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SendPage from "../../models/trade/sendPage";
import OperationDetailsPage from "../../models/trade/operationDetailsPage";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import { tapByElement } from "../../helpers";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import Common, { formattedAmount } from "../../models/common";

let portfolioPage: PortfolioPage;
let sendPage: SendPage;
let deviceAction: DeviceAction;
let operationDetailsPage: OperationDetailsPage;
let common: Common;
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

describe("Send flow", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });
    loadAccounts(testAccounts);

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    sendPage = new SendPage();
    operationDetailsPage = new OperationDetailsPage();
    common = new Common();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it.each(testAccounts.map(account => [account.currency.name, account]))(
    "%s: open send flow, sends half balance and displays the new operation",
    async (_currency, account: Account) => {
      const halfBalance = account.balance.div(2);
      const amount =
        // half of the balance, formatted with the same unit as what the input should use
        formatCurrencyUnit(account.unit, halfBalance, { useGrouping: false });

      const amountWithCode = formattedAmount(account.unit, halfBalance);

      await portfolioPage.openViaDeeplink();
      await sendPage.openViaDeeplink();
      await common.performSearch(account.name);
      await sendPage.selectAccount(account.id);
      await sendPage.setRecipient(account.freshAddress);
      await sendPage.recipientContinue();
      await sendPage.setAmount(amount);
      await sendPage.amountContinue();

      await expect(sendPage.summaryAmount()).toHaveText(amountWithCode);
      await sendPage.summaryContinue();

      if (first) {
        await deviceAction.selectMockDevice();
        first = false;
      }
      await deviceAction.openApp();

      await sendPage.successContinue();
      await portfolioPage.scrollToTransactions();
      const lastTransaction = portfolioPage.lastTransactionAmount();
      await expect(lastTransaction).toHaveText(`-${amountWithCode}`);
      await tapByElement(lastTransaction);
      await operationDetailsPage.isOpened();
      await operationDetailsPage.checkAccount(account.name);
      await operationDetailsPage.checkAmount(`-${amountWithCode}`);
    },
  );
});
