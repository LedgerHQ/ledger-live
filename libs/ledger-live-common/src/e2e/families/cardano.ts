import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth, pressRightButton } from "../deviceInteraction/ButtonDeviceSimulator";
import {
  pressAndRelease,
  longPressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { isTouchDevice } from "../speculosAppVersion";

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

async function sendCardanoNanoS(_tx: Transaction) {
  await waitFor(DeviceLabels.NEW_ORDINARY);
  await pressRightButton();
  await waitFor(DeviceLabels.SEND_TO_ADDRESS);
  await pressBoth();
  await pressUntilTextFound(DeviceLabels.SEND);
  await pressBoth();
  await waitFor(DeviceLabels.TRANSACTION_FEE);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressRightButton();
}

async function sendCardanoButtonDevice(tx: Transaction) {
  await waitFor(DeviceLabels.NEW_ORDINARY);
  await pressBoth();
  await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2);
  await pressBoth();
  const events = await pressUntilTextFound(DeviceLabels.SEND);
  validateTransactionData(tx, events);
  await pressBoth();
  await waitFor(DeviceLabels.TRANSACTION_FEE);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressBoth();
}

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
  [DeviceModelId.stax || DeviceModelId.europa]: [
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

async function delegateNanoAction(label: DeviceLabels, action: ActionType) {
  await waitFor(label);
  if (action === "both") {
    await pressBoth();
  } else {
    await pressRightButton();
  }
}

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
  const steps =
    speculosModel === DeviceModelId.stax || speculosModel === DeviceModelId.europa
      ? DELEGATE_STEPS_CONFIG[speculosModel]
      : speculosModel === DeviceModelId.nanoS
        ? DELEGATE_STEPS_CONFIG[DeviceModelId.nanoS]
        : DELEGATE_STEPS_CONFIG.default;

  for (const [label, action] of steps) {
    await executeDelegateStep(label, action);
  }
}
