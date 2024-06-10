import { knownDevice } from "../../models/devices";
import {
  COSMOS_MIN_FEES,
  COSMOS_MIN_SAFE,
  formattedAmount,
  initTestAccounts,
} from "../../models/currencies";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Application } from "../../page/index";
import DeviceAction from "../../models/DeviceAction";

let app: Application;
let deviceAction: DeviceAction;

const testedCurrency = "cosmos";
const testAccount = initTestAccounts([testedCurrency])[0];

describe("Cosmos delegate flow", () => {
  beforeAll(async () => {
    app = await Application.init("onboardingcompleted", [knownDevice], [testAccount]);
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-384");
  it("open account stake flow", async () => {
    await app.portfolio.openTransferMenu();
    await app.portfolio.navigateToStakeFromTransferMenu();
  });

  $TmsLink("B2CQA-387");
  it("goes through the delegate flow", async () => {
    const delegatedPercent = 50;
    const usableAmount = testAccount.spendableBalance.minus(COSMOS_MIN_SAFE).minus(COSMOS_MIN_FEES);
    const delegatedAmount = usableAmount.div(100 / delegatedPercent).integerValue();
    const remainingAmount = usableAmount.minus(delegatedAmount);

    await app.stake.selectCurrency(testedCurrency);
    await app.stake.selectAccount(testAccount.id);

    const [assestsDelagated, assestsRemaining] = await app.stake.setAmount(delegatedPercent);
    expect(await app.stake.cosmosDelegationSummaryValidator()).toEqual("Ledger");
    expect(assestsRemaining).toEqual(
      formattedAmount(getAccountCurrency(testAccount).units[0], remainingAmount),
    );
    expect(assestsDelagated).toEqual(
      formattedAmount(getAccountCurrency(testAccount).units[0], delegatedAmount, true),
    );

    await app.stake.summaryContinue();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.stake.successClose();
  });
});
