import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { pressUntilTextFound } from "../speculos";

export async function sendHedera() {
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}
