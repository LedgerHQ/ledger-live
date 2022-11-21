import { useEffect, useMemo, useState } from "react";
import {
  getAvalanchePChainPreloadDataUpdates,
  getCurrentAvalanchePChainPreloadData,
} from "./js-preload-data";

export const useAvalanchePChainPreloadData = () => {
  const [state, setState] = useState(getCurrentAvalanchePChainPreloadData);

  useEffect(() => {
    const sub = getAvalanchePChainPreloadDataUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, []);

  return state;
};

export const useAvalancheFilteredValidators = (search: string) => {
  const { validators } = useAvalanchePChainPreloadData();

  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter((validator) =>
      validator.nodeID.toLowerCase().includes(lowercaseSearch)
    );

    return filtered;
  }, [validators, search]);
};
