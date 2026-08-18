import { DEFAULT_LOAN, resetLoanState } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";
import {
  openBorrowFromPortfolioEntryPoint,
  openLoanSpeculosAppName,
  signEvmContractOnDevice,
  signTokenApprovalOnDevice,
} from "../../utils/borrowUtils";
import { releaseSpeculosDmkSessions } from "../../utils/speculosUtils";
import { BORROW_HOOK_TIMEOUT_MS, BORROW_TAGS, BORROW_TEST_TIMEOUT_MS } from "./borrow.constants";
import {
  beforeAllFunctionBorrow,
  borrowOnChainInitOptions,
  resetLoanStateBestEffort,
} from "./borrow.setup";

jest.setTimeout(BORROW_HOOK_TIMEOUT_MS * 2);

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
  BORROW_TAGS.forEach(tag => $Tag(tag));

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
