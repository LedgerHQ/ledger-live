import { Delegate } from "../models/Delegate";
import { containsSubstringInEvent, getDelegateEvents, pressBoth } from "../speculos";
import expect from "expect";

export async function delegateOsmosis(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const amountInUosmo = (Number(delegatingAccount.amount) * 1_000_000).toString();
  const isAmountCorrect = containsSubstringInEvent(amountInUosmo, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
