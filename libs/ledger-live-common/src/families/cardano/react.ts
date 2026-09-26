import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPoolList } from "@ledgerhq/coin-cardano/api/getPools";
import { fetchDRepList } from "@ledgerhq/coin-cardano/api/getDRepList";
import {
  APIGetPoolList,
  DRep,
  StakePool,
  APIGetDRepList,
} from "@ledgerhq/coin-cardano/api/api-types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";

export function useCardanoFamilyPools(currency: CryptoCurrency): {
  pools: Array<StakePool>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onScrollEndReached: () => void;
  isSearching: boolean;
  isPaginating: boolean;
} {
  const [pools, setPools] = useState([] as Array<StakePool>);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const limit = 100;
  const pageNo = useRef(1);
  const isPaginationDisabled = useRef(false);

  useEffect(() => {
    isPaginationDisabled.current = false;
    setPools([]);
    setIsSearching(true);
    pageNo.current = 1;

    const delayDebounceFn = setTimeout(
      () => {
        fetchPoolList(currency, searchQuery, pageNo.current, limit)
          .then((apiRes: APIGetPoolList) => {
            setPools([...apiRes.pools]);
            if (searchQuery && apiRes.pools.length < limit) {
              isPaginationDisabled.current = true;
            }
          })
          .finally(() => {
            setIsSearching(false);
          });
      },
      searchQuery ? 500 : 0,
    );

    return () => clearTimeout(delayDebounceFn);
  }, [currency, searchQuery]);

  const onScrollEndReached = () => {
    if (isPaginationDisabled.current) return;
    setIsPaginating(true);
    pageNo.current++;

    fetchPoolList(currency, searchQuery, pageNo.current, limit)
      .then((apiRes: APIGetPoolList) => {
        setPools(currentPools => {
          return [...currentPools, ...apiRes.pools];
        });
      })
      .finally(() => {
        setIsPaginating(false);
      });
  };

  return {
    pools,
    searchQuery,
    setSearchQuery,
    onScrollEndReached,
    isSearching,
    isPaginating,
  };
}

export function useCardanoFamilyDReps(currency: CryptoCurrency): {
  dReps: Array<DRep>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onScrollEndReached: () => void;
  isSearching: boolean;
  isPaginating: boolean;
} {
  const [dReps, setDReps] = useState([] as Array<DRep>);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const limit = 50;
  const pageNo = useRef(1);
  const isPaginationDisabled = useRef(false);
  // Incremented on every currency/search change; responses from older generations are ignored.
  const requestGeneration = useRef(0);
  const isPaginationInFlight = useRef(false);

  useEffect(() => {
    const generation = ++requestGeneration.current;
    isPaginationDisabled.current = false;
    isPaginationInFlight.current = false;
    setDReps([]);
    setIsSearching(true);
    setIsPaginating(false);
    pageNo.current = 1;

    const delayDebounceFn = setTimeout(
      () => {
        fetchDRepList(currency, searchQuery, pageNo.current, limit)
          .then((apiRes: APIGetDRepList) => {
            if (generation !== requestGeneration.current) return;
            setDReps([...apiRes.dRepList]);
            if (apiRes.dRepList.length < limit) {
              isPaginationDisabled.current = true;
            }
          })
          .catch(() => {
            // leave list empty; UI shows empty state
          })
          .finally(() => {
            if (generation !== requestGeneration.current) return;
            setIsSearching(false);
          });
      },
      searchQuery ? 500 : 0,
    );

    return () => clearTimeout(delayDebounceFn);
  }, [currency, searchQuery]);

  const onScrollEndReached = useCallback(() => {
    if (isPaginationDisabled.current || isPaginationInFlight.current) return;
    isPaginationInFlight.current = true;
    const generation = requestGeneration.current;
    const nextPage = pageNo.current + 1;
    setIsPaginating(true);

    fetchDRepList(currency, searchQuery, nextPage, limit)
      .then((apiRes: APIGetDRepList) => {
        if (generation !== requestGeneration.current) return;
        pageNo.current = nextPage;
        if (apiRes.dRepList.length < limit) {
          isPaginationDisabled.current = true;
        }
        setDReps(currentDReps => [...currentDReps, ...apiRes.dRepList]);
      })
      .catch(() => {
        // keep pageNo unchanged so the next scroll retries the same page
      })
      .finally(() => {
        if (generation !== requestGeneration.current) return;
        isPaginationInFlight.current = false;
        setIsPaginating(false);
      });
  }, [currency, searchQuery]);

  return {
    dReps,
    searchQuery,
    setSearchQuery,
    onScrollEndReached,
    isSearching,
    isPaginating,
  };
}
