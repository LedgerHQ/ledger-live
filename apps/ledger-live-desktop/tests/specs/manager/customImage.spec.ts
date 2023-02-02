import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../models/ManagerPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { CustomImageDrawer } from "../../models/CustomImageDrawer";
import { DeviceModelId } from "@ledgerhq/devices";
import { padStart } from "lodash";

test.use({ userdata: "skip-onboarding", featureFlags: { customImage: { enabled: true } } });

test("Custom image", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const deviceAction = new DeviceAction(page);
  const customImageDrawer = new CustomImageDrawer(page);
  const layout = new Layout(page);

  const container = customImageDrawer.container;

  let screenshotIndex = 0;

  /**
   * Allows to easily navigate between screenshots in their order of execution.
   * Yes if we remove/add screenshots it will shift everything but that should
   * happened rarely, and even then it will be more convenient to check that the
   * screenshots are correct by examining them in order.
   * */
  function generateScreenshotPrefix() {
    const prefix = `custom-image-${padStart(screenshotIndex.toString(), 3, "0")}-`;
    screenshotIndex += 1;
    return prefix;
  }

  await test.step("Access manager", async () => {
    await layout.goToManager();
    await deviceAction.accessManager("", "", DeviceModelId.stax);
    await managerPage.customImageButton.waitFor({ state: "visible" });
  });

  await test.step("Open custom image drawer", async () => {
    await managerPage.openCustomImage();
    await container.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}drawer.png`);
  });

  await test.step("Import image", async () => {
    await customImageDrawer.importImage("tests/specs/manager/sample-custom-image.webp");
    await customImageDrawer.importImageInput.waitFor({ state: "detached" });
    await customImageDrawer.waitForCropConfirmable();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}image-imported.png`);
  });

  await test.step("Adjust image", async () => {
    await customImageDrawer.waitForCropConfirmable();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust.png`);

    /** zoom in */
    await customImageDrawer.cropZoomInABit();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-zoomed.png`);

    /** confirm */
    await customImageDrawer.confirmCrop();
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}adjust-contrast-zoomed.png`,
    );

    /** go back to cropping -> the cropping state should not be reinitialized */
    await customImageDrawer.contrastPrevious();
    await customImageDrawer.waitForCropConfirmable();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust.png`);

    /** rotate */
    await customImageDrawer.rotate();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-rotate-once.png`);

    /** confirm */
    await customImageDrawer.confirmCrop();
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}adjust-rotated-zoomed.png`,
    );

    /** go back to cropping */
    await customImageDrawer.contrastPrevious();
    await customImageDrawer.waitForCropConfirmable();
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}adjust-rotated-zoomed-preserved.png`,
    );

    /** rotate back to 0° */
    await customImageDrawer.rotate();
    await customImageDrawer.rotate();
    await customImageDrawer.rotate();

    /**
     * Max zoom.
     * Doing it twice as we had an issue where this caused the loading state to be stuck
     **/
    await customImageDrawer.cropZoomInMax();
    await customImageDrawer.cropZoomInMax();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-max-zoom.png`);

    await customImageDrawer.cropZoomOutABit();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-big-zoom.png`);

    /**
     * Min zoom
     * Doing it twice as we had an issue where this caused the loading state to be stuck
     **/
    await customImageDrawer.cropZoomOutMax();
    await customImageDrawer.cropZoomOutMax();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-min-zoom.png`);

    await customImageDrawer.cropZoomInABit();
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}adjust-small-zoom.png`);

    await customImageDrawer.confirmCrop();
  });

  await test.step("Choose contrast", async () => {
    await customImageDrawer.contrastContinueButton.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}preview-contrast-initial.png`,
    );
    await customImageDrawer.chooseContrast(1);
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}preview-contrast-1.png`);
    await customImageDrawer.chooseContrast(2);
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}preview-contrast-2.png`);
    await customImageDrawer.chooseContrast(3);
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}preview-contrast-3.png`);
    await customImageDrawer.chooseContrast(0);
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}preview-contrast-0.png`);
    await customImageDrawer.confirmContrast();
  });

  await test.step("Transfer image", async () => {
    await customImageDrawer.contrastContinueButton.waitFor({ state: "detached" });

    await deviceAction.requestImageLoad();
    await customImageDrawer.deviceActionImageLoadRequested.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-load-requested.png`,
    );

    await deviceAction.loadImageWithProgress(0);
    await customImageDrawer.deviceActionImageLoading(0).waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-progress-000.png`,
    );

    await deviceAction.loadImageWithProgress(0.2);
    await customImageDrawer.deviceActionImageLoading(0.2).waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-progress-020.png`,
    );

    await deviceAction.loadImageWithProgress(0.5);
    await customImageDrawer.deviceActionImageLoading(0.5).waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-progress-050.png`,
    );

    await deviceAction.loadImageWithProgress(0.8);
    await customImageDrawer.deviceActionImageLoading(0.8).waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-progress-080.png`,
    );

    await deviceAction.loadImageWithProgress(1);
    await customImageDrawer.deviceActionImageLoading(1).waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-progress-100.png`,
    );

    await deviceAction.requestImageCommit();
    await customImageDrawer.deviceActionImageCommitRequested.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}transfer-commit-requested.png`,
    );

    await deviceAction.confirmImageLoaded();
    await customImageDrawer.finishButton.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot(`${generateScreenshotPrefix()}transfer-loaded.png`);

    await customImageDrawer.clickFinish();
  });
});
