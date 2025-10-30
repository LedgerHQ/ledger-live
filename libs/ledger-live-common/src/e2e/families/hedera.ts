import { DeviceLabels } from "../enum/DeviceLabels";
import { pressUntilTextFound } from "../speculos";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendHedera = withDeviceController(({ getDevice }) => async () => {
  const buttons = getDevice().buttonFactory();

  await pressUntilTextFound(DeviceLabels.APPROVE);
  await buttons.both();
});
