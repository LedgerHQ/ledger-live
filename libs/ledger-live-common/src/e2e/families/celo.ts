import { pressBoth, containsSubstringInEvent, getDelegateEvents } from "../speculos";
import { Delegate } from "../models/Delegate";
import expect from "expect";

export async function delegateCelo(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
