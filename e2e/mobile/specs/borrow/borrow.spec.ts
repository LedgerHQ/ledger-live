import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { swapSetup } from "@e2e/bridge/server";
import { DEFAULT_LOAN, resetLoanState } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { BroadcastFlow, shouldRunBroadcastFlow } from "@e2e/helpers/broadcastRotation";
import { resetCollateralAllowance } from "@e2e/utils/borrowUtils";
import { NANO_APP_CATALOG_PATH } from "@e2e/utils/constants";
import { FF_BORROW_ENABLED } from "@e2e/utils/featureFlagUtils";

const loanAccount = Account.ETH_4;
const collateralAccount = TokenAccount.ETH_WBTC_4;
const COLLATERAL_SYMBOL = "wBTC";
const EXPECTED_LTV = "50%";

/** Each step carries its own 240s on-chain budget, which exceeds the 360s jest default. */
const BORROW_TIMEOUT_MS = 900_000;
const borrowSetupOptions = { nanoAppCatalogPath: NANO_APP_CATALOG_PATH };

/**
 * Real mainnet transactions on a shared account, so this runs only on the broadcast lane and
 * only on the one platform this run assigns it. The tests chain: open leaves the loan the
 * repay test settles, and repay leaves the collateral the withdraw test takes back out.
 */
(shouldRunBroadcastFlow(BroadcastFlow.BORROW) ? describe : describe.skip)("Borrow", () => {
  beforeAll(async () => {
    await resetLoanState(borrowSetupOptions);
    await app.init({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: loanAccount.currency.speculosApp,
      featureFlags: FF_BORROW_ENABLED,
      cliCommandsOnApp: [
        {
          app: loanAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(loanAccount),
        },
      ],
    });
    // Sets SWAP_DISABLE_APPS_INSTALL: without it connectApp quits the Ethereum app to reach the
    // dashboard, which terminates the single-app Speculos container.
    await swapSetup();
    // Needs the address app.init resolves, and runs after the reset because closing a
    // position can itself re-approve the collateral.
    await resetCollateralAllowance(collateralAccount);
    await app.mainNavigation.openPortfolioViaDeeplink();
  }, BORROW_TIMEOUT_MS);

  afterAll(async () => {
    try {
      await resetLoanState(borrowSetupOptions);
    } catch (error) {
      console.error(
        `[borrow] cleanup failed — ${loanAccount.accountName} may still hold a position:`,
        error,
      );
    }
  }, BORROW_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6065");
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"].forEach(tag =>
    $Tag(tag),
  );

  it(
    "should open a loan with wBTC collateral through approval, deposit and borrow",
    async () => {
      await app.portfolio.expectBorrowEntryPointVisible();
      await app.portfolio.clickBorrowEntryPoint();
      await app.borrow.expectBorrowScreenVisible();

      await app.borrow.expectIntroModal();
      await app.borrow.clickSimulateMyLoan();
      await app.borrow.expectSimulateLoanScreen();

      await app.borrow.typeLoanAmount(DEFAULT_LOAN);
      await app.borrow.expectCollateral(COLLATERAL_SYMBOL);
      await app.borrow.expectLoanToValue(EXPECTED_LTV);

      await app.borrow.clickContinue();
      await app.borrow.expectExecutionScreen();

      await app.borrow.completeApprovalStep();
      await app.borrow.authorizeDeposit();
      await app.borrow.authorizeBorrow();

      await app.borrow.clickViewMyLoan();
      await app.borrow.expectLoansDashboard();
      await expect(app.borrow.expectLoanDashboardRow()).resolves.toBeUndefined();
    },
    BORROW_TIMEOUT_MS,
  );

  $TmsLink("B2CQA-6073");
  it(
    "should repay the open loan in full",
    async () => {
      await app.borrow.clickActiveLoanDashboardRow();
      await app.borrow.clickRepay();
      await app.borrow.submitRepayInFull();

      await app.borrow.completeRepayApprovalStepIfRequired();
      await app.borrow.authorizeRepay();
      await expect(app.borrow.expectRepaySuccess()).resolves.toBeUndefined();
    },
    BORROW_TIMEOUT_MS,
  );

  $TmsLink("B2CQA-6080");
  it(
    "should withdraw the collateral after full repay",
    async () => {
      await app.borrow.clickViewMyLoan();
      await app.borrow.expectLoansDashboard();

      await app.borrow.clickRepaidLoanDashboardRow();
      await app.borrow.clickWithdrawCollateral();
      await app.borrow.authorizeWithdraw();
      await expect(app.borrow.expectWithdrawSuccess()).resolves.toBeUndefined();
      await app.borrow.clickBackToMyLoans();
    },
    BORROW_TIMEOUT_MS,
  );
});
