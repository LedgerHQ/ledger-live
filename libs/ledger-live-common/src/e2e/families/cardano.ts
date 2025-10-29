import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import {
  pressAndRelease,
  longPressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";

type ActionType = "both" | "right" | "tap" | "swipe" | "confirm" | "hold";

function validateTransactionData(tx: Transaction, events: string[]) {
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
}

async function sendCardanoTouchDevices(tx: Transaction) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events = await pressUntilTextFound(DeviceLabels.TO);
  validateTransactionData(tx, events);
  await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
  await waitFor(DeviceLabels.FEES);
  await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
  await waitFor(DeviceLabels.SIGN_TRANSACTION);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

export const sendCardanoNanoS = withDeviceController(
  ({ getButtonsController }) =>
    async (_tx: Transaction) => {
      const buttons = getButtonsController();
      await waitFor(DeviceLabels.NEW_ORDINARY);
      await buttons.right();
      await waitFor(DeviceLabels.SEND_TO_ADDRESS);
      await buttons.both();
      await pressUntilTextFound(DeviceLabels.SEND);
      await buttons.both();
      await waitFor(DeviceLabels.TRANSACTION_FEE);
      await buttons.both();
      await waitFor(DeviceLabels.CONFIRM);
      await buttons.right();
    },
);

export const sendCardanoButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();
      await waitFor(DeviceLabels.NEW_ORDINARY);
      await buttons.both();
      await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2);
      await buttons.both();
      const events = await pressUntilTextFound(DeviceLabels.SEND);
      validateTransactionData(tx, events);
      await buttons.both();
      await waitFor(DeviceLabels.TRANSACTION_FEE);
      await buttons.both();
      await waitFor(DeviceLabels.CONFIRM);
      await buttons.both();
    },
);

export async function sendCardano(tx: Transaction) {
  const speculosModel = getSpeculosModel();
  if (isTouchDevice()) {
    return sendCardanoTouchDevices(tx);
  }
  if (speculosModel === DeviceModelId.nanoS) {
    return sendCardanoNanoS(tx);
  }
  return sendCardanoButtonDevice(tx);
}

const DELEGATE_STEPS_CONFIG = {
  [DeviceModelId.stax || DeviceModelId.europa || DeviceModelId.apex]: [
    [DeviceLabels.REVIEW_TRANSACTION, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.REGISTER, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels.DELEGATE_STAKE, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels.HOLD_TO_SIGN, "hold"],
  ] as const,
  [DeviceModelId.nanoS]: [
    [DeviceLabels.NEW_ORDINARY, "right"],
    [DeviceLabels.TRANSACTION_FEE, "both"],
    [DeviceLabels.REGISTER, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.DEPOSIT, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.DELEGATE_STAKE, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.CONFIRM, "right"],
  ] as const,
  default: [
    [DeviceLabels.NEW_ORDINARY, "both"],
    [DeviceLabels.TRANSACTION_FEE, "both"],
    [DeviceLabels.REGISTER, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.DEPOSIT, "both"],
    [DeviceLabels.CONFIRM, "both"],
    [DeviceLabels.DELEGATE_STAKE, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.CONFIRM, "both"],
    [DeviceLabels.CONFIRM, "both"],
  ] as const,
};

async function delegateTouchDevicesAction(label: DeviceLabels) {
  const CONFIRM_BUTTON_COORDS = { x: 139, y: 532 };
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

export const delegateNanoAction = withDeviceController(
  ({ getButtonsController }) =>
    async (label: DeviceLabels, action: ActionType) => {
      const buttons = getButtonsController();
      await waitFor(label);
      if (action === "both") {
        await buttons.both();
      } else {
        await buttons.right();
      }
    },
);

async function executeDelegateStep(label: DeviceLabels, action: ActionType) {
  try {
    if (isTouchDevice()) {
      await delegateTouchDevicesAction(label);
    } else {
      await delegateNanoAction(label, action);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error while waiting for "${label}":`, message);
    throw error;
  }
}

export async function delegateCardano() {
  const speculosModel = getSpeculosModel();
  const steps = isTouchDevice()
    ? DELEGATE_STEPS_CONFIG[speculosModel]
    : speculosModel === DeviceModelId.nanoS
      ? DELEGATE_STEPS_CONFIG[DeviceModelId.nanoS]
      : DELEGATE_STEPS_CONFIG.default;

  for (const [label, action] of steps) {
    await executeDelegateStep(label, action);
  }
}
