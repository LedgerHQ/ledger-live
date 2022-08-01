import { useState, useEffect, useMemo } from "react";
import {
  getCurrentCeloPreloadData,
  getCeloPreloadDataUpdates,
} from "./preload";
import type { CeloPreloadData, CeloValidatorGroup } from "./types";

export function useCeloPreloadData(): CeloPreloadData {
  const [state, setState] = useState(getCurrentCeloPreloadData);
  useEffect(() => {
    const sub = getCeloPreloadDataUpdates().subscribe((data) => {
      setState(data);
    });
    return () => sub.unsubscribe();
  }, []);
  return state;
}

export function useValidatorGroups(search: string): CeloValidatorGroup[] {
  const { validatorGroups } = useCeloPreloadData();

  return useMemo(() => {
    if (validatorGroups.length === 0 || !search) {
      return validatorGroups;
    }

    const lowercaseSearch = search.toLowerCase();

    return validatorGroups.filter(
      (vg) =>
        vg.name.toLowerCase().includes(lowercaseSearch) ||
        vg.address.toLowerCase().includes(lowercaseSearch)
    );
  }, [validatorGroups, search]);
}
