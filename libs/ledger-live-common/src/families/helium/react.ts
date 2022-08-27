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
 * @returns {HeliumVote[]}
 */
export function useVotes(): HeliumVote[] {
  const data = useHeliumPreloadData();

  return useMemo(() => {
    return data?.votes ?? [];
  }, [data]);
}
