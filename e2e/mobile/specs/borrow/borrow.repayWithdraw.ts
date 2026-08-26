import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { swapSetup } from "../../bridge/server";
import {
  ensureRepayTestPrecondition,
  ensureWithdrawReadyForUi,
  resetLoanState,
} from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { BroadcastFlow, shouldRunBroadcastFlow } from "../../helpers/broadcastRotation";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";
import { FF_BORROW_ENABLED } from "../../utils/featureFlagUtils";

const loanAccount = Account.ETH_4;

/** Repay is one mainnet transaction, withdraw is one — two flows × 240s each plus setup. */
const BORROW_TIMEOUT_MS = 600_000;
const borrowSetupOptions = { nanoAppCatalogPath: NANO_APP_CATALOG_PATH };

const DEVICE_TAGS = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"] as const;
const COIN_TAGS = ["@ethereum", "@family-evm"] as const;

(shouldRunBroadcastFlow(BroadcastFlow.BORROW) ? describe : describe.skip)(
  "Borrow - Repay loan",
  () => {
    beforeAll(async () => {
      // CLI setup runs BEFORE app.init to avoid a Speculos port conflict with the UI device.
      await ensureRepayTestPrecondition(borrowSetupOptions);
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
      // Sets SWAP_DISABLE_APPS_INSTALL so connectApp does not quit the Ethereum app.
      await swapSetup();
      await app.mainNavigation.openPortfolioViaDeeplink();
    }, BORROW_TIMEOUT_MS);

    // No afterAll reset: the repaid-loan state is the precondition for the withdraw describe.

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6073");
    [...DEVICE_TAGS, ...COIN_TAGS].forEach(tag => $Tag(tag));

    it(
      "should repay an open loan in full",
      async () => {
        await app.portfolio.expectBorrowEntryPointVisible();
        await app.portfolio.clickBorrowEntryPoint();
        await app.borrow.expectBorrowScreenVisible();
        await app.borrow.expectLoansDashboard();

        await app.borrow.clickActiveLoanDashboardRow();
        await app.borrow.clickRepay();
        await app.borrow.submitRepayInFull();
        await app.borrow.completeRepayApprovalStepIfRequired();
        await app.borrow.authorizeRepay();
        await expect(app.borrow.expectRepaySuccess()).resolves.toBeUndefined();
      },
      BORROW_TIMEOUT_MS,
    );
  },
);

(shouldRunBroadcastFlow(BroadcastFlow.BORROW) ? describe : describe.skip)(
  "Borrow - Withdraw collateral",
  () => {
    beforeAll(async () => {
      // CLI setup runs BEFORE app.init to avoid a Speculos port conflict with the UI device.
      // If the repay describe ran successfully, this is a no-op (withdraw-ready position found).
      await ensureWithdrawReadyForUi(borrowSetupOptions);
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
      await swapSetup();
      await app.mainNavigation.openPortfolioViaDeeplink();
    }, BORROW_TIMEOUT_MS);

    afterAll(async () => {
      try {
        await resetLoanState(borrowSetupOptions);
      } catch (error) {
        console.error(
          `[borrow] withdraw cleanup failed — ${loanAccount.accountName} may still hold a position:`,
          error,
        );
      }
    }, BORROW_TIMEOUT_MS);

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6080");
    [...DEVICE_TAGS, ...COIN_TAGS].forEach(tag => $Tag(tag));

    it(
      "should withdraw collateral after full repay",
      async () => {
        await app.portfolio.expectBorrowEntryPointVisible();
        await app.portfolio.clickBorrowEntryPoint();
        await app.borrow.expectBorrowScreenVisible();
        await app.borrow.expectLoansDashboard();

        await app.borrow.clickRepaidLoanDashboardRow();
        await app.borrow.clickWithdrawCollateral();
        await app.borrow.authorizeWithdraw();
        await expect(app.borrow.expectWithdrawSuccess()).resolves.toBeUndefined();
        await app.borrow.clickBackToMyLoans();
      },
      BORROW_TIMEOUT_MS,
    );
  },
);
