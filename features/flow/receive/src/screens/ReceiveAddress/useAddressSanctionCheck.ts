import { useEffect, useState } from "react";

/** `checking` until the sanctions list answers for the address, which stays hidden meanwhile. */
export type AddressSanctionStatus = "checking" | "clear" | "sanctioned";

type Check = (address: string) => Promise<boolean>;

type Result = Readonly<{ address: string; check: Check; isSanctioned: boolean }>;

/**
 * Checks each address before the screen shows it, as the legacy receive flows do. A failed check
 * lets the address through: the legacy check reads an unreachable list as empty.
 */
export function useAddressSanctionCheck(
  address: string | undefined,
  checkAddressSanctioned: Check | undefined,
): AddressSanctionStatus {
  const [result, setResult] = useState<Result>();
  // Picking the same address again must wait for a fresh answer.
  if (!address && result) setResult(undefined);

  useEffect(() => {
    if (!address || !checkAddressSanctioned) return;
    let isCurrent = true;
    checkAddressSanctioned(address)
      .catch(() => false)
      .then(isSanctioned => {
        if (isCurrent) setResult({ address, check: checkAddressSanctioned, isSanctioned });
      });
    return () => {
      isCurrent = false;
    };
  }, [address, checkAddressSanctioned]);

  if (!checkAddressSanctioned) return "clear";
  if (!address || result?.address !== address || result.check !== checkAddressSanctioned) {
    return "checking";
  }
  return result.isSanctioned ? "sanctioned" : "clear";
}
