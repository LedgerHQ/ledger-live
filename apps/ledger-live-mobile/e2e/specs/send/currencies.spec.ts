import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import {
  formattedAmount,
  getAccountName,
  getAccountUnit,
  initTestAccounts,
} from "../../models/currencies";
import { Application } from "../../page";

const app = new Application();
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
const testAccounts = initTestAccounts(testedCurrencies);
const knownDevice = knownDevices.nanoX;

$TmsLink("B2CQA-1823");
describe("Send flow", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      testAccounts: testAccounts,
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it.each(testAccounts.map(account => [account.currency.name, account]))(
    "%s: open send flow, sends half balance and displays the new operation",
    async (_currency, account: Account) => {
      const halfBalance = account.balance.div(2);
      const accountName = getAccountName(account);
      const unit = getAccountUnit(account);
      const amountInput = formattedAmount(unit, halfBalance, { useGrouping: false });
      const amountWithCode = formattedAmount(unit, halfBalance);

      await app.portfolio.openViaDeeplink();
      await app.send.openViaDeeplink();
      await app.common.performSearch(accountName);
      await app.common.selectAccount(account.id);
      await app.send.setRecipient(account.freshAddress);
      await app.send.recipientContinue();
      await app.send.setAmount(amountInput);
      await app.send.amountContinue();
      await app.send.expectSummaryAmount(amountWithCode);
      await app.send.summaryContinue();

      first && (await deviceAction.selectMockDevice(), (first = false));
      await deviceAction.openApp();

      await app.common.successClose();
      await app.portfolio.scrollToTransactions();
      await app.portfolio.expectLastTransactionAmount(`-${amountWithCode}`);
      await app.portfolio.openLastTransaction();
      await app.operationDetails.isOpened();
      await app.operationDetails.checkAccount(accountName);
      await app.operationDetails.checkAmount(`-${amountWithCode}`);
    },
  );
});
