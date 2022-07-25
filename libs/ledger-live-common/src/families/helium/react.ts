import { Validator } from "@helium/http";
import { HeliumVote } from "./types";
import { useEffect, useState, useMemo } from "react";
import {
  getCurrentHeliumPreloadData,
  getHeliumPreloadDataUpdates,
} from "./preloadedData";
import { HeliumPreloadData } from "./types";

/**
 *
 * @returns {HeliumPreloadData}
 */
export function useHeliumPreloadData(): HeliumPreloadData {
  const [state, setState] = useState(getCurrentHeliumPreloadData);
  useEffect(() => {
    const sub = getHeliumPreloadDataUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, []);
  return state;
}

/**
 *
 * @returns {Validator[]}
 */
export function useValidators(): Validator[] {
  const data = useHeliumPreloadData();

  return useMemo(() => {
    return data?.validators ?? [];
  }, [data]);
}

/**
 *
 * @returns {HeliumVote[]}
 */
export function useVotes(): HeliumVote[] {
  const data = useHeliumPreloadData();

  return useMemo(() => {
    return data?.votes ?? [];
  }, [data]);
}
