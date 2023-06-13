import { useEffect, useRef, useState } from "react";
import { fetchPoolList } from "./api/getPools";
import { APIGetPoolList, StakePool } from "./api/api-types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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

    return () => clearInterval(delayDebounceFn);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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
