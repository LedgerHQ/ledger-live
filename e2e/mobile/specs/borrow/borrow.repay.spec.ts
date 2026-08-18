import { ensureRepayTestPrecondition } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
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
  BORROW_TAGS.forEach(tag => $Tag(tag));

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
