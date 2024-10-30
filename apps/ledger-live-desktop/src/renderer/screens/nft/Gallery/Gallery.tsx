import React, { useCallback, useRef, useState, useEffect, useMemo, memo } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { accountSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import { nftsByCollections } from "@ledgerhq/live-nft";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";
import styled from "styled-components";
import IconSend from "~/renderer/icons/Send";
import CollectionName from "~/renderer/components/Nft/CollectionName";
import TokensList from "./TokensList";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import GridListToggle from "./GridListToggle";
import { State } from "~/renderer/reducers";
import { ProtoNFT } from "@ledgerhq/types-live";
import theme from "@ledgerhq/react-ui/styles/theme";
import { useOnScreen } from "../useOnScreen";
import { Chain, isThresholdValid, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const SpinnerContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;
const SpinnerBackground = styled.div`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 100%;
  padding: 2px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${p => p.theme.colors.palette.background.paper};
`;
const ClickableCollectionName = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`;

const Footer = styled.footer`
  height: calc(${theme.space[10]} * 2);
`;

const Gallery = () => {
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = nftsFromSimplehashFeature?.params?.threshold;

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const account = useSelector((state: State) =>
    accountSelector(state, {
      accountId: id,
    }),
  );
  const history = useHistory();
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const { nfts, fetchNextPage, hasNextPage } = useNftGalleryFilter({
    nftsOwned: account?.nfts || [],
    addresses: account?.freshAddress || "",
    chains: [account?.currency.id ?? Chain.ETHEREUM],
    threshold: isThresholdValid(thresold) ? Number(thresold) : 75,
  });

  const collections = useMemo(
    () =>
      Object.entries(
        nftsByCollections(nftsFromSimplehashFeature?.enabled ? nfts : account?.nfts),
      ).filter(([contract]) => !hiddenNftCollections.includes(`${account?.id}|${contract}`)),
    [account?.id, account?.nfts, hiddenNftCollections, nfts, nftsFromSimplehashFeature?.enabled],
  );

  // Should redirect to the account page if there is not NFT anymore in the page.
  useEffect(() => {
    if (collections.length <= 0) {
      history.push(`/account/${account?.id}/`);
    }
  }, [account?.id, history, collections.length]);
  const onSend = useCallback(() => {
    dispatch(
      openModal("MODAL_SEND", {
        account,
        isNFTSend: true,
      }),
    );
  }, [dispatch, account]);
  const onSelectCollection = useCallback(
    (collectionAddress: string) => {
      history.push({
        pathname: `/account/${account?.id}/nft-collection/${collectionAddress}`,
      });
    },
    [account?.id, history],
  );
  const listFooterRef = useRef<HTMLDivElement>(null);
  const [maxVisibleNFTs, setMaxVisibleNFTs] = useState(1);
  const updateMaxVisibleNtfs = () => {
    setMaxVisibleNFTs(maxVisibleNFTs => maxVisibleNFTs + 5);
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  useOnScreen({
    enabled: maxVisibleNFTs < (account?.nfts?.length ?? 0),
    onIntersect: updateMaxVisibleNtfs,
    target: listFooterRef,
    threshold: 0.5,
  });

  const [collectionsRender, isLoading] = useMemo(() => {
    const collectionsRender: JSX.Element[] = [];
    let isLoading = false;
    let displayedNFTs = 0;
    collections.forEach(([contract, nfts]: [string, ProtoNFT[]]) => {
      if (displayedNFTs > maxVisibleNFTs) return;
      collectionsRender.push(
        <div key={contract}>
          <ClickableCollectionName mb={2} onClick={() => onSelectCollection(contract)}>
            <Text ff="Inter|Medium" fontSize={6} color="palette.text.shade100">
              <CollectionName nft={nfts[0]} fallback={contract} account={account} showHideMenu />
            </Text>
          </ClickableCollectionName>
          {account && (
            <TokensList account={account} nfts={nfts.slice(0, maxVisibleNFTs - displayedNFTs)} />
          )}
        </div>,
      );
      if (displayedNFTs + nfts.length > maxVisibleNFTs) {
        isLoading = true;
      }
      displayedNFTs += nfts.length;
    });
    return [collectionsRender, isLoading];
  }, [collections, maxVisibleNFTs, account, onSelectCollection]);

  return (
    <>
      <TrackPage category="Page" name="NFT Gallery" />
      <Box horizontal alignItems="center" mb={6}>
        <Box flex={1}>
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={22}>
            {t("NFT.gallery.title")}
          </Text>
        </Box>
        <Button small primary icon onClick={onSend}>
          <Box horizontal flow={1} alignItems="center">
            <IconSend size={12} />
            <Box>{t("NFT.gallery.collection.header.sendCTA")}</Box>
          </Box>
        </Button>
      </Box>
      <GridListToggle />
      {collectionsRender?.length ? (
        collectionsRender
      ) : (
        <Box p={3} alignItems="center">
          <Text ff="Inter" fontSize={3}>
            {t("operationList.noMoreOperations")}
          </Text>
        </Box>
      )}
      <Footer ref={listFooterRef}>
        {isLoading && (
          <SpinnerContainer>
            <SpinnerBackground>
              <Spinner size={14} />
            </SpinnerBackground>
          </SpinnerContainer>
        )}
      </Footer>
    </>
  );
};
export default memo<{}>(Gallery);
