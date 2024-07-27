import { expect } from "@playwright/test";
import path from "path";
import test from "../../fixtures/common";
import { Layout } from "../../component/layout.component";
import { SendModal } from "../../page/modal/send.modal";

test.use({
  userdata: "1AccountBTC1AccountETHStarred",
  simulateCamera: path.join(
    __dirname,
    "../../userdata/",
    "qrcode-19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77.y4m",
  ),
});

test("Send flow", async ({ page }) => {
  const layout = new Layout(page);
  const sendModal = new SendModal(page);

  await test.step("can open send modal and use a qr code from camera", async () => {
    await layout.openSendModal();
    await sendModal.container.waitFor({ state: "visible" });
    const sendButtonLoader = sendModal.container
      .locator("id=send-recipient-continue-button")
      .getByTestId("loading-spinner");
    await sendButtonLoader.waitFor({ state: "detached" });

    await sendModal.selectAccount("Bitcoin 1");
    await sendModal.clickOnCameraButton();

    await expect(sendModal.recipientInput).toHaveValue("19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77");
  });
});
