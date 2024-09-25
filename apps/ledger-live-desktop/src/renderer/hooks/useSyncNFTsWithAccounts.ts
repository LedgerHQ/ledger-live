import { useEffect, useMemo, useState } from "react";
import { useHideSpamCollection } from "./useHideSpamCollection";
import { isThresholdValid, supportedChains, useCheckNftAccount } from "@ledgerhq/live-nft-react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "react-redux";
import { accountsSelector, orderedVisibleNftsSelector } from "../reducers/accounts";
import isEqual from "lodash/isEqual";

/**
 * Represents the size of groups for batching address fetching.
 * @constant {number}
 */
const GROUP_SIZE = 20;

/**
 * Represents the timer duration for updating address groups.
 * 5 hours = 18,000,000 ms.
 * @constant {number}
 */
const TIMER = 5 * 60 * 60 * 1000; // 5 hours = 18000000 ms

/**
 * A React hook that synchronizes NFT accounts by fetching their data in groups.
 * It utilizes address batching and manages updates based on a timer.
 *
 * @returns {void}
 *
 * @example
 * import { useSyncNFTsWithAccounts } from './path/to/hook';
 *
 * const MyComponent = () => {
 *   useSyncNFTsWithAccounts();
 *   return <div>Syncing NFT Accounts...</div>;
 * };
 */

export function useSyncNFTsWithAccounts() {
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const threshold = isThresholdValid(Number(nftsFromSimplehashFeature?.params?.threshold))
    ? Number(nftsFromSimplehashFeature?.params?.threshold)
    : 75;

  const { enabled, hideSpamCollection } = useHideSpamCollection();

  const accounts = useSelector(accountsSelector);
  const nftsOwned = useSelector(orderedVisibleNftsSelector, isEqual);

  const addressGroups = useMemo(() => {
    const uniqueAddresses = [
      ...new Set(
        accounts.map(account => account.freshAddress).filter(addr => addr.startsWith("0x")),
      ),
    ];

    return uniqueAddresses.reduce<string[][]>((acc, _, i, arr) => {
      if (i % GROUP_SIZE === 0) {
        acc.push(arr.slice(i, i + GROUP_SIZE));
      }
      return acc;
    }, []);
  }, [accounts]);

  const [groupToFetch, setGroupToFetch] = useState(addressGroups[0]);
  const [, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % addressGroups.length;
        setGroupToFetch(addressGroups[nextIndex]);

        return nextIndex;
      });
    }, TIMER);

    return () => clearInterval(interval);
  }, [addressGroups, enabled]);

  useCheckNftAccount({
    addresses: groupToFetch.join(","),
    nftsOwned,
    chains: supportedChains,
    threshold,
    action: hideSpamCollection,
    enabled,
  });
}
