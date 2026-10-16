import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { SponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import { clearPendingRent, getPendingRent, subscribePendingRents } from "./pendingRents";

const LOG_TYPE = "sponsored-send";

export type PendingRentDelivery = Readonly<{
  /** A rent paid outside the active flow hasn't landed, so renting again would pay twice. */
  rentArriving: boolean;
  /** When this hook saw the energy land, in ms since epoch. */
  deliveredAt: number | null;
}>;

/** Watches the rent a closed or reset Send left behind; only while `idle`, as an active flow polls for its own. */
export function usePendingRentDelivery({
  mainAccountId,
  seam,
  idle,
}: Readonly<{
  mainAccountId: string | null;
  seam: SponsoredCoinApi | null;
  idle: boolean;
}>): PendingRentDelivery {
  // Keyed by account so a switch can't show the previous account's state for a render.
  const [arrivingFor, setArrivingFor] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<{ mainAccountId: string; at: number } | null>(null);

  // A rent can be recorded after the first read: the in-flight submit of a flow reset meanwhile.
  const [recordVersion, setRecordVersion] = useState(0);
  useEffect(() => {
    if (!idle || !mainAccountId) return;
    return subscribePendingRents(changedId => {
      if (changedId === mainAccountId) setRecordVersion(version => version + 1);
    });
  }, [mainAccountId, idle]);

  useEffect(() => {
    const rent = idle && mainAccountId ? getPendingRent(mainAccountId) : null;
    if (!mainAccountId || !rent) {
      setArrivingFor(null);
      return;
    }

    let ignore = false;
    const controller = new AbortController();
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    setArrivingFor(mainAccountId);
    // A rent arriving again outdates the last delivery time.
    setDelivered(null);

    // Without a delivery signal the hold lasts the rent's window; re-arms if the timer fires early (clock skew).
    const holdUntil = (expiresAt: number) => {
      expiryTimer = setTimeout(
        () => {
          const current = getPendingRent(mainAccountId);
          if (current) holdUntil(current.expiresAt);
          else setArrivingFor(null);
        },
        Math.max(0, expiresAt - Date.now()),
      );
    };
    holdUntil(rent.expiresAt);

    const onDelivered = () => {
      clearTimeout(expiryTimer);
      clearPendingRent(mainAccountId, rent.paymentTxId);
      setDelivered({ mainAccountId, at: Date.now() });
      setArrivingFor(null);
    };

    const watchDelivery = async (api: SponsoredCoinApi) => {
      const target = { receiverAddress: rent.receiverAddress, energyNeeded: rent.energyNeeded };
      try {
        if (await api.isEnergyDelivered(target)) {
          if (!ignore) onDelivered();
          return;
        }
      } catch (error) {
        log(LOG_TYPE, "pending rent delivery check failed", { error });
      }
      if (ignore) return;
      try {
        await api.awaitEnergyDelivery(
          { orderId: rent.orderId, payerAddress: rent.payerAddress },
          target,
          {
            timeoutMs: Math.max(0, rent.expiresAt - Date.now()),
            paymentTxId: rent.paymentTxId,
            signal: controller.signal,
          },
        );
        if (!ignore) onDelivered();
      } catch (error) {
        // A timeout or abort: the hold runs on until the rent's window ends.
        if (!ignore) log(LOG_TYPE, "pending rent delivery wait ended", { error });
      }
    };
    if (seam) void watchDelivery(seam);

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(expiryTimer);
    };
    // recordVersion only re-triggers the read.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [mainAccountId, seam, idle, recordVersion]);

  return {
    rentArriving: arrivingFor !== null && arrivingFor === mainAccountId,
    deliveredAt: delivered?.mainAccountId === mainAccountId ? delivered.at : null,
  };
}
