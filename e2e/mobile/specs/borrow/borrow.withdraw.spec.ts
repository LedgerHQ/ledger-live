import { ensureWithdrawReadyForUi } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";
import {
  openBorrowFromPortfolioEntryPoint,
  openLoanSpeculosAppName,
  signEvmContractOnDevice,
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
  BORROW_TAGS.forEach(tag => $Tag(tag));

  it(
    "Hot start routes a fully-repaid loan to withdraw and completes collateral withdrawal",
    async () => {
      await ensureWithdrawReadyForUi({ nanoAppCatalogPath: NANO_APP_CATALOG_PATH });
      await openBorrowFromPortfolioEntryPoint();
      await app.borrow.expectLoansDashboardVisible();

      await app.borrow.clickRepaidLoanDashboardRow();
      await app.borrow.clickWithdrawCollateral();

      await app.borrow.authorizeWithdrawWithRetry(openLoanSpeculosAppName, signEvmContractOnDevice);
      await app.borrow.expectWithdrawSuccess();
      expect(await app.borrow.isWithdrawCompletionShown()).toBe(true);
      await app.borrow.clickBackToMyLoans();
    },
    BORROW_TEST_TIMEOUT_MS,
  );
});
