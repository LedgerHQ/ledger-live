import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth, pressRightButton } from "../deviceInteraction/ButtonDeviceSimulator";
import {
  pressAndRelease,
  longPressAndRelease,
  swipeRight,
} from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function sendCardano(tx: Transaction) {
  const speculosModel = getSpeculosModel();
  let events;
  if (speculosModel === DeviceModelId.stax) {
    await waitFor(DeviceLabels.REVIEW_TRANSACTION);
    events = await pressUntilTextFound(DeviceLabels.TO);
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
    await waitFor(DeviceLabels.FEES);
    await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
    await waitFor(DeviceLabels.SIGN_TRANSACTION);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    const isNanoS = process.env.SPECULOS_DEVICE === DeviceModelId.nanoS;
    await waitFor(DeviceLabels.NEW_ORDINARY);
    await (isNanoS ? pressRightButton() : pressBoth());
    if (isNanoS) {
      await waitFor(DeviceLabels.SEND_TO_ADDRESS);
      await pressBoth();
    } else {
      await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2);
      await pressBoth();
    }
    events = await pressUntilTextFound(DeviceLabels.SEND);
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
    [DeviceLabels.DEPOSIT, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.DELEGATE_STAKE, "both"],
    [DeviceLabels.STAKE_KEY, "both"],
    [DeviceLabels.CONFIRM, "right"],
    [DeviceLabels.CONFIRM, "right"],
  ] as const;

  const STAXSpecificSteps = [
    [DeviceLabels.REVIEW_TRANSACTION, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.REGISTER, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels.DELEGATE_STAKE, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels.HOLD_TO_SIGN, "hold"],
  ];

  const speculosModel = getSpeculosModel();
  let steps;
  if (speculosModel === DeviceModelId.stax) {
    steps = STAXSpecificSteps;
  } else if (speculosModel === DeviceModelId.nanoS) {
    steps = LNSSpecificSteps;
  } else {
    steps = commonSteps;
  }
  for (const [label, action] of steps) {
    try {
      if (speculosModel === DeviceModelId.stax) {
        await waitFor(label);
        switch (label) {
          case DeviceLabels.TAP_TO_CONTINUE:
            await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
            break;
          case DeviceLabels.CONFIRM:
            await pressAndRelease(DeviceLabels.CONFIRM, 139, 532);
            break;
          case DeviceLabels.HOLD_TO_SIGN:
            await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
            break;
          default:
            await swipeRight();
            break;
        }
      } else {
        await waitFor(label);
        action === "both" ? await pressBoth() : await pressRightButton();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error while waiting for "${label}":`, message);
      break;
    }
  }
}
