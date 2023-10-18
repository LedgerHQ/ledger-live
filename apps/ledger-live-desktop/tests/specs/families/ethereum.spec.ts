import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { Layout } from "../../models/Layout";
import { SendModal } from "../../models/SendModal";

test.use({ userdata: "1AccountBTC1AccountETHStarred" });

test("Send flow", async ({ page }) => {
  const layout = new Layout(page);
  const sendModal = new SendModal(page);

  await test.step("can open send modal and max network fees label is shown", async () => {
    await layout.openSendModal();
    await sendModal.container.waitFor({ state: "visible" });
    const sendButtonLoader = sendModal.container
      .locator("id=send-recipient-continue-button")
      .locator("data-test-id=loading-spinner");
    await sendButtonLoader.waitFor({ state: "detached" });

    await sendModal.selectAccount("Ethereum 1");
    await sendModal.fillRecipient("randomvalidvalue");
    await page.getByRole("button", { name: "Continue" }).click();

    const sendFeeMode = sendModal.container.locator("data-test-id=send-fee-mode");
    await sendFeeMode.waitFor({ state: "visible" });

    await expect.soft(sendModal.container).toHaveScreenshot("send-modal-eth-max-network-fees.png");
    expect(await sendModal.container.getByText("Max Network fees").isVisible()).toBeTruthy();
  });
});
