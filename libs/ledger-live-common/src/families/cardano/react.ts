import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    isPaginationDisabled.current = false;
    setDReps([]);
    setIsSearching(true);
    pageNo.current = 1;

    const delayDebounceFn = setTimeout(
      () => {
        fetchDRepList(currency, searchQuery, pageNo.current, limit)
          .then((apiRes: APIGetDRepList) => {
            setDReps([...apiRes.dRepList]);
            if (searchQuery && apiRes.dRepList.length < limit) {
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

    fetchDRepList(currency, searchQuery, pageNo.current, limit)
      .then((apiRes: APIGetDRepList) => {
        setDReps(currentDReps => {
          return [...currentDReps, ...apiRes.dRepList];
        });
      })
      .finally(() => {
        setIsPaginating(false);
      });
  };

  return {
    dReps,
    searchQuery,
    setSearchQuery,
    onScrollEndReached,
    isSearching,
    isPaginating,
  };
}
