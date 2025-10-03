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
    await waitFor(DeviceLabels.REVIEW_TRANSACTION.name);
    events = await pressUntilTextFound(DeviceLabels.TO.name);
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
    await waitFor(DeviceLabels.FEES.name);
    await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
    await waitFor(DeviceLabels.SIGN_TRANSACTION.name);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    const isNanoS = process.env.SPECULOS_DEVICE === DeviceModelId.nanoS;
    await waitFor(DeviceLabels.NEW_ORDINARY.name);
    await (isNanoS ? pressRightButton() : pressBoth());
    if (isNanoS) {
      await waitFor(DeviceLabels.SEND_TO_ADDRESS.name);
      await pressBoth();
    } else {
      await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2.name);
      await pressBoth();
    }
    events = await pressUntilTextFound(DeviceLabels.SEND.name);
    if (!isNanoS) {
      const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
      expect(isAmountCorrect).toBeTruthy();
    }
    await pressBoth();
    await waitFor(DeviceLabels.TRANSACTION_FEE.name);
    await pressBoth();
    await waitFor(DeviceLabels.CONFIRM.name);
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
    [DeviceLabels.NEW_ORDINARY.name, "both"],
    [DeviceLabels.TRANSACTION_FEE.name, "both"],
    [DeviceLabels.REGISTER.name, "both"],
    [DeviceLabels.STAKE_KEY.name, "both"],
    [DeviceLabels.DEPOSIT.name, "both"],
    [DeviceLabels.CONFIRM.name, "both"],
    [DeviceLabels.DELEGATE_STAKE.name, "both"],
    [DeviceLabels.STAKE_KEY.name, "both"],
    [DeviceLabels.CONFIRM.name, "both"],
    [DeviceLabels.CONFIRM.name, "both"],
  ] as const;

  const LNSSpecificSteps = [
    [DeviceLabels.NEW_ORDINARY.name, "right"],
    [DeviceLabels.TRANSACTION_FEE.name, "both"],
    [DeviceLabels.REGISTER.name, "both"],
    [DeviceLabels.STAKE_KEY.name, "both"],
    [DeviceLabels.DEPOSIT.name, "both"],
    [DeviceLabels.CONFIRM.name, "right"],
    [DeviceLabels.DELEGATE_STAKE.name, "both"],
    [DeviceLabels.STAKE_KEY.name, "both"],
    [DeviceLabels.CONFIRM.name, "right"],
    [DeviceLabels.CONFIRM.name, "right"],
  ] as const;

  const STAXSpecificSteps = [
    [DeviceLabels.REVIEW_TRANSACTION.name, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE.name, "tap"],
    [DeviceLabels.REGISTER.name, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE.name, "tap"],
    [DeviceLabels.CONFIRM.name, "confirm"],
    [DeviceLabels.DELEGATE_STAKE.name, "swipe"],
    [DeviceLabels.TAP_TO_CONTINUE.name, "tap"],
    [DeviceLabels.CONFIRM.name, "confirm"],
    [DeviceLabels.HOLD_TO_SIGN.name, "hold"],
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
          case DeviceLabels.TAP_TO_CONTINUE.name:
            await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
            break;
          case DeviceLabels.CONFIRM.name:
            await pressAndRelease(DeviceLabels.CONFIRM, 139, 532);
            break;
          case DeviceLabels.HOLD_TO_SIGN.name:
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
