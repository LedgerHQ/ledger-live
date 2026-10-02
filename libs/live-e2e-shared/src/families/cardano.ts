import { Transaction } from "../models/Transaction";
import {
  pressUntilTextFound,
  expectSpeculosEventsContain,
  waitFor,
  getSendEvents,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";

type ActionType = "both" | "right";

function validateTransactionData(tx: Transaction, events: string[]) {
  if (!tx.accountToCredit.address) {
    throw new Error("Recipient address is not set");
  }
  expectSpeculosEventsContain(tx.accountToCredit.address, events);
  expectSpeculosEventsContain(tx.amount, events);
}

async function sendCardanoTouchDevices(tx: Transaction) {
  const events = await getSendEvents(tx);
  validateTransactionData(tx, events);
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
      await waitFor(DeviceLabels.REVIEW_TRANSACTION);
      const events = await pressUntilTextFound(DeviceLabels.AMOUNT);
      validateTransactionData(tx, events);
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
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

async function delegateCardanoTouchDevices() {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

const NANO_S_DELEGATE_STEPS = [
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
] as const;

export const delegateNanoSAction = withDeviceController(
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

export const delegateCardanoButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      const buttons = getButtonsController();
      await waitFor(DeviceLabels.REVIEW_TRANSACTION);
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      await buttons.both();
    },
);

export async function delegateCardano() {
  const speculosModel = getSpeculosModel();

  if (isTouchDevice()) {
    return delegateCardanoTouchDevices();
  }

  if (speculosModel === DeviceModelId.nanoS) {
    for (const [label, action] of NANO_S_DELEGATE_STEPS) {
      await delegateNanoSAction(label, action);
    }
    return;
  }

  await delegateCardanoButtonDevice();
}
