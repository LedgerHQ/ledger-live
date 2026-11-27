import { useEffect, useRef, useState } from "react";
import { fetchPoolList } from "@ledgerhq/coin-cardano/api/getPools";
import { APIGetPoolList, StakePool } from "@ledgerhq/coin-cardano/api/api-types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { getCurrencyConfiguration } from "../../config";
import { getPoolPageSize } from "./staking";

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
  const pageNo = useRef(1);
  const isPaginationDisabled = useRef(false);
  const config = getCurrencyConfiguration<CardanoCoinConfig>(currency.id);
  const limit = getPoolPageSize(currency);

  useEffect(() => {
    let cancelled = false;
    isPaginationDisabled.current = false;
    setPools([]);
    setIsSearching(true);
    pageNo.current = 1;

    const delayDebounceFn = setTimeout(
      () => {
        fetchPoolList(config, searchQuery, pageNo.current, limit)
          .then((apiRes: APIGetPoolList) => {
            if (cancelled) return;
            setPools([...apiRes.pools]);
            if (searchQuery && apiRes.pools.length < limit) {
              isPaginationDisabled.current = true;
            }
          })
          .finally(() => {
            if (!cancelled) setIsSearching(false);
          });
      },
      searchQuery ? 500 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, currency.id, limit]); // oxlint-disable-line react-hooks/exhaustive-deps

  const onScrollEndReached = () => {
    if (isPaginationDisabled.current) return;
    setIsPaginating(true);
    pageNo.current++;

    fetchPoolList(config, searchQuery, pageNo.current, limit)
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
