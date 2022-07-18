import { useState, useEffect } from "react";
import {
  getCurrentCeloPreloadData,
  getCeloPreloadDataUpdates,
} from "./preload";

export function useCeloPreloadData() {
  const [state, setState] = useState(getCurrentCeloPreloadData);
  useEffect(() => {
    const sub = getCeloPreloadDataUpdates().subscribe((data) => {
      setState(data);
    });
    return () => sub.unsubscribe();
  }, []);
  return state;
}
