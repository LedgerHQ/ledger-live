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

    const evmGasOptionsLoader = sendModal.container
      .locator("id=evm-fee-strategy-gas-options-spinner")
      .locator("data-test-id=loading-spinner");
    await evmGasOptionsLoader.waitFor({ state: "detached" });

    await expect.soft(sendModal.container).toHaveScreenshot("send-modal-eth-max-network-fees.png");
    expect(sendModal.container.getByText("Max Network fees").isVisible()).toBeTruthy();
    await sendModal.back();
    await sendModal.selectAccount("Bitcoin 1 (legacy)");
    await sendModal.fillRecipient("randomvalidvalue2");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect
      .soft(sendModal.container)
      .toHaveScreenshot("send-modal-eth-max-network-fees-2.png");
    expect(sendModal.container.getByText("Max Network fees").isVisible()).toBeFalsy;
  });
});
