import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { FF_PREDICTIONS_DESKTOP } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const xrayTicket = "B2CQA-6731";
// TODO: replace this deeplink with the real entry point.
const predictionsDeeplink = "ledgerwallet://predictions";

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
      tag: buildTags({ skipLNS: true }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.mainNavigation.openDeeplink(predictionsDeeplink);
      await app.predictionsDialog.expectTermsNotAccepted();
      await app.predictionsDialog.expectRiskDisclaimer();

      await app.predictionsDialog.closeTerms();
      await app.mainNavigation.validateTargetFromMainNavigation("home");

      await app.mainNavigation.openDeeplink(predictionsDeeplink);
      await app.predictionsDialog.expectTermsNotAccepted();
      await app.predictionsDialog.acknowledgeTerms();
      await app.predictionsDialog.agreeAndContinue();
      await app.predictionsDialog.expectConsentNotAccepted();

      await app.predictionsDialog.closeConsent();
      await app.mainNavigation.validateTargetFromMainNavigation("home");

      await app.mainNavigation.openDeeplink(predictionsDeeplink);
      await app.predictionsDialog.expectConsentNotAccepted();
      await app.predictionsDialog.expectTermsHidden();
      await app.predictionsDialog.acceptConsent();
      await app.predictionsDialog.continueFromConsent();
      await app.predictionsDialog.expectAssetSelection();
    },
  );
});
