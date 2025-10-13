import expect from "expect";
import { NFTTransaction, Transaction } from "../models/Transaction";
import { containsSubstringInEvent, waitFor, pressUntilTextFound } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function sendEVM(tx: Transaction) {
  let events;
  const speculosModel = getSpeculosModel();

  if (speculosModel === DeviceModelId.stax) {
    events = await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  } else if (speculosModel === DeviceModelId.nanoS) {
    events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  } else {
    events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  }

  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    expect(isENSNameCorrect).toBeTruthy();
  } else {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }

  if (speculosModel === DeviceModelId.stax) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function sendEvmNFT(tx: NFTTransaction) {
  await waitFor(DeviceLabels.REVIEW_OPERATION);
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
}
