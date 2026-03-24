import { Transaction } from "../models/Transaction";
import {
  containsSubstringInEvent,
  fetchCurrentScreenTexts,
  pressUntilTextFound,
  waitFor,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import {
  longPressAndRelease,
  pressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { getEnv } from "@ledgerhq/live-env";
import { getDeviceCoordinates } from "../deviceCoordinates";

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
  await waitFor(DeviceLabels.YES_ENABLE);
  await pressAndRelease(DeviceLabels.YES_ENABLE);
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);

  const events: string[] = [];
  if (tx.accountToCredit.ensName) {
    const ensEvents = await getEnsScreenTexts(tx.accountToCredit.ensName);
    events.push(...ensEvents);
  }
  events.push(...(await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN)));
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

async function getEnsScreenTexts(ensName: string): Promise<string[]> {
  const events: string[] = [];
  await swipeRight();
  await waitFor(ensName);
  events.push(...(await pressUntilTextFound(ensName)));
  const { x: ensX, y: ensY } = getDeviceCoordinates("ensArrowOpen");
  await pressAndRelease(">", ensX, ensY);
  const ensScreenTexts = await fetchCurrentScreenTexts(getEnv("SPECULOS_API_PORT"));
  events.push(...ensScreenTexts);
  const { x: backX, y: backY } = getDeviceCoordinates("arrowBack");
  await pressAndRelease("<", backX, backY);
  return events;
}
