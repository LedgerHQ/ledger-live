import { useEffect, useMemo, useState } from "react";
import { useHideSpamCollection } from "./useHideSpamCollection";
import { useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import { getEnv } from "@ledgerhq/live-env";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getThreshold, useCheckNftAccount } from "@ledgerhq/live-nft-react";
import { accountsSelector, orderedVisibleNftsSelector } from "~/reducers/accounts";

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
  const SUPPORTED_NFT_CURRENCIES = getEnv("NFT_CURRENCIES");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const threshold = getThreshold(nftsFromSimplehashFeature?.params?.threshold);

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

  const [groupToFetch, setGroupToFetch] = useState(
    addressGroups.length > 0 ? addressGroups[0] : [],
  );
  const [, setCurrentIndex] = useState(0);

  const { refetch } = useCheckNftAccount({
    addresses: groupToFetch.join(","),
    nftsOwned,
    chains: SUPPORTED_NFT_CURRENCIES,
    threshold,
    action: hideSpamCollection,
    enabled,
  });

  // Refetch with new last group when addressGroups length changes
  useEffect(() => {
    if (enabled) {
      const newIndex = addressGroups.length - 1;
      setCurrentIndex(newIndex);
      setGroupToFetch(addressGroups[newIndex] || []);
      refetch();
    }
  }, [addressGroups.length, addressGroups, refetch, enabled]);

  // Regular interval-based rotation through groups
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
}
