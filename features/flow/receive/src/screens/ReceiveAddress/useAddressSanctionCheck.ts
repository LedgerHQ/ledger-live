import { useEffect, useState } from "react";

export type AddressSanctionStatus = "checking" | "clear" | "sanctioned";

type Result = Readonly<{ address: string; isSanctioned: boolean }>;

/** A failed check lets the address through, as the legacy check reads an unreachable list as empty. */
export function useAddressSanctionCheck(
  address: string | undefined,
  checkAddressSanctioned: ((address: string) => Promise<boolean>) | undefined,
): AddressSanctionStatus {
  const [result, setResult] = useState<Result>();

  useEffect(() => {
    if (!address || !checkAddressSanctioned) return;
    let isCurrent = true;
    checkAddressSanctioned(address)
      .catch(() => false)
      .then(isSanctioned => {
        if (isCurrent) setResult({ address, isSanctioned });
      });
    return () => {
      isCurrent = false;
    };
  }, [address, checkAddressSanctioned]);

  if (!checkAddressSanctioned) return "clear";
  if (!address || result?.address !== address) return "checking";
  return result.isSanctioned ? "sanctioned" : "clear";
}
