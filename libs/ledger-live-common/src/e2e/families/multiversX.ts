import { getDelegateEvents, pressBoth } from "../speculos";
import { Delegate } from "../models/Delegate";

export async function delegateMultiversX(delegatingAccount: Delegate) {
  await getDelegateEvents(delegatingAccount);
  await pressBoth();
}
