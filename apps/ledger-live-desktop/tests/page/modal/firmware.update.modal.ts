import { deviceInfo155 as deviceInfo } from "@ledgerhq/live-common/apps/mock";
import { Modal } from "../../component/modal.component";

export class FirmwareUpdateModal extends Modal {
  readonly downloadProgress = this.page.getByTestId("firmware-update-download-progress");
  readonly flashProgress = this.page.getByTestId("firmware-update-flash-mcu-progress");
  readonly updateDone = this.page.getByTestId("firmware-update-done");
  readonly drawerClose = this.page.getByTestId("drawer-close-button");

  async waitForDeviceInfo() {
    await this.page.evaluate(
      args => {
        const [deviceInfo] = args;

        window.mock.events.mockDeviceEvent(
          {
            ...deviceInfo,
          },
          { type: "complete" },
        );
      },
      [deviceInfo],
    );
  }
}
