import React, { useMemo, useEffect, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Account, NFT, ProtoNFT } from "@ledgerhq/types-live";
import { nftsByCollections } from "@ledgerhq/live-nft";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Option from "./Option";
const SelectNFT = ({
  onSelect,
  maybeNFTId,
  maybeNFTCollection,
  account,
}: {
  onSelect: (a: ProtoNFT | NFT) => void;
  maybeNFTId?: string;
  maybeNFTCollection?: string;
  account: Account;
}) => {
  const [token, setToken] = useState<ProtoNFT | NFT | null>(null);
  // @ts-expect-error impossible to type this, we need to bump react-select to v5
  const getOptionValue = useCallback(item => item, []);
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const filteredNFTs = useMemo(
    () =>
      maybeNFTCollection
        ? (nftsByCollections(account.nfts, maybeNFTCollection) as (ProtoNFT | NFT)[])
        : account.nfts?.filter(
            nft => !hiddenNftCollections.includes(`${account.id}|${nft.contract}`),
          ) || [],
    [maybeNFTCollection, account.nfts, account.id, hiddenNftCollections],
  );
  const onTokenSelected = useCallback(
    (token: ProtoNFT | NFT) => {
      onSelect(token);
      setToken(token);
    },
    [onSelect],
  );
  useEffect(() => {
    if (filteredNFTs?.length && !token) {
      // Search for the passed nftid, fallback to first nft
      let match = filteredNFTs[0];
      if (maybeNFTId) {
        const maybeMatch = filteredNFTs.find(nft => nft.id === maybeNFTId);
        if (maybeMatch) {
          match = maybeMatch;
        }
      }
      onTokenSelected(match);
    }
  }, [filteredNFTs, maybeNFTId, onTokenSelected, token]);
  return (
    <Select
      isSearchable={false}
      // @ts-expect-error Select hell again, we need to upgrade
      onChange={onTokenSelected}
      options={filteredNFTs}
      value={token}
      rowHeight={50}
      getOptionValue={getOptionValue}
      renderOption={Option}
      renderValue={Option}
      small
    />
  );
};
export default SelectNFT;
