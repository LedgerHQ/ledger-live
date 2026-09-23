import { Transaction } from "../models/Transaction";
import { pressUntilTextFound, expectSpeculosEventsContain, waitFor } from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import {
  pressAndRelease,
  longPressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";

type ActionType = "tap" | "swipe" | "confirm" | "hold";

function validateTransactionData(tx: Transaction, events: string[]) {
  if (!tx.accountToCredit.address) {
    throw new Error("Recipient address is not set");
  }
  expectSpeculosEventsContain(tx.accountToCredit.address, events);
  expectSpeculosEventsContain(tx.amount, events);
}

async function sendCardanoTouchDevices(tx: Transaction) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events = await pressUntilTextFound(DeviceLabels.AMOUNT);
  validateTransactionData(tx, events);
  await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
  await waitFor(DeviceLabels.FEES);
  await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
  await waitFor(DeviceLabels.SIGN_TRANSACTION);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

export const sendCardanoButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();
      const events = await pressUntilTextFound(DeviceLabels.AMOUNT);
      validateTransactionData(tx, events);
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      await buttons.both();
    },
);

export async function sendCardano(tx: Transaction) {
  if (isTouchDevice()) {
    return sendCardanoTouchDevices(tx);
  }
  return sendCardanoButtonDevice(tx);
}

const TOUCH_DELEGATE_STEPS = [
  [DeviceLabels.REVIEW_TRANSACTION, "swipe"],
  [DeviceLabels.TAP_TO_CONTINUE, "tap"],
  [DeviceLabels.REGISTER, "swipe"],
  [DeviceLabels.TAP_TO_CONTINUE, "tap"],
  [DeviceLabels.CONFIRM, "confirm"],
  [DeviceLabels.DELEGATE_STAKE, "swipe"],
  [DeviceLabels.TAP_TO_CONTINUE, "tap"],
  [DeviceLabels.CONFIRM, "confirm"],
  [DeviceLabels.HOLD_TO_SIGN, "hold"],
] as const;

function getConfirmButtonCoords(): { x: number; y: number } {
  const speculosModel = getSpeculosModel();

  switch (speculosModel) {
    case DeviceModelId.stax:
      return { x: 152, y: 532 };
    case DeviceModelId.apex:
      return { x: 114, y: 305 };
    case DeviceModelId.europa:
    default:
      return { x: 186, y: 446 };
  }
}

async function delegateTouchDevicesAction(label: DeviceLabels) {
  const CONFIRM_BUTTON_COORDS = getConfirmButtonCoords();
  await waitFor(label);
  switch (label) {
    case DeviceLabels.TAP_TO_CONTINUE:
      await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
      break;
    case DeviceLabels.CONFIRM:
      await pressAndRelease(DeviceLabels.CONFIRM, CONFIRM_BUTTON_COORDS.x, CONFIRM_BUTTON_COORDS.y);
      break;
    case DeviceLabels.HOLD_TO_SIGN:
      await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      break;
    default:
      await swipeRight();
      break;
  }
}

async function executeDelegateStep(label: DeviceLabels, action: ActionType) {
  try {
    await delegateTouchDevicesAction(label);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error while waiting for "${label}" (${action}):`, message);
    throw error;
  }
}

export const delegateCardanoButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      const buttons = getButtonsController();
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      await buttons.both();
    },
);

export async function delegateCardano() {
  if (isTouchDevice()) {
    for (const [label, action] of TOUCH_DELEGATE_STEPS) {
      await executeDelegateStep(label, action);
    }
    return;
  }
  await delegateCardanoButtonDevice();
}
