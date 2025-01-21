import { pressBoth, pressUntilTextFound } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function sendAptos() {
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}
