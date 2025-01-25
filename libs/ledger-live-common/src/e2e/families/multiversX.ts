import { pressBoth, pressUntilTextFound, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateMultiversX() {
  await waitFor(DeviceLabels.RECEIVER);
  await pressUntilTextFound(DeviceLabels.SIGN);
  await pressBoth();
}
