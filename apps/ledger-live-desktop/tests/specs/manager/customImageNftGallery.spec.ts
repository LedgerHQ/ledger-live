import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../models/ManagerPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { CustomImageDrawer } from "../../models/CustomImageDrawer";
import { DeviceModelId } from "@ledgerhq/devices";
import { padStart } from "lodash";

test.use({
  userdata: "2_accounts_eth_with_tokens_and_nft",
  featureFlags: { customImage: { enabled: true } },
});

test("Custom image (with populated NFT gallery)", async ({ page }) => {
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
  });

  await test.step("Import NFT", async () => {
    await customImageDrawer.openNftGallery();
    await customImageDrawer.importNftPreviousButton.waitFor({ state: "visible" });
    await expect(container).toHaveScreenshot(
      `${generateScreenshotPrefix()}nft-gallery-populated.png`,
      {
        mask: Array(4)
          .fill(undefined)
          .flatMap((_, index) => [
            customImageDrawer.nftCardMedia(index),
            customImageDrawer.nftCardName(index),
            customImageDrawer.nftCardId(index),
          ]),
      },
    );
  });
  /**
   * We cannot go further in the flow until we have proper mocks for NFT
   * metadata.
   */
});
