import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { formattedAmount, getAccountName, getAccountUnit } from "../../models/currencies";

$TmsLink("B2CQA-1823");
describe("Send flow", () => {
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
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      testedCurrencies,
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it.each(testedCurrencies)(
    "%s: open send flow, sends half balance and displays the new operation",
    async currencyId => {
      const account = app.testAccounts.find(a => a.currency.id === currencyId);
      if (!account) throw new Error(`Account not found for currency: ${currencyId}`);

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
      await app.send.recipientContinue(account.currency.name == "Cosmos" ? "noTag" : undefined);
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
