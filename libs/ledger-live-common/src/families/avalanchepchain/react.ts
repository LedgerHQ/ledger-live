import { useEffect, useState } from "react";
import {
  getAvalanchePChainPreloadDataUpdates,
  getCurrentAvalanchePChainPreloadData,
} from "./js-preload-data";

export const useAvalanchePChainStakes = () => {};

export const useAvalanchePChainPreloadData = () => {
  const [state, setState] = useState(getCurrentAvalanchePChainPreloadData);

  useEffect(() => {
    const sub = getAvalanchePChainPreloadDataUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, []);

  return state;
};
