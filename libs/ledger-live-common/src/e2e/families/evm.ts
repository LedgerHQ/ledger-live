import expect from "expect";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, pressUntilTextFound } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { isTouchDevice } from "../speculosAppVersion";

function validateTransactionData(tx: Transaction, events: string[]) {
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    expect(isENSNameCorrect).toBeTruthy();
  } else {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }
}

async function sendEvmTouchDevices(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  validateTransactionData(tx, events);
  await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
}

async function sendEvmButtonDevice(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  validateTransactionData(tx, events);
  await pressBoth();
}

async function sendEvmNanoS(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  validateTransactionData(tx, events);
  await pressBoth();
}

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
