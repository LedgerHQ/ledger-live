import { useEffect, useRef, useState } from "react";
import { fetchPoolList } from "./api/getPools";
import { APIGetPoolList, StakePool } from "./api/api-types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";

export function useCardanoFamilyPools(currency: CryptoCurrency): {
  pools: Array<StakePool>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onScrollEndReached: () => void;
} {
  const [pools, setPools] = useState([] as Array<StakePool>);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 100;
  const pageNo = useRef(1);
  const isPaginationDisabled = useRef(false);

  const loadPage = () => {
    fetchPoolList(currency, searchQuery, pageNo.current, limit).then(
      (apiRes: APIGetPoolList) => {
        setPools((currentPools) => {
          return [...currentPools, ...apiRes.pools];
        });
      }
    );
  };

  useEffect(() => {
    isPaginationDisabled.current = false;
    pageNo.current = 1;

    const delayDebounceFn = setTimeout(
      () => {
        fetchPoolList(currency, searchQuery, pageNo.current, limit).then(
          (apiRes: APIGetPoolList) => {
            setPools([...apiRes.pools]);

            if (searchQuery && apiRes.pools.length < limit) {
              isPaginationDisabled.current = true;
            }
          }
        );
      },
      searchQuery ? 500 : 0
    );

    return () => clearInterval(delayDebounceFn);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScrollEndReached = () => {
    if (isPaginationDisabled.current) return;
    pageNo.current++;
    loadPage();
  };

  return {
    pools,
    searchQuery,
    setSearchQuery,
    onScrollEndReached,
  };
}
