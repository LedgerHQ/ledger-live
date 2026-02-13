import { DeviceLabels } from "../enum/DeviceLabels";
import { pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export const sendHedera = withDeviceController(({ getButtonsController }) => async () => {
  const buttons = getButtonsController();

  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressUntilTextFound(DeviceLabels.CONFIRM);
    await buttons.both();
  }
});
