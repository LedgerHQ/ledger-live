import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { swapSetup } from "@e2e/bridge/server";
import {
  DEFAULT_LOAN,
  ensureLoanOpen,
  ensureLoanRepaidForWithdraw,
  resetLoanState,
} from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { BroadcastFlow, shouldRunBroadcastFlow } from "@e2e/helpers/broadcastRotation";
import { NANO_APP_CATALOG_PATH } from "@e2e/utils/constants";
import { FF_BORROW_ENABLED } from "@e2e/utils/featureFlagUtils";
import { resetCollateralAllowance, resetDebtAllowance } from "@e2e/utils/borrowUtils";

const loanAccount = Account.ETH_4;
const collateralAccount = TokenAccount.ETH_WBTC_4;
const debtAccount = TokenAccount.ETH_USDT_4;
const COLLATERAL_SYMBOL = "wBTC";
const EXPECTED_LTV = "50%";

const BORROW_TIMEOUT_MS = 600_000;
/** A precondition opens, and for withdraw also repays, a loan before the test starts. */
const BORROW_PRECONDITION_TIMEOUT_MS = 1_800_000;
const borrowSetupOptions = { nanoAppCatalogPath: NANO_APP_CATALOG_PATH };

const BORROW_TAGS = [
  "@NanoSP",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
];

const describeBorrowFlow = shouldRunBroadcastFlow(BroadcastFlow.BORROW) ? describe : describe.skip;

async function initBorrowApp() {
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
  // Sets SWAP_DISABLE_APPS_INSTALL, without which connectApp quits the single-app container.
  await swapSetup();
  // Morpho calldata has no clear-signing descriptor, and Speculos NVRAM is per-container.
  await app.speculos.enableBlindSigning();
}

/** Releases the app's Speculos first: the driver clears SPECULOS_API_PORT when it tears its own down. */
async function resetBorrowState(flowName: string) {
  try {
    await app.common.removeSpeculos();
  } catch (error) {
    console.warn(`[borrow] ${flowName} could not release the app's Speculos:`, error);
  }
  try {
    await resetLoanState(borrowSetupOptions);
  } catch (error) {
    console.warn(
      `[borrow] ${flowName} cleanup failed — ${loanAccount.accountName} may still hold a position:`,
      error,
    );
  }
}

describeBorrowFlow("Borrow - Open loan", () => {
  beforeAll(async () => {
    await resetLoanState(borrowSetupOptions);
    await initBorrowApp();
    await resetCollateralAllowance(collateralAccount);
    await app.mainNavigation.openPortfolioViaDeeplink();
  }, BORROW_TIMEOUT_MS);

  afterAll(async () => {
    await resetBorrowState("open-loan");
  }, BORROW_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6065");
  BORROW_TAGS.forEach(tag => $Tag(tag));

  it(
    "should open a loan by approving wBTC collateral then authorizing deposit and borrow",
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

      await app.borrow.expectAccessAlreadyApproved();
      await app.borrow.authorizeDeposit();
      await app.borrow.authorizeBorrow();

      await app.borrow.clickViewMyLoan();
      await app.borrow.expectLoansDashboard();
      await app.borrow.expectLoanDashboardRow();
    },
    BORROW_TIMEOUT_MS,
  );
});

describeBorrowFlow("Borrow - Repay", () => {
  beforeAll(async () => {
    // A leftover loan can sit on another market, whose debt token is not the one zeroed below.
    await resetLoanState(borrowSetupOptions);
    await ensureLoanOpen(borrowSetupOptions);
    await initBorrowApp();
    await resetDebtAllowance(debtAccount);
    await app.mainNavigation.openPortfolioViaDeeplink();
  }, BORROW_PRECONDITION_TIMEOUT_MS);

  afterAll(async () => {
    await resetBorrowState("repay");
  }, BORROW_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6073");
  BORROW_TAGS.forEach(tag => $Tag(tag));

  it(
    "should repay an open loan in full through approval and repayment",
    async () => {
      await app.portfolio.expectBorrowEntryPointVisible();
      await app.portfolio.clickBorrowEntryPoint();
      await app.borrow.expectBorrowScreenVisible();

      await app.borrow.expectHotStartDashboard();
      await app.borrow.openActiveLoan();

      await app.borrow.clickRepay();
      await app.borrow.submitRepayInFull();

      await app.borrow.completeRepayApprovalStep();
      await app.borrow.authorizeRepay();

      await app.borrow.expectRepaySuccess();
    },
    BORROW_TIMEOUT_MS,
  );
});

describeBorrowFlow("Borrow - Withdraw", () => {
  beforeAll(async () => {
    await ensureLoanRepaidForWithdraw(borrowSetupOptions);
    await initBorrowApp();
    await app.mainNavigation.openPortfolioViaDeeplink();
  }, BORROW_PRECONDITION_TIMEOUT_MS);

  afterAll(async () => {
    await resetBorrowState("withdraw");
  }, BORROW_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6080");
  BORROW_TAGS.forEach(tag => $Tag(tag));

  it(
    "should withdraw the collateral of a fully repaid loan",
    async () => {
      await app.portfolio.expectBorrowEntryPointVisible();
      await app.portfolio.clickBorrowEntryPoint();
      await app.borrow.expectBorrowScreenVisible();

      await app.borrow.expectHotStartDashboard();
      await app.borrow.openRepaidLoan();

      await app.borrow.clickWithdrawCollateral();
      await app.borrow.authorizeWithdraw();

      await app.borrow.expectWithdrawSuccess();
      await app.borrow.clickBackToMyLoans();
    },
    BORROW_TIMEOUT_MS,
  );
});
