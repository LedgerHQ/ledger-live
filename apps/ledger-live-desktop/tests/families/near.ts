import { expect } from "@playwright/test";
import { Delegate } from "tests/models/Delegate";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";

export async function delegateNear(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.VIEW_HEADER);
  const events = await pressUntilTextFound(DeviceLabels.CONTINUE_TO_ACTION);
  const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
  expect(isProviderCorrect).toBeTruthy();
  await pressBoth();
  await waitFor(DeviceLabels.VIEW_ACTION);
  await pressUntilTextFound(DeviceLabels.SIGN);
  await pressBoth();
}
