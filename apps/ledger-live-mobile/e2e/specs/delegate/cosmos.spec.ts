import { knownDevices } from "../../models/devices";
import {
  COSMOS_MIN_FEES,
  COSMOS_MIN_SAFE,
  formattedAmount,
  getAccountUnit,
} from "../../models/currencies";

import DeviceAction from "../../models/DeviceAction";
import BigNumber from "bignumber.js";

describe("Cosmos delegate flow", () => {
  let deviceAction: DeviceAction;
  const testedCurrency = "cosmos";
  const defaultProvider = "Ledger";
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      testedCurrencies: [testedCurrency],
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-384");
  it("open account stake flow", async () => {
    await app.transfertMenu.open();
    await app.transfertMenu.navigateToStake();
  });

  $TmsLink("B2CQA-387");
  it("goes through the delegate flow", async () => {
    const testAccount = app.testAccounts[0];
    const delegatedPercent = 50;
    const unit = getAccountUnit(testAccount);

    const usableAmount = testAccount.spendableBalance.minus(COSMOS_MIN_SAFE).minus(COSMOS_MIN_FEES);
    // rounding to avoid floating point errors
    // NOTE: we could allow for some precision error here to avoid rounding issues
    const delegatedAmount = usableAmount
      .multipliedBy(delegatedPercent)
      .div(100)
      .integerValue(BigNumber.ROUND_CEIL);
    const remainingAmount = usableAmount.minus(delegatedAmount);

    await app.stake.selectCurrency(testedCurrency);
    await app.common.selectAccount(testAccount.id);

    await app.stake.setAmountPercent(testedCurrency, delegatedPercent);
    await app.stake.expectRemainingAmount(
      testedCurrency,
      delegatedPercent,
      formattedAmount(unit, remainingAmount),
    );
    await app.stake.validateAmount(testedCurrency);
    await app.stake.expectDelegatedAmount(
      testedCurrency,
      formattedAmount(unit, delegatedAmount, { showAllDigits: true, showCode: true }),
    );
    await app.stake.expectProvider(testedCurrency, defaultProvider);
    await app.stake.summaryContinue(testedCurrency);
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.common.successClose();
  });
});
