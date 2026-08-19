import type { ContactsAddressInputSource } from "./types";
import { getInsertedCharacterCount } from "./getInsertedCharacterCount";

export function classifyNativeAddressInputMethod(
  previousValue: string,
  nextValue: string,
): ContactsAddressInputSource {
  return getInsertedCharacterCount(previousValue, nextValue) > 1 ? "paste" : "manual";
}
