import { Transaction } from "../models/Transaction";
import {
  expectSpeculosEventsContain,
  expectSpeculosEventsContainExactly,
  fetchCurrentScreenTexts,
  waitForReviewTransaction,
  pressUntilTextFound,
  waitFor,
  waitUntilScreenLeavesIdle,
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
import { TokenAccount } from "../enum/Account";
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

  if (tx.accountToDebit instanceof TokenAccount) {
    // The ticker, not the currency name: the ERC-20 descriptor sent to the device carries no
    // name — it is { contractAddress, ticker, decimals, chainId, signature } (see hw-app-eth
    // services/ledger/erc20.ts, provided via provideERC20TokenInformation) — so the ticker is
    // the only token identity the device can render.
    expectSpeculosEventsContainExactly(
      tx.accountToDebit.currency.ticker,
      events,
      "Expected the token ticker to be displayed on Speculos device",
    );
  }

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

/**
 * The nanos app (1.16.2) has no "Review transaction to" title. A blind-signed approve opens on a
 * "Blind signing" warning and ends on "Accept risk and send"; one its ERC-20 plugin describes ends
 * on "Accept and send".
 */
export const approveTokenNanoS = withDeviceController(({ getButtonsController }) => async () => {
  await waitUntilScreenLeavesIdle(SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS);
  await pressUntilTextFound(DeviceLabels.ACCEPT);
  await getButtonsController().both();
});

export async function approveToken() {
  if (isTouchDevice()) {
    return approveTokenTouchDevices();
  }
  if (getSpeculosModel() === DeviceModelId.nanoS) {
    return approveTokenNanoS();
  }
  return approveTokenButtonDevice();
}

/**
 * Walks an arbitrary contract-call review to the signature.
 *
 * Waits on the bare "Review transaction", which a blind-signed review is titled with and which
 * is a prefix of the clear-signed "Review transaction to".
 */
export const approveContractTransactionButtonDevice = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      await waitFor(DeviceLabels.REVIEW_TRANSACTION, SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS, {
        matchFullEvents: true,
      });
      await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
      await getButtonsController().both();
    },
);

export async function approveContractTransaction() {
  if (isTouchDevice()) {
    return approveTokenTouchDevices();
  }
  return approveContractTransactionButtonDevice();
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

/**
 * The nanos app (1.16.2) shows typed data as domain and message hashes only, behind a "Blind
 * signing" warning, and ends on "Accept risk and sign".
 */
export const signTypedMessageNanoS = withDeviceController(
  ({ getButtonsController }) =>
    async () => {
      await waitUntilScreenLeavesIdle();
      await pressUntilTextFound(DeviceLabels.ACCEPT_RISK);
      await getButtonsController().both();
    },
);

export async function signTypedMessage() {
  if (isTouchDevice()) {
    return signTypedMessageTouchDevices();
  }
  if (getSpeculosModel() === DeviceModelId.nanoS) {
    return signTypedMessageNanoS();
  }
  return signTypedMessageButtonDevice();
}
