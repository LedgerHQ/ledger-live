import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Operations history", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
    featureFlags: FF_LWD_WALLET_40_Q2,
  });

  test(
    "Operations list entry points, layout, details drawer and CSV export",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-5256, B2CQA-5266, B2CQA-5274, B2CQA-5276, B2CQA-5282, B2CQA-5331",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const { testId } = test.info();

      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.history.openFromTopBar();
      await app.history.expectHistoryPageVisible();

      await app.history.expectFourColumnLayout();

      await app.history.expectRowRendersForOut();

      await app.history.expectRowRendersForIn();

      const clickedRow = await app.history.clickFirstOperationRow();
      await app.operationDrawer.expectOperationDetailsVisible(clickedRow);
      await app.operationDrawer.closeDrawer();

      await app.history.clickExportCsv();
      await app.history.selectFirstAccountForExport();
      await app.history.expectExportButtonEnabled();
      await app.history.confirmExportCsvAndWaitForFile(testId);
      await app.history.expectExportedFileContents(testId);
      await app.history.closeExportSuccessDialog();
    },
  );
});
