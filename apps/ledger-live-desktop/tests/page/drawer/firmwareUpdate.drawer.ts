import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { deviceInfo155 as deviceInfo } from "@ledgerhq/live-common/apps/mock";

export class FirmwareUpdate extends Drawer {
  // The success-step CTA has no stable data-testid, and its label depends on whether the
  // mocked device has apps to reinstall: "Finish" (manager.modal.SuccessCTANoApps) when not,
  // "Restore apps" (manager.modal.sucessCTAApps) when it does (e.g. deviceInfo155).
  readonly finishButton = this.page.getByRole("button", { name: /^(Finish|Restore apps)$/ });
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
