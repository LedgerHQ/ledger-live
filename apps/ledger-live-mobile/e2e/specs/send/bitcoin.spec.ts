import { device, expect } from "detox";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadAccounts, loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SendPage from "../../models/send";
import DeviceAction from "../../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";
import { getElementByText } from "../../helpers";

let portfolioPage: PortfolioPage;
let sendPage: SendPage;
let deviceAction: DeviceAction;

setSupportedCurrencies(["bitcoin"]);

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

const bitcoinAccount = genAccount("mock1", {
  currency: getCryptoCurrencyById("bitcoin"),
});

describe("Bitcoin send flow", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });
    loadAccounts([bitcoinAccount]);

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    sendPage = new SendPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("open account send flow", async () => {
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToSendFromTransferMenu();
  });

  const halfBalance = bitcoinAccount.balance.div(2);
  const amount =
    // half of the balance, formatted with the same unit as what the input should use
    formatCurrencyUnit(bitcoinAccount.unit, halfBalance);

  const amountWithCode = formatCurrencyUnit(bitcoinAccount.unit, halfBalance, {
    showCode: true,
  });

  it("traverse through the send flow", async () => {
    await sendPage.selectAccount(bitcoinAccount.id);
    await sendPage.setRecipient(bitcoinAccount.freshAddress);
    await sendPage.recipientContinue();

    await sendPage.setAmount(amount);
    await sendPage.amountContinue();

    await expect(getElementByText(amountWithCode)).toBeVisible();
    await sendPage.summaryContinue();

    // device actions and add accounts modal have animations that requires to disable synchronization default detox behavior
    await device.disableSynchronization();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await device.enableSynchronization();

    await sendPage.successContinue();
  });

  /*
  // FIXME unclear why it doesn't pass
  it("displays our new operation in the operation list", async () => {
    const roundedAmountWithCode = formatCurrencyUnit(bitcoinAccount.unit, halfBalance, {
      showCode: true,
      disableRounding: false,
    });
    await waitForElementByText(roundedAmountWithCode);
    await expect(getElementByText(roundedAmountWithCode)).toBeVisible();
  });
  */
});
