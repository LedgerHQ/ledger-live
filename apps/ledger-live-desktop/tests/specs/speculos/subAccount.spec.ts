import { test } from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const subAccounts = [
  { account: Account.ETH_USDT_1, xrayTicket1: "B2CQA-2577, B2CQA-1079", xrayTicket2: "B2CQA-2583" },
  { account: Account.XLM_USCD, xrayTicket1: "B2CQA-2579", xrayTicket2: "B2CQA-2585" },
  { account: Account.ALGO_USDT_1, xrayTicket1: "B2CQA-2575", xrayTicket2: "B2CQA-2581" },
  { account: Account.TRX_USDT, xrayTicket1: "B2CQA-2580", xrayTicket2: "B2CQA-2586" },
  { account: Account.BSC_BUSD_1, xrayTicket1: "B2CQA-2576", xrayTicket2: "B2CQA-2582" },
  { account: Account.POL_DAI_1, xrayTicket1: "B2CQA-2578", xrayTicket2: "B2CQA-2584" },
];

const subAccountReceive = [
  { account: Account.ETH_USDT_1, xrayTicket: "B2CQA-2492" },
  { account: Account.ETH_LIDO, xrayTicket: "B2CQA-2491" },
  { account: Account.TRX_USDT, xrayTicket: "B2CQA-2496" },
  { account: Account.BSC_BUSD_1, xrayTicket: "B2CQA-2489" },
  { account: Account.BSC_SHIBA, xrayTicket: "B2CQA-2490" },
  { account: Account.POL_DAI_1, xrayTicket: "B2CQA-2493" },
  { account: Account.POL_UNI, xrayTicket: "B2CQA-2494" },
];

for (const token of subAccounts) {
  test.describe("Add subAccount without parent", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: token.account.currency.speculosApp,
    });

    test(
      `Add Sub Account without parent (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket1,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();

        await app.addAccount.selectToken(token.account);
        await app.addAccount.addAccounts();

        await app.addAccount.done();
        await app.layout.goToPortfolio();
        await app.portfolio.navigateToAsset(token.account.currency.name);
        await app.account.navigateToToken(token.account);
        await app.account.expectLastOperationsVisibility();
        await app.account.expectTokenAccount(token.account);
      },
    );
  });
}

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const token of subAccountReceive) {
  test.describe("Add subAccount when parent exists", () => {
    test.use({
      userdata: "speculos-subAccount",
      speculosApp: token.account.currency.speculosApp,
    });

    test(
      `[${token.account.currency.speculosApp.name}] Add subAccount when parent exists (${token.account.currency.ticker})`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.account.accountName);
        await app.account.expectAccountVisibility(token.account.accountName);

        await app.account.clickAddToken();
        await app.receive.selectToken(token.account);

        await app.modal.continue();

        const displayedAddress = await app.receive.getAddressDisplayed();
        await app.receive.expectValidReceiveAddress(displayedAddress);

        await app.speculos.expectValidAddressDevice(token.account, displayedAddress);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

for (const token of subAccounts) {
  test.describe("Token visible in parent account", () => {
    test.use({
      userdata: "speculos-subAccount",
    });

    test(
      `Token visible in parent account (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket2,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.account.accountName);
        await app.account.expectTokenToBePresent(token.account);
      },
    );
  });
}
