import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadAccounts, loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import StakePage from "../../models/trade/stakePage";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import { BigNumber } from "bignumber.js";
import { formattedAmount } from "../../models/common";

let portfolioPage: PortfolioPage;
let stakePage: StakePage;
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
    loadConfig("onboardingcompleted", true);

    loadBleState({ knownDevices: [knownDevice] });
    loadAccounts([testedAccount]);

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    stakePage = new StakePage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("open account stake flow", async () => {
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToStakeFromTransferMenu();
  });

  it("goes through the delegate flow", async () => {
    const delegatedPercent = 50;
    const usableAmount = testedAccount.spendableBalance
      .minus(COSMOS_MIN_SAFE)
      .minus(COSMOS_MIN_FEES);
    const delegatedAmount = usableAmount.div(100 / delegatedPercent).integerValue();
    const remainingAmount = usableAmount.minus(delegatedAmount);

    await stakePage.selectCurrency(testedCurrency);
    await stakePage.selectAccount(testedAccount.id);

    const [assestsDelagated, assestsRemaining] = await stakePage.setAmount(delegatedPercent);
    expect(await stakePage.cosmosDelegationSummaryValidator()).toEqual("Ledger");
    expect(assestsRemaining).toEqual(formattedAmount(testedAccount.unit, remainingAmount));
    expect(assestsDelagated).toEqual(formattedAmount(testedAccount.unit, delegatedAmount, true));

    await stakePage.summaryContinue();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await stakePage.successClose();
  });
});
