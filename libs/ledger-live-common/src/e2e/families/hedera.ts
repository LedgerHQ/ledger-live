import { DeviceLabels } from "../enum/DeviceLabels";
import { pressUntilTextFound } from "../speculos";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendHedera = withDeviceController(({ getButtonsController }) => async () => {
  const buttons = getButtonsController();

  await pressUntilTextFound(DeviceLabels.APPROVE);
  await buttons.both();
});
