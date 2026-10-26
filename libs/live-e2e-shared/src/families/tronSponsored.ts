import { DeviceModelId } from "@ledgerhq/devices";
import {
  SEND_REVIEW_TRANSACTION_MAX_ATTEMPTS,
  expectSpeculosEventsContainExactly,
  getDeviceLabels,
  pressUntilTextFound,
  waitFor,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { AppInfos } from "../enum/AppInfos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

// Models the catalog serves Tron app 0.8.0+. Nano S stops at 0.7.0.
const TRONIFY_SERVICE_PAGE_MODELS: ReadonlySet<DeviceModelId> = new Set([
  DeviceModelId.nanoX,
  DeviceModelId.nanoSP,
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.apex,
]);

/** Whether this run's device gets a Tron app that names a Tronify payee on the rent payment. */
export const deviceShowsTronifyService = (): boolean =>
  TRONIFY_SERVICE_PAGE_MODELS.has(getSpeculosModel());

/**
 * Signs TX-A, the USDT rent payment of a sponsored send. Tron app 0.8.0+ names a known Tronify payee
 * as a service on its own review page; a plain USDT send shows none.
 */
export const signTronRentPayment = withDeviceController(
  ({ getButtonsController }) =>
    async (amount: string, payee: string) => {
      const buttons = getButtonsController();
      const { sendVerifyLabel, sendConfirmLabel } = getDeviceLabels(AppInfos.TRON);

      await waitFor(sendVerifyLabel, SEND_REVIEW_TRANSACTION_MAX_ATTEMPTS);
      const events = await pressUntilTextFound(sendConfirmLabel);
      // Exact: the loose matcher would find a short amount's digits scattered across any review,
      // and the label or payee in any screen holding their letters in order.
      expectSpeculosEventsContainExactly(amount, events);
      expectSpeculosEventsContainExactly(DeviceLabels.ENERGY_RENTAL_TRONIFY, events);
      expectSpeculosEventsContainExactly(payee, events);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
