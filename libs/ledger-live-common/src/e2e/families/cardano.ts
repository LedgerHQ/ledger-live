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
  await waitFor(DeviceLabels.CONFIRM_TRANSACTION);
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
    { label: DeviceLabels.NEW_ORDINARY, action: "both" },
    { label: DeviceLabels.TRANSACTION_FEE, action: "both" },
    { label: DeviceLabels.REGISTER, action: "both" },
    { label: DeviceLabels.STAKE_KEY, action: "both" },
    { label: DeviceLabels.CONFIRM, action: "both" },
    { label: DeviceLabels.DELEGATE_STAKE, action: "both" },
    { label: DeviceLabels.STAKE_KEY, action: "both" },
    { label: DeviceLabels.CONFIRM, action: "both" },
    { label: DeviceLabels.CONFIRM, action: "both" },
  ];

  const LNSSpecificSteps = [
    { label: DeviceLabels.NEW_ORDINARY, action: "right" },
    { label: DeviceLabels.TRANSACTION_FEE, action: "both" },
    { label: DeviceLabels.REGISTER, action: "both" },
    { label: DeviceLabels.STAKE_KEY, action: "both" },
    { label: DeviceLabels.CONFIRM, action: "right" },
    { label: DeviceLabels.DELEGATE_STAKE, action: "both" },
    { label: DeviceLabels.STAKE_KEY, action: "both" },
    { label: DeviceLabels.CONFIRM, action: "right" },
    { label: DeviceLabels.CONFIRM, action: "right" },
  ];

  const stepsToExecute =
    process.env.SPECULOS_DEVICE === Device.LNS ? LNSSpecificSteps : commonSteps;

  for (const step of stepsToExecute) {
    await waitFor(step.label);
    if (step.action === "both") {
      await pressBoth();
    } else if (step.action === "right") {
      await pressRightButton();
    }
  }
}
