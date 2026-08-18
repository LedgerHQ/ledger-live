import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { FF_BORROW_ENABLED } from "../../utils/featureFlagUtils";
import { openBorrowFromPortfolioEntryPoint } from "../../utils/borrowUtils";
import {
  BORROW_COLD_START_TEST_TIMEOUT_MS,
  BORROW_HOOK_TIMEOUT_MS,
  BORROW_TAGS,
} from "./borrow.constants";
import { beforeAllFunctionBorrow } from "./borrow.setup";

jest.setTimeout(BORROW_HOOK_TIMEOUT_MS * 2);

describe("Borrow - Cold start", () => {
  beforeAll(async () => {
    await beforeAllFunctionBorrow({
      userdata: "speculos-x-other-account",
      featureFlags: FF_BORROW_ENABLED,
    });
  }, BORROW_HOOK_TIMEOUT_MS);

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6062");
  ["@LNS", ...BORROW_TAGS].forEach(tag => $Tag(tag));

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
