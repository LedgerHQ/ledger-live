import { useEffect, useMemo, useState } from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import type { ReceiveServiceIncident } from "@features/flow-receive";

export type ReceiveAddressChecks = Readonly<{
  isCheckingAddress: boolean;
  isSanctioned: boolean;
  serviceIncidents: readonly ReceiveServiceIncident[];
}>;

/** The sanctions check the legacy confirmation screen ran on the address, plus status incidents. */
export function useReceiveAddressChecks(
  network: CryptoCurrency | undefined,
  assetTicker: string | undefined,
  address: string | undefined,
): ReceiveAddressChecks {
  const [sanctionCheck, setSanctionCheck] = useState<"pending" | "clear" | "sanctioned">("pending");

  useEffect(() => {
    if (!network || !address) return;
    let cancelled = false;
    setSanctionCheck("pending");
    isAddressSanctioned(network, address)
      .then(sanctioned => !cancelled && setSanctionCheck(sanctioned ? "sanctioned" : "clear"))
      // Same as the legacy flow: an unreachable sanctions list does not block receiving.
      .catch(() => !cancelled && setSanctionCheck("clear"));
    return () => {
      cancelled = true;
    };
  }, [network, address]);

  const { incidents } = useFilteredServiceStatus({
    tickers: assetTicker ? [assetTicker] : [],
    entryPoint: "flow",
  });
  const serviceIncidents = useMemo<readonly ReceiveServiceIncident[]>(
    () =>
      incidents
        .filter(incident => incident.components && incident.components.length > 0)
        .map(incident => ({
          title: incident.name,
          description: incident.incident_updates?.[0]?.body,
        })),
    [incidents],
  );

  return {
    isCheckingAddress: !!address && sanctionCheck === "pending",
    isSanctioned: sanctionCheck === "sanctioned",
    serviceIncidents,
  };
}
