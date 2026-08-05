/**
 * Borrow mobile E2E — single spec file (desktop parity: e2e/desktop/tests/specs/borrow.spec.ts).
 *
 * On-chain scenarios share ETH_4 mainnet state. Each `it` is runnable in isolation via
 * resetLoanState / ensureRepayTestPrecondition / ensureWithdrawReadyForUi guards in hooks or at test start.
 */
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  DEFAULT_LOAN,
  ensureRepayTestPrecondition,
  ensureWithdrawReadyForUi,
  resetLoanState,
} from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { swapSetup } from "../../bridge/server";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";
import { releaseSpeculosDmkSessions } from "../../utils/speculosUtils";
import {
  BORROW_FEATURE_FLAGS,
  BORROW_COLD_START_TEST_TIMEOUT_MS,
  BORROW_HOOK_TIMEOUT_MS,
  BORROW_TEST_TIMEOUT_MS,
} from "./borrow.constants";

import type { ApplicationOptions } from "page";

const borrowTags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"];

const openLoanAccount = Account.ETH_4;

const borrowOnChainInit = (): ApplicationOptions => ({
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: openLoanAccount.currency.speculosApp,
  featureFlags: BORROW_FEATURE_FLAGS,
  cliCommandsOnApp: [
    {
      app: openLoanAccount.currency.speculosApp,
      cmd: liveDataWithAddressCommand(openLoanAccount),
    },
  ],
  speculosForSetupOnly: true,
  recycleSpeculosAfterCliOnApp: true,
});

async function initBorrowApp(options: ApplicationOptions) {
  await app.init(options);
  // Same as desktop borrow / mobile swap: skip Manager app install on Connect device.
  await swapSetup();
  // Prior describes may leave Borrow on the navigation stack; deeplink resets to portfolio
  // (separate spec files used to get a fresh launchApp per file from setup.ts).
  await app.mainNavigation.openPortfolioViaDeeplink();
}

async function openBorrowFromPortfolio() {
  // Deeplink resets navigation even when a prior test left Borrow open (desktop: openTargetFromMainNavigation("home")).
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.portfolio.expectBorrowEntryPointVisible();
}

/** Teardown only — must not fail the suite when on-chain tests already passed (staging API can 403/timeout). */
async function resetLoanStateBestEffort(context: string): Promise<void> {
  try {
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
  } catch (error) {
    console.warn(`[borrow] ${context} resetLoanState failed (non-fatal):`, error);
  }
}

describe("Borrow - Cold start", () => {
  beforeAll(async () => {
    jest.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await initBorrowApp({
      userdata: "speculos-x-other-account",
      featureFlags: BORROW_FEATURE_FLAGS,
    });
  }, BORROW_HOOK_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6062");
  ["@NanoSP", "@LNS", ...borrowTags].forEach(tag => $Tag(tag));

  it(
    "Portfolio entry point opens borrow and shows Introducing Crypto Loan modal",
    async () => {
      jest.setTimeout(BORROW_COLD_START_TEST_TIMEOUT_MS);
      await openBorrowFromPortfolio();
      await app.borrow.goAndWaitForBorrowColdStart(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );
      await app.borrow.verifyIntroModalVisible();
      expect(await app.borrow.isIntroModalShown()).toBe(true);
    },
    BORROW_COLD_START_TEST_TIMEOUT_MS,
  );

  afterAll(async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
  });
});

const runOnChainBorrowTests = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
(runOnChainBorrowTests ? describe : describe.skip)("Borrow - Open loan", () => {
  beforeAll(async () => {
    jest.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
    await releaseSpeculosDmkSessions();
    await initBorrowApp(borrowOnChainInit());
  }, BORROW_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    jest.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanStateBestEffort("open-loan afterAll");
  }, BORROW_HOOK_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6065");
  borrowTags.forEach(tag => $Tag(tag));

  it(
    "Portfolio entry point opens borrow, simulates loan, and completes open-loan execution",
    async () => {
      jest.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await openBorrowFromPortfolio();
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

      await app.borrow.completeAuthorizeExecutionWithRetry({
        clickAuthorize: () => app.borrow.clickAuthorizeDepositing(),
        authorizeButtonId: "borrow-authorize-depositing-button",
        signOnDevice: async () => {
          await app.speculos.acceptEnableTransactionCheck();
          await app.speculos.signEvmContractTransaction();
        },
        expectComplete: () => app.borrow.expectDepositStepCompleted(),
      });

      await app.borrow.completeAuthorizeExecutionWithRetry({
        clickAuthorize: () => app.borrow.clickAuthorizeBorrowing(),
        authorizeButtonId: "borrow-authorize-borrowing-button",
        signOnDevice: async () => {
          await app.speculos.acceptEnableTransactionCheck();
          await app.speculos.signEvmContractTransaction();
        },
        expectComplete: () => app.borrow.expectBorrowStepCompleted(),
      });
      await app.borrow.expectLoanSuccess();
      expect(await app.borrow.isLoanCompletionShown()).toBe(true);
    },
    BORROW_TEST_TIMEOUT_MS,
  );
});

(runOnChainBorrowTests ? describe : describe.skip)("Borrow - Repay and withdraw on-chain", () => {
  beforeAll(async () => {
    jest.setTimeout(BORROW_HOOK_TIMEOUT_MS * 2);
    await releaseSpeculosDmkSessions();
    await initBorrowApp(borrowOnChainInit());
    await ensureRepayTestPrecondition({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
    await releaseSpeculosDmkSessions();
  }, BORROW_HOOK_TIMEOUT_MS * 2);

  afterAll(async () => {
    jest.setTimeout(BORROW_HOOK_TIMEOUT_MS);
    await resetLoanStateBestEffort("repay-withdraw afterAll");
  }, BORROW_HOOK_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6073");
  $TmsLink("B2CQA-6080");
  borrowTags.forEach(tag => $Tag(tag));

  it(
    "Hot start opens repay modal and completes full repay execution",
    async () => {
      jest.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await ensureRepayTestPrecondition({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
      await openBorrowFromPortfolio();
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

      await app.borrow.completeAuthorizeExecutionWithRetry({
        clickAuthorize: () => app.borrow.clickAuthorizeRepay(),
        authorizeButtonId: "borrow-authorize-repay-button",
        signOnDevice: signRepayOnDevice,
        expectComplete: () => app.borrow.expectRepayExecutionCompleted(),
      });
      await app.borrow.expectRepaySuccess();
      expect(await app.borrow.isRepayCompletionShown()).toBe(true);
      await app.mainNavigation.openPortfolioViaDeeplink();
    },
    BORROW_TEST_TIMEOUT_MS,
  );

  it(
    "Hot start routes a fully-repaid loan to withdraw and completes collateral withdrawal",
    async () => {
      jest.setTimeout(BORROW_TEST_TIMEOUT_MS);
      await ensureWithdrawReadyForUi({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });

      await openBorrowFromPortfolio();
      await app.borrow.goAndWaitForWithdrawHotStart(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.clickWithdrawCollateral();

      const signWithdrawOnDevice = async () => {
        await app.speculos.acceptEnableTransactionCheck();
        await app.speculos.signEvmContractTransaction();
      };

      await app.borrow.completeAuthorizeExecutionWithRetry({
        clickAuthorize: () => app.borrow.clickAuthorizeWithdraw(),
        authorizeButtonId: "borrow-authorize-withdraw-button",
        signOnDevice: signWithdrawOnDevice,
        expectComplete: () => app.borrow.expectWithdrawExecutionCompleted(),
      });
      await app.borrow.expectWithdrawSuccess();
      expect(await app.borrow.isWithdrawCompletionShown()).toBe(true);
      await app.borrow.clickBackToMyLoans();
    },
    BORROW_TEST_TIMEOUT_MS,
  );
});
