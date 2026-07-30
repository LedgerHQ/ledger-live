import { resolve as resolvePath } from "node:path";
import test from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  DEFAULT_LOAN,
  ensureRepayTestPrecondition,
  ensureWithdrawReadyForUi,
  resetLoanState,
} from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import {
  FF_BORROW_DESKTOP,
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
} from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

test.describe.configure({ mode: "serial" });

const coldStartAccount = Account.ETH_1;
const openLoanAccount = Account.ETH_4;
const NANO_APP_CATALOG = resolvePath(__dirname, "../artifacts/appVersion/nano-app-catalog.json");

const BORROW_HOOK_TIMEOUT_MS = 600_000;
const BORROW_TEST_TIMEOUT_MS = 480_000;

const coldStartTags = buildTags({ currencyId: coldStartAccount.currency.id });

const borrowOnChainTags = buildTags({
  currencyId: openLoanAccount.currency.id,
  skipLNS: true,
});

const borrowOnChainFixture = {
  teamOwner: Team.EARN,
  env: {
    SWAP_DISABLE_APPS_INSTALL: "true",
  },
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: openLoanAccount.currency.speculosApp,
  featureFlags: {
    ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    ...FF_BORROW_DESKTOP,
  },
};

const useBorrowOnChainFixture = (): void => {
  test.use({
    ...borrowOnChainFixture,
    cliCommandsOnApp: [
      [
        {
          app: openLoanAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(openLoanAccount),
        },
      ],
      { scope: "test" },
    ],
  });
};

test.describe("Borrow", () => {
  test.use({
    teamOwner: Team.EARN,
    // Isolated seed with a single ETH account — never used for borrow, so cold start is stable in CI.
    userdata: "speculos-x-other-account",
    featureFlags: {
      ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
      ...FF_BORROW_DESKTOP,
    },
  });

  test(
    `[${coldStartAccount.currency.testLabel}] - Borrow entry point from portfolio shows the crypto loan modal`,
    {
      tag: coldStartTags,
      annotation: { type: "TMS", description: "B2CQA-6062" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowColdStart(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.verifyIntroModalVisible();
    },
  );
});

test.describe("Borrow", () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Open loan flow requires broadcast to be enabled — run on manual Desktop E2E with enable_broadcast",
  );

  useBorrowOnChainFixture();

  test.beforeAll(async () => {
    test.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG });
  });

  test.afterAll(async () => {
    test.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG });
  });

  test(
    `[${openLoanAccount.currency.testLabel}] - Borrow simulates a loan and completes the open-loan execution`,
    {
      tag: borrowOnChainTags,
      annotation: { type: "TMS", description: "B2CQA-6065" },
    },
    async ({ app }) => {
      test.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowToBeReady(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.dismissIntroModalIfVisible();
      await app.borrow.typeLoanAmount(DEFAULT_LOAN);
      await app.borrow.clickContinue();
      await app.borrow.expectExecutionFlowVisible();

      if (await app.borrow.completeGiveApprovalIfRequired()) {
        await app.borrow.completeHostDeviceSignature(async () => {
          await app.speculos.signTokenApproval();
        });
        await app.borrow.expectApprovalStepCompleted();
      }

      await app.borrow.clickAuthorizeDepositing();
      await app.borrow.clickSignSummaryContinue();
      await app.speculos.acceptEnableTransactionCheck();
      await app.borrow.waitForHostDeviceValidation();
      await app.speculos.signEvmContractTransaction();
      await app.borrow.waitForHostSignModalClosed();
      await app.borrow.expectDepositStepCompleted();

      await app.borrow.clickAuthorizeBorrowing();
      await app.borrow.clickSignSummaryContinue();
      await app.speculos.acceptEnableTransactionCheck();
      await app.borrow.waitForHostDeviceValidation();
      await app.speculos.signEvmContractTransaction();
      await app.borrow.waitForHostSignModalClosed();
      await app.borrow.expectBorrowStepCompleted();

      await app.borrow.expectLoanSuccess();
    },
  );
});

test.describe("Borrow repay and withdraw on-chain", () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Repay/withdraw flows require broadcast to be enabled — run on manual Desktop E2E with enable_broadcast",
  );

  useBorrowOnChainFixture();

  test.beforeAll(async () => {
    test.setTimeout(BORROW_HOOK_TIMEOUT_MS * 2);
    await ensureRepayTestPrecondition({ nanoAppCatalogPath: NANO_APP_CATALOG });
  });

  test.afterAll(async () => {
    test.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG });
  });

  test(
    "Hot start opens repay modal and completes full repay execution",
    {
      tag: borrowOnChainTags,
      annotation: { type: "TMS", description: "B2CQA-6073" },
    },
    async ({ app }) => {
      test.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowHotStart(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.clickActiveLoanDashboardRow();
      await app.borrow.clickRepay();
      await app.borrow.submitRepayInFull();

      if (await app.borrow.completeRepayGiveApprovalIfRequired()) {
        await app.borrow.completeHostDeviceSignature(async () => {
          await app.speculos.signTokenApproval();
        });
        await app.borrow.expectRepayApprovalStepCompleted();
      }

      const signRepayOnDevice = async () => {
        await app.speculos.acceptEnableTransactionCheck();
        await app.speculos.signEvmContractTransaction();
      };

      await app.borrow.clickAuthorizeRepay();
      await app.borrow.completeHostDeviceSignature(signRepayOnDevice);

      if (await app.borrow.clickExecutionTryAgainIfVisible()) {
        await app.borrow.clickAuthorizeRepay();
        await app.borrow.completeHostDeviceSignature(signRepayOnDevice);
      }

      await app.borrow.expectRepayExecutionCompleted();
      await app.borrow.expectRepaySuccess();
    },
  );

  test(
    "Hot start routes a fully-repaid loan to withdraw and completes collateral withdrawal",
    {
      tag: borrowOnChainTags,
      annotation: { type: "TMS", description: "B2CQA-6080" },
    },
    async ({ app }) => {
      test.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await ensureWithdrawReadyForUi({ nanoAppCatalogPath: NANO_APP_CATALOG });

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowHotStart(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.clickRepaidLoanDashboardRow();
      await app.borrow.clickWithdrawCollateral();

      const signWithdrawOnDevice = async () => {
        await app.speculos.acceptEnableTransactionCheck();
        await app.speculos.signEvmContractTransaction();
      };

      await app.borrow.clickAuthorizeWithdraw();
      await app.borrow.completeHostDeviceSignature(signWithdrawOnDevice);

      if (await app.borrow.clickExecutionTryAgainIfVisible()) {
        await app.borrow.clickAuthorizeWithdraw();
        await app.borrow.completeHostDeviceSignature(signWithdrawOnDevice);
      }

      await app.borrow.expectWithdrawExecutionCompleted();
      await app.borrow.expectWithdrawSuccess();
      await app.borrow.clickBackToMyLoans();
    },
  );
});
