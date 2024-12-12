import { pressBoth, pressUntilTextFound } from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";

export async function sendAptos() {
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}
