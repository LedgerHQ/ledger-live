import { knownDevices } from "../../models/devices";
import {
  COSMOS_MIN_FEES,
  COSMOS_MIN_SAFE,
  formattedAmount,
  getAccountUnit,
  initTestAccounts,
} from "../../models/currencies";
import { Application } from "../../page";
import DeviceAction from "../../models/DeviceAction";
import BigNumber from "bignumber.js";

const app = new Application();
let deviceAction: DeviceAction;

const testedCurrency = "cosmos";
const defaultValidator = "Ledger";
const testAccount = initTestAccounts([testedCurrency])[0];
const knownDevice = knownDevices.nanoX;

describe("Cosmos delegate flow", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      testAccounts: [testAccount],
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

    await app.stake.setAmount(delegatedPercent);
    await app.stake.expectRemainingAmount(delegatedPercent, formattedAmount(unit, remainingAmount));
    await app.stake.validateAmount();
    await app.stake.expectDelegatedAmount(
      formattedAmount(unit, delegatedAmount, { showAllDigits: true, showCode: true }),
    );
    await app.stake.expectValidator(defaultValidator);
    await app.stake.summaryContinue();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.common.successClose();
  });
});
