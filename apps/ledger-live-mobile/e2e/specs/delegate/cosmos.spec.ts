import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadAccounts, loadBleState, loadConfig } from "../../bridge/server";
import { knownDevice } from "../../models/devices";
import { BigNumber } from "bignumber.js";
import { formattedAmount } from "../../page/common.page";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Application } from "../../page/index";
import DeviceAction from "../../models/DeviceAction";

let app: Application;
let deviceAction: DeviceAction;

const testedCurrency = "cosmos";
const id = "cosmosid";

setSupportedCurrencies([testedCurrency]);
const testedAccount = genAccount(id, {
  currency: getCryptoCurrencyById(testedCurrency),
});

const COSMOS_MIN_SAFE = new BigNumber(100000); // 100000 uAtom
const COSMOS_MIN_FEES = new BigNumber(6000);

describe("Cosmos delegate flow", () => {
  beforeAll(async () => {
    await loadConfig("onboardingcompleted", true);
    await loadBleState({ knownDevices: [knownDevice] });
    await loadAccounts([testedAccount]);
    app = new Application();
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
    const usableAmount = testedAccount.spendableBalance
      .minus(COSMOS_MIN_SAFE)
      .minus(COSMOS_MIN_FEES);
    const delegatedAmount = usableAmount.div(100 / delegatedPercent).integerValue();
    const remainingAmount = usableAmount.minus(delegatedAmount);

    await app.stake.selectCurrency(testedCurrency);
    await app.stake.selectAccount(testedAccount.id);

    const [assestsDelagated, assestsRemaining] = await app.stake.setAmount(delegatedPercent);
    expect(await app.stake.cosmosDelegationSummaryValidator()).toEqual("Ledger");
    expect(assestsRemaining).toEqual(
      formattedAmount(getAccountCurrency(testedAccount).units[0], remainingAmount),
    );
    expect(assestsDelagated).toEqual(
      formattedAmount(getAccountCurrency(testedAccount).units[0], delegatedAmount, true),
    );

    await app.stake.summaryContinue();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.stake.successClose();
  });
});
