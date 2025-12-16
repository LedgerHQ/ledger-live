import { validateMemo as icpValidateMemo } from "@zondax/ledger-live-icp/utils";

export function validateMemo(memo?: string): boolean {
  return icpValidateMemo(memo).isValid;
}
