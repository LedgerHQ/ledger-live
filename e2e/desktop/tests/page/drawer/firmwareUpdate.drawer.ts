import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { deviceInfo155 as deviceInfo } from "@ledgerhq/live-common/apps/mock";

export class FirmwareUpdate extends Drawer {
  readonly downloadProgress = this.page.getByTestId("firmware-update-download-progress");
  readonly flashProgress = this.page.getByTestId("firmware-update-flash-mcu-progress");
  readonly updateDone = this.page.getByTestId("firmware-update-done");
  readonly drawerClose = this.page.getByTestId("drawer-close-button");
  readonly installUpdateButton = this.page.getByRole("button", { name: "Install update" });

  @step("Install update")
  async installUpdate() {
    await this.installUpdateButton.click();
  }

  @step("Wait for device info")
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
