import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { FF_PREDICTIONS_DESKTOP } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const xrayTicket = "B2CQA-6731";

test.describe("Predictions", () => {
  test.use({
    teamOwner: Team.PREDICTIONS,
    // The intro is already accepted via "Discover predictions".
    userdata: "predictions-intro-seen",
    featureFlags: FF_PREDICTIONS_DESKTOP,
  });

  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
  });

  test(
    "Terms and risk disclaimer",
    {
      tag: buildTags({}),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.portfolio.clickServicesEntryPoint("predictions");
      await app.predictionsTermsDialog.expectNotAccepted();
      await app.predictionsTermsDialog.expectRiskDisclaimer();

      await app.predictionsTermsDialog.close();
      await app.mainNavigation.validateTargetFromMainNavigation("home");

      await app.portfolio.clickServicesEntryPoint("predictions");
      await app.predictionsTermsDialog.expectNotAccepted();
      await app.predictionsTermsDialog.accept();
      await app.predictionsConsentDialog.expectNotAccepted();

      await app.predictionsConsentDialog.close();
      await app.mainNavigation.validateTargetFromMainNavigation("home");

      await app.portfolio.clickServicesEntryPoint("predictions");
      await app.predictionsConsentDialog.expectNotAccepted();
      await app.predictionsTermsDialog.expectHidden();
      await app.predictionsConsentDialog.accept();
      await app.modularDialog.checkAssetSelectionVisible();
    },
  );
});
