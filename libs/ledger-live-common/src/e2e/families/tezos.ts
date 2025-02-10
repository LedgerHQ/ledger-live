import { pressBoth, pressUntilTextFound, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateTezos() {
  await waitFor(DeviceLabels.REVIEW_OPERATION);
  await pressUntilTextFound(DeviceLabels.ACCEPT);
  await pressBoth();
}
