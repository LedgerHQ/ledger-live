import test from "../../fixtures/common";
import { ManagerPage } from "../../page/manager.page";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../component/layout.component";
import { CustomImageDrawer } from "../../page/drawer/custom.image.drawer";
import { DeviceModelId } from "@ledgerhq/devices";

test.use({
  userdata: "2_accounts_eth_with_tokens_and_nft",
});

test("Custom image (with populated NFT gallery)", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const deviceAction = new DeviceAction(page);
  const customImageDrawer = new CustomImageDrawer(page);
  const layout = new Layout(page);

  const container = customImageDrawer.container;

  await test.step("Access manager", async () => {
    await layout.goToManager();
    await deviceAction.accessManager("", "", DeviceModelId.stax);
    await managerPage.customImageButton.waitFor({ state: "visible" });
  });

  await test.step("Open custom image drawer", async () => {
    await managerPage.openCustomImage();
    await container.waitFor({ state: "attached" });
  });

  /**
   * We cannot go further in the flow until we have proper mocks for NFT
   * metadata.
   */
});
