import { validateMemo as icpValidateMemo } from "../dfinity/validation";

export function validateMemo(memo?: string): boolean {
  return icpValidateMemo(memo).isValid;
}
