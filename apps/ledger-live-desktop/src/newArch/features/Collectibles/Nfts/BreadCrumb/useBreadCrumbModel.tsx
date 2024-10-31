import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { State } from "~/renderer/reducers";
import { accountSelector } from "~/renderer/reducers/accounts";
import { useCallback, useMemo } from "react";
import { ProtoNFT } from "@ledgerhq/types-live";
import { DropDownItemType } from "~/renderer/components/DropDownSelector";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useNftCollections } from "~/renderer/hooks/nfts/useNftCollections";

const useBreadCrumbModel = () => {
  const history = useHistory();
  const { id, collectionAddress } = useParams<{ id?: string; collectionAddress?: string }>();

  const account = useSelector((state: State) =>
    id ? accountSelector(state, { accountId: id }) : undefined,
  );

  const { collections } = useNftCollections({
    account,
  });

  const items: DropDownItemType<ProtoNFT>[] = useMemo(
    () =>
      collections.map(([contract, nfts]: [string, ProtoNFT[]]) => ({
        key: contract,
        label: contract,
        content: nfts[0],
      })),
    [collections],
  );

  const activeItem: DropDownItemType<ProtoNFT> | undefined | null = useMemo(
    () => items.find(item => item.key === collectionAddress) || items[0],
    [collectionAddress, items],
  );

  const navigate = useCallback(
    (path: string) => {
      setTrackingSource("NFT breadcrumb");
      history.push({ pathname: path });
    },
    [history],
  );

  const onCollectionSelected = useCallback(
    (item: DropDownItemType<ProtoNFT>) => {
      if (!item) return;
      navigate(`/account/${account?.id}/nft-collection/${item.key}`);
    },
    [account?.id, navigate],
  );

  const onSeeAll = useCallback(() => {
    navigate(`/account/${account?.id}/nft-collection`);
  }, [account?.id, navigate]);

  return {
    activeItem,
    items,
    collectionAddress,
    onCollectionSelected,
    onSeeAll,
  };
};

export default useBreadCrumbModel;
