import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { setEnv } from "@ledgerhq/live-env";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { verifyStakeOperationDetailsInfo } from "../../models/stake";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const DELEGATION_AMOUNT = "2";
const delegation = new Delegate(Account.SEI_EVM_1, DELEGATION_AMOUNT, "first-available");

const tmsLinks: string[] = ["B2CQA-5740"];
const tags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sei_evm", "@family-evm"];

describe("SEI EVM Native Staking - Delegate flow", () => {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({
      speculosApp: AppInfos.SEI,
      featureFlags: {
        evmNativeStaking: {
          enabled: true,
          params: { supportedCurrencyIds: ["sei_evm"] },
        },
      },
      cliCommands: [liveDataWithAddressCommand(delegation.account, { currency: "sei_evm" })],
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it(`Delegate on ${delegation.account.currency.name}: start delegate, validator list shown, validator selected`, async () => {
    const amountWithCode = DELEGATION_AMOUNT + " " + delegation.account.currency.ticker;

    await app.portfolio.goToAccounts(delegation.account.currency.name);
    await app.common.goToAccountByName(delegation.account.accountName);

    await app.evmStake.startDelegate();
    await app.evmStake.selectFirstValidator();
    await app.evmStake.setAmountAndContinue(DELEGATION_AMOUNT);

    await app.speculos.acceptEnableTransactionCheck();

    await app.deviceValidation.expectDeviceValidationScreen();
    await app.speculos.signEvmContractTransaction();
    await app.evmStake.expectSuccessMessage();
    await app.common.successViewDetails();

    await verifyStakeOperationDetailsInfo(delegation, amountWithCode);
  });
});
