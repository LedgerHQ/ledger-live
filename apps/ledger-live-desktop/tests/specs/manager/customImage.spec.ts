import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../models/ManagerPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { CustomImageDrawer } from "../../models/CustomImageDrawer";
import { DeviceModelId } from "@ledgerhq/devices";

test.use({ userdata: "skip-onboarding", featureFlags: { customImage: { enabled: true } } });

test("Custom image", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const deviceAction = new DeviceAction(page);
  const customImageDrawer = new CustomImageDrawer(page);
  const layout = new Layout(page);

  const container = customImageDrawer.container;

  await test.step("Access manager", async () => {
    await layout.goToManager();
    await deviceAction.accessManager("", "", DeviceModelId.nanoFTS);
    await managerPage.customImageButton.waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("custom-image-manager-button.png");
  });

  await test.step("Open custom image drawer", async () => {
    await managerPage.openCustomImage();
    await container.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot("custom-image-drawer.png");
  });

  await test.step("Import image", async () => {
    await customImageDrawer.importImage("tests/specs/manager/sample-custom-image.webp");
    await customImageDrawer.importImageInput.waitFor({ state: "detached" });
    await expect(container).toHaveScreenshot("custom-image-image-imported.png");
  });

  await test.step("Adjust image", async () => {
    await customImageDrawer.waitForCropConfirmable();
    await expect(container).toHaveScreenshot("custom-image-adjust-0.png");

    /** zoom in */
    await customImageDrawer.cropZoomInABit();
    await expect(container).toHaveScreenshot("custom-image-adjust-1-zoomed.png");

    /** confirm */
    await customImageDrawer.confirmCrop();
    await expect(container).toHaveScreenshot("custom-image-adjust-2-contrast-zoomed.png");

    /** go back to cropping -> the cropping state should not be reinitialized */
    await customImageDrawer.contrastPrevious();
    await expect(container).toHaveScreenshot("custom-image-adjust-3.png");

    /** rotate */
    customImageDrawer.rotate();
    await expect(container).toHaveScreenshot("custom-image-adjust-4-rotate-once.png");

    /** confirm */
    await customImageDrawer.confirmCrop();
    await expect(container).toHaveScreenshot("custom-image-adjust-5-rotated-zoomed.png");

    /** go back to cropping */
    await customImageDrawer.contrastPrevious();

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
    await expect(container).toHaveScreenshot("custom-image-adjust-6-max-zoom.png");

    await customImageDrawer.cropZoomOutABit();
    await expect(container).toHaveScreenshot("custom-image-adjust-7-big-zoom.png");

    /**
     * Min zoom
     * Doing it twice as we had an issue where this caused the loading state to be stuck
     **/
    await customImageDrawer.cropZoomOutMax();
    await customImageDrawer.cropZoomOutMax();
    await expect(container).toHaveScreenshot("custom-image-adjust-8-min-zoom.png");

    await customImageDrawer.cropZoomInABit();
    await expect(container).toHaveScreenshot("custom-image-adjust-9-small-zoom.png");

    await customImageDrawer.confirmCrop();
  });

  await test.step("Choose contrast", async () => {
    await customImageDrawer.contrastContinueButton.waitFor({ state: "attached" });
    await expect(container).toHaveScreenshot("custom-image-preview-contrast-initial.png");
    await customImageDrawer.chooseContrast(1);
    await expect(container).toHaveScreenshot("custom-image-preview-contrast-1.png");
    await customImageDrawer.chooseContrast(2);
    await expect(container).toHaveScreenshot("custom-image-preview-contrast-2.png");
    await customImageDrawer.chooseContrast(3);
    await expect(container).toHaveScreenshot("custom-image-preview-contrast-3.png");
    await customImageDrawer.chooseContrast(0);
    await expect(container).toHaveScreenshot("custom-image-preview-contrast-0.png");
    await customImageDrawer.confirmContrast();
  });

  await test.step("Transfer image", async () => {
    await customImageDrawer.contrastContinueButton.waitFor({ state: "detached" });
    await expect(container).toHaveScreenshot("custom-image-transfer.png");
  });
});
