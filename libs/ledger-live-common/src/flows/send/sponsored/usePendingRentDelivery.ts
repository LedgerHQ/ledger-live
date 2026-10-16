import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { SponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import {
  PENDING_RENT_RECHECK_INTERVAL_MS,
  clearPendingRent,
  getPendingRent,
  subscribePendingRents,
} from "./pendingRents";

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
    let recheckTimer: ReturnType<typeof setTimeout> | undefined;
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
      // Capped at the window's end, where the hold stops anyway.
      const recheckLater = () => {
        const remaining = rent.expiresAt - Date.now();
        if (remaining <= 0) return;
        recheckTimer = setTimeout(
          async () => {
            try {
              if (await api.isEnergyDelivered(target)) {
                if (!ignore) onDelivered();
                return;
              }
            } catch (error) {
              log(LOG_TYPE, "pending rent delivery check failed", { error });
            }
            if (!ignore) recheckLater();
          },
          Math.min(PENDING_RENT_RECHECK_INTERVAL_MS, remaining),
        );
      };
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
        if (ignore) return;
        log(LOG_TYPE, "pending rent delivery wait ended", { error });
        // A provider "failed" or a run of read errors ends the wait early, yet the energy can still land.
        recheckLater();
      }
    };
    // The record once the submit returns re-runs this; until then, energy on-chain isn't this rent's.
    if (seam && !rent.submitting) void watchDelivery(seam);

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(expiryTimer);
      clearTimeout(recheckTimer);
    };
    // recordVersion only re-triggers the read.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [mainAccountId, seam, idle, recordVersion]);

  return {
    rentArriving: arrivingFor !== null && arrivingFor === mainAccountId,
    deliveredAt: delivered?.mainAccountId === mainAccountId ? delivered.at : null,
  };
}
