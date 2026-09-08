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

/** Three mainnet transactions, each with its own on-chain budget, exceed the 360s jest default. */
const BORROW_TIMEOUT_MS = 600_000;
/**
 * Repay and withdraw precondition the loan first, so their setup pays for a full open on top of
 * the reset — and withdraw adds an API repay after it. Each leg waits on mainnet confirmations,
 * and zeroing the debt allowance adds an approval transaction to every later repay.
 */
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

/**
 * Every flow below drives the same funded mainnet account, so none of them may run next to
 * another: they live in one file because jest parallelises across files and never within one,
 * and they share the single `BORROW` broadcast slot so a run cannot split them across
 * platforms. Each still owns its precondition through the borrow driver rather than inheriting
 * one from the flow above, so any of them can run, or be retried, on its own.
 */
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
  // Sets SWAP_DISABLE_APPS_INSTALL: without it connectApp quits the Ethereum app to reach the
  // dashboard, which terminates the single-app Speculos container.
  await swapSetup();
  // The deposit, borrow, repay and withdraw calls are Morpho calldata with no clear-signing
  // descriptor, so the app shows "Blind signing must be enabled in settings" and never renders a
  // review until this is on. Speculos NVRAM is per-container, so it is set on each fresh device.
  await app.speculos.enableBlindSigning();
}

/**
 * The driver boots a Speculos of its own and clears SPECULOS_API_PORT when it tears it down,
 * so the app's device is released first rather than being pulled out from under it.
 */
async function resetBorrowState(flowName: string) {
  try {
    await app.common.removeSpeculos();
  } catch (error) {
    console.error(`[borrow] ${flowName} could not release the app's Speculos:`, error);
  }
  try {
    await resetLoanState(borrowSetupOptions);
  } catch (error) {
    console.error(
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
      await expect(app.borrow.expectLoanDashboardRow()).resolves.toBeUndefined();
    },
    BORROW_TIMEOUT_MS,
  );
});

describeBorrowFlow("Borrow - Repay", () => {
  beforeAll(async () => {
    // Reset before opening rather than reusing whatever debt is already there: a leftover loan
    // can sit on another market with another debt token, and the allowance this test zeroes —
    // and so the approval step it expects — is specific to the default market's token.
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

      await expect(app.borrow.expectRepaySuccess()).resolves.toBeUndefined();
    },
    BORROW_TIMEOUT_MS,
  );
});

describeBorrowFlow("Borrow - Withdraw", () => {
  beforeAll(async () => {
    // Unconditionally reset, open and repay through the API, for the same reason as repay: the
    // idempotent variant would hand the UI whatever repaid position happened to be lying around.
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

      await expect(app.borrow.expectWithdrawSuccess()).resolves.toBeUndefined();
      await app.borrow.clickBackToMyLoans();
    },
    BORROW_TIMEOUT_MS,
  );
});
