import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, pressUntilTextFound } from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";

function formatEventsForError(events: string[], maxLength = 1000): string {
  const formatted = events.map((e, i) => `  [${i}] ${e}`).join("\n");
  if (formatted.length <= maxLength) {
    return formatted;
  }
  return `${formatted.slice(0, maxLength)}...\n  (truncated, ${events.length} total events)`;
}

function validateTransactionData(tx: Transaction, events: string[]) {
  const formattedEvents = formatEventsForError(events);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  if (!isAmountCorrect) {
    throw new Error(
      `Expected amount "${tx.amount}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`,
    );
  }

  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    if (!isENSNameCorrect) {
      throw new Error(
        `Expected ENS name "${tx.accountToCredit.ensName}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`,
      );
    }
  } else {
    if (!tx.accountToCredit.address) {
      throw new Error("Recipient address is not set");
    }
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    if (!isAddressCorrect) {
      throw new Error(
        `Expected recipient address "${tx.accountToCredit.address}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`,
      );
    }
  }
}

async function sendEvmTouchDevices(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  validateTransactionData(tx, events);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

export const sendEvmButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      validateTransactionData(tx, events);
      await buttons.both();
    },
);

export const sendEvmNanoS = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
      validateTransactionData(tx, events);
      await buttons.both();
    },
);

export async function sendEVM(tx: Transaction) {
  const speculosModel = getSpeculosModel();

  if (isTouchDevice()) {
    return sendEvmTouchDevices(tx);
  }
  if (speculosModel === DeviceModelId.nanoS) {
    return sendEvmNanoS(tx);
  }
  return sendEvmButtonDevice(tx);
}
