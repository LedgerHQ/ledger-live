import { Transaction } from "../models/Transaction";
import {
  expectSpeculosEventsContain,
  fetchCurrentScreenTexts,
  waitForReviewTransaction,
  pressUntilTextFound,
  waitFor,
  SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import {
  longPressAndRelease,
  pressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { Currency } from "../enum/Currency";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { getEnv } from "@shared/env";
import { getDeviceCoordinates } from "../deviceCoordinates";

// TODO: remove once LIVE-28070 is fixed
function shouldSkipRecipientDisplayValidation(tx: Transaction): boolean {
  return (
    tx.accountToCredit.currency.id === Currency.POL.id ||
    tx.accountToCredit.currency.id === Currency.BASE.id
  );
}

function validateTransactionData(tx: Transaction, events: string[]) {
  expectSpeculosEventsContain(
    tx.amount,
    events,
    "Expected amount to be displayed on Speculos device",
  );

  if (shouldSkipRecipientDisplayValidation(tx)) {
    return;
  }

  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    expectSpeculosEventsContain(
      tx.accountToCredit.ensName,
      events,
      "Expected ENS name to be displayed on Speculos device",
    );
  } else {
    if (!tx.accountToCredit.address) {
      throw new Error("Recipient address is not set");
    }
    expectSpeculosEventsContain(
      tx.accountToCredit.address,
      events,
      "Expected recipient address to be displayed on Speculos device",
    );
  }
}

async function sendEvmTouchDevices(tx: Transaction) {
  await waitForReviewTransaction();

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

export async function approveTokenTouchDevices() {
  await waitForReviewTransaction(SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS, { matchFullEvents: true });
  await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

export const approveTokenButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      await waitFor(DeviceLabels.REVIEW_TRANSACTION_TO, SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS, {
        matchFullEvents: true,
      });
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      await getButtonsController().both();
    },
);

export async function approveToken() {
  if (isTouchDevice()) {
    return approveTokenTouchDevices();
  }
  return approveTokenButtonDevice();
}

export async function signTypedMessageTouchDevices() {
  await waitFor(DeviceLabels.REVIEW_TYPED_MESSAGE);
  await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

export const signTypedMessageButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      await waitFor(DeviceLabels.REVIEW_TYPED_MESSAGE);
      await pressUntilTextFound(DeviceLabels.SIGN_TYPED_MESSAGE);
      await getButtonsController().both();
    },
);

export async function signTypedMessage() {
  if (isTouchDevice()) {
    return signTypedMessageTouchDevices();
  }
  return signTypedMessageButtonDevice();
}
