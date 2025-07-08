import expect from "expect";
import { Transaction } from "../models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
  waitFor,
  pressRightButton,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";

export async function sendCardano(tx: Transaction) {
  const isNanoS = process.env.SPECULOS_DEVICE === Device.LNS;
  await waitFor(DeviceLabels.NEW_ORDINARY);
  await (isNanoS ? pressRightButton() : pressBoth());
  if (isNanoS) {
    await waitFor(DeviceLabels.SEND_TO_ADDRESS);
    await pressBoth();
  } else {
    await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2);
    await pressBoth();
  }
  const events = await pressUntilTextFound(DeviceLabels.SEND);
  if (!isNanoS) {
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
  }
  await pressBoth();
  await waitFor(DeviceLabels.TRANSACTION_FEE);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  if (isNanoS) {
    await pressRightButton();
  } else {
    await pressBoth();
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }
}

export async function delegateCardano() {
  const commonSteps = [
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
  ] as const;

  const LNSSpecificSteps = [
    [DeviceLabels.NEW_ORDINARY, "right"],
    [DeviceLabels.TRANSACTION_FEE, "both"],
    [DeviceLabels.REGISTER, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.DELEGATE_STAKE, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.CONFIRM, "right"],
  ] as const;

  const steps = process.env.SPECULOS_DEVICE === Device.LNS ? LNSSpecificSteps : commonSteps;

  for (const [label, action] of steps) {
    try {
      await waitFor(label);
      action === "both" ? await pressBoth() : await pressRightButton();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error while waiting for "${label}":`, message);
      break;
    }
  }
}
