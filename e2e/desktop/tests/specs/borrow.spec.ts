import test from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  FF_BORROW_DESKTOP,
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
} from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const coldStartAccount = Account.ETH_1;
const openLoanAccount = Account.ETH_4;
const LOAN_AMOUNT = "1";

const coldStartFamily = getFamilyByCurrencyId(coldStartAccount.currency.id);
const coldStartTags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  `@${coldStartAccount.currency.id}`,
  ...(coldStartFamily ? [`@family-${coldStartFamily}`] : []),
];

test.describe("Borrow cold start", () => {
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
    "Portfolio entry point opens borrow and shows Introducing Crypto Loan modal",
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

test.describe("Borrow open loan", () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Open loan flow requires broadcast to be enabled — run on manual Desktop E2E with enable_broadcast",
  );

  test.use({
    teamOwner: Team.EARN,
    env: {
      // Same as token.approval.swap: skip Manager app install / firmware checks on Speculos.
      SWAP_DISABLE_APPS_INSTALL: "true",
    },
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: openLoanAccount.currency.speculosApp,
    cliCommandsOnApp: [
      [
        {
          app: openLoanAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(openLoanAccount),
        },
      ],
      { scope: "test" },
    ],
    featureFlags: {
      ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
      ...FF_BORROW_DESKTOP,
    },
  });

  test(
    "Portfolio entry point opens borrow, simulates loan, and completes open-loan execution",
    {
      tag: buildTags({ currencyId: openLoanAccount.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-6065" },
    },
    async ({ app }) => {
      test.setTimeout(480_000);
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowToBeReady(async () =>
        app.portfolio.clickBorrowEntryPoint(),
      );

      await app.borrow.dismissIntroModalIfVisible();
      await app.borrow.typeLoanAmount(LOAN_AMOUNT);
      await app.borrow.clickContinue();
      await app.borrow.expectExecutionFlowVisible();

      if (await app.borrow.isGiveApprovalRequired()) {
        await app.borrow.clickGiveApproval();
        await app.borrow.clickSignSummaryContinue();
        await app.borrow.waitForHostDeviceValidation();
        await app.speculos.signTokenApproval();
        await app.borrow.waitForHostSignModalClosed();
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
