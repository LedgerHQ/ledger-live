import type { AddAddressInputSource } from "../steps/AddAddress/types";
import { getInsertedCharacterCount } from "./getInsertedCharacterCount";

export function classifyNativeAddressInputMethod(
  previousValue: string,
  nextValue: string,
): AddAddressInputSource {
  return getInsertedCharacterCount(previousValue, nextValue) > 1 ? "paste" : "manual";
}
