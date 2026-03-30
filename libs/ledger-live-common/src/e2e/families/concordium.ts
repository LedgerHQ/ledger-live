import { DeviceLabels } from "../enum/DeviceLabels";
import { pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export const sendConcordium = withDeviceController(({ getButtonsController }) => async () => {
  const buttons = getButtonsController();

  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
    await longPressAndRelease(DeviceLabels.SIGN_TRANSACTION, 3);
  } else {
    // Concordium screen flow: Transaction Type → Amount → Fee → Destination → Account → Accept → Sign transaction
    await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
    await buttons.both();
  }
});
