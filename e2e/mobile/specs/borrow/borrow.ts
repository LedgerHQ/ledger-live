import {
  DEFAULT_LOAN,
  ensureRepayTestPrecondition,
  ensureWithdrawReadyForUi,
  resetLoanState,
} from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";
import { releaseSpeculosDmkSessions } from "../../utils/speculosUtils";
import {
  openBorrowFromPortfolioEntryPoint,
  openLoanSpeculosAppName,
  signEvmContractOnDevice,
  signTokenApprovalOnDevice,
} from "../../utils/borrowUtils";
import { FF_BORROW_E2E } from "../../utils/featureFlagUtils";
import {
  BORROW_COLD_START_TEST_TIMEOUT_MS,
  BORROW_HOOK_TIMEOUT_MS,
  BORROW_TEST_TIMEOUT_MS,
} from "./borrow.constants";
import { beforeAllFunctionBorrow, borrowOnChainInitOptions } from "./borrow.setup";

async function resetLoanStateBestEffort(context: string): Promise<void> {
  try {
    await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
  } catch (error) {
    console.warn(`[borrow] ${context} resetLoanState failed (non-fatal):`, error);
  }
}

export function runBorrowColdStartTest(tags: string[]) {
  describe("Borrow - Cold start", () => {
    beforeAll(async () => {
      await beforeAllFunctionBorrow({
        userdata: "speculos-x-other-account",
        featureFlags: FF_BORROW_E2E,
      });
    }, BORROW_HOOK_TIMEOUT_MS);

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6062");
    ["@LNS", ...tags].forEach(tag => $Tag(tag));

    it(
      "Portfolio entry point opens borrow and shows Introducing Crypto Loan modal",
      async () => {
        await openBorrowFromPortfolioEntryPoint();
        await app.borrow.verifyIntroModalVisible();
        expect(await app.borrow.isIntroModalShown()).toBe(true);
      },
      BORROW_COLD_START_TEST_TIMEOUT_MS,
    );

    afterAll(async () => {
      await app.mainNavigation.openPortfolioViaDeeplink();
    });
  });
}

export function runBorrowOpenLoanTest(tags: string[]) {
  const runHere = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  (runHere ? describe : describe.skip)("Borrow - Open loan", () => {
    beforeAll(async () => {
      await resetLoanState({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
      await releaseSpeculosDmkSessions();
      await beforeAllFunctionBorrow(borrowOnChainInitOptions());
    }, BORROW_HOOK_TIMEOUT_MS);

    afterAll(async () => {
      await resetLoanStateBestEffort("open-loan afterAll");
      try {
        await app.mainNavigation.openPortfolioViaDeeplink();
      } catch (error) {
        console.warn("[borrow] open-loan afterAll portfolio reset failed (non-fatal):", error);
      }
    }, BORROW_HOOK_TIMEOUT_MS);

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6065");
    tags.forEach(tag => $Tag(tag));

    it(
      "Portfolio entry point opens borrow, simulates loan, and completes open-loan execution",
      async () => {
        await openBorrowFromPortfolioEntryPoint();
        await app.borrow.expectSimulateLoanScreen();
        await app.borrow.typeLoanAmount(DEFAULT_LOAN);
        await app.borrow.clickContinue();
        await app.borrow.expectExecutionFlowVisible();

        if (await app.borrow.completeGiveApprovalIfRequired()) {
          await app.borrow.completeHostDeviceSignature(
            openLoanSpeculosAppName,
            signTokenApprovalOnDevice,
          );
          await app.borrow.expectApprovalStepCompleted();
        }

        await app.borrow.authorizeDepositingWithRetry(
          openLoanSpeculosAppName,
          signEvmContractOnDevice,
        );
        await app.borrow.authorizeBorrowingWithRetry(
          openLoanSpeculosAppName,
          signEvmContractOnDevice,
        );
        await app.borrow.expectLoanSuccess();
        expect(await app.borrow.isLoanCompletionShown()).toBe(true);
      },
      BORROW_TEST_TIMEOUT_MS,
    );
  });
}

export function runBorrowRepayTest(tags: string[]) {
  const runHere = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  (runHere ? describe : describe.skip)("Borrow - Repay on-chain", () => {
    beforeAll(async () => {
      await releaseSpeculosDmkSessions();
      await beforeAllFunctionBorrow(borrowOnChainInitOptions());
      await ensureRepayTestPrecondition({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
      await releaseSpeculosDmkSessions();
    }, BORROW_HOOK_TIMEOUT_MS * 2);

    afterAll(async () => {
      await resetLoanStateBestEffort("repay afterAll");
    }, BORROW_HOOK_TIMEOUT_MS);

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6073");
    tags.forEach(tag => $Tag(tag));

    it(
      "Hot start opens repay modal and completes full repay execution",
      async () => {
        await ensureRepayTestPrecondition({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
        await openBorrowFromPortfolioEntryPoint();
        await app.borrow.expectLoansDashboardVisible();

        await app.borrow.clickActiveLoanDashboardRow();
        await app.borrow.clickRepay();
        await app.borrow.submitRepayInFull();

        if (await app.borrow.completeRepayGiveApprovalIfRequired()) {
          await app.borrow.completeHostDeviceSignature(
            openLoanSpeculosAppName,
            signTokenApprovalOnDevice,
          );
          await app.borrow.expectRepayApprovalStepCompleted();
        }

        await app.borrow.authorizeRepayWithRetry(openLoanSpeculosAppName, signEvmContractOnDevice);
        await app.borrow.expectRepaySuccess();
        expect(await app.borrow.isRepayCompletionShown()).toBe(true);
        await app.mainNavigation.openPortfolioViaDeeplink();
      },
      BORROW_TEST_TIMEOUT_MS,
    );
  });
}

export function runBorrowWithdrawTest(tags: string[]) {
  const runHere = process.env.DISABLE_TRANSACTION_BROADCAST === "0";
  (runHere ? describe : describe.skip)("Borrow - Withdraw on-chain", () => {
    beforeAll(async () => {
      await releaseSpeculosDmkSessions();
      await beforeAllFunctionBorrow(borrowOnChainInitOptions());
      await ensureWithdrawReadyForUi({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
      await releaseSpeculosDmkSessions();
    }, BORROW_HOOK_TIMEOUT_MS * 2);

    afterAll(async () => {
      await resetLoanStateBestEffort("withdraw afterAll");
    }, BORROW_HOOK_TIMEOUT_MS);

    setTeamOwner(Team.EARN);
    $TmsLink("B2CQA-6080");
    tags.forEach(tag => $Tag(tag));

    it(
      "Hot start routes a fully-repaid loan to withdraw and completes collateral withdrawal",
      async () => {
        await ensureWithdrawReadyForUi({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
        await openBorrowFromPortfolioEntryPoint();
        await app.borrow.expectLoansDashboardVisible();

        await app.borrow.clickRepaidLoanDashboardRow();
        await app.borrow.clickWithdrawCollateral();

        await app.borrow.authorizeWithdrawWithRetry(
          openLoanSpeculosAppName,
          signEvmContractOnDevice,
        );
        await app.borrow.expectWithdrawSuccess();
        expect(await app.borrow.isWithdrawCompletionShown()).toBe(true);
        await app.borrow.clickBackToMyLoans();
      },
      BORROW_TEST_TIMEOUT_MS,
    );
  });
}
