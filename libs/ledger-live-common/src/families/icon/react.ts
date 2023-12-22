import { useState, useEffect } from "react";
import type { PRep } from "./types";
import { getPreps } from "./api/node";

export const SR_THRESHOLD = 22;
export let SR_MAX_VOTES = 0;
export const MIN_TRANSACTION_AMOUNT = 1;

let __lastSeenPR: PRep[] = [];

/** Fetch the list of super representatives */
export const useIconPublicRepresentatives = (currency): Array<PRep> => {
  const [pr, setPr] = useState(__lastSeenPR);
  useEffect(() => {
    let unsub = false;
    getPreps(currency).then((pr: PRep[]) => {
      __lastSeenPR = pr;
      if (unsub) return;
      setPr(pr);
    });
    return () => {
      unsub = true;
    };
  }, []);
  SR_MAX_VOTES = pr.length;
  return pr;
};
