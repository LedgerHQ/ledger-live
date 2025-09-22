import expect from "expect";
import { NFTTransaction, Transaction } from "../models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
  waitFor,
  getSpeculosModel,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function sendEVM(tx: Transaction) {
  const events =
    getSpeculosModel() !== DeviceModelId.nanoS
      ? await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION)
      : await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    expect(isENSNameCorrect).toBeTruthy();
  } else {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }

  await pressBoth();
}

export async function sendEvmNFT(tx: NFTTransaction) {
  await waitFor(DeviceLabels.REVIEW_OPERATION);
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
}
