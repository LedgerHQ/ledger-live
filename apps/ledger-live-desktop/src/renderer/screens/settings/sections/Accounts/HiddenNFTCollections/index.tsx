import React, { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { updateNftStatus } from "~/renderer/actions/settings";
import { nftCollectionsStatusByNetworkSelector } from "~/renderer/reducers/settings";

import { SettingsSection as Section, SettingsSectionRow as Row } from "../../../SettingsSection";
import Box from "~/renderer/components/Box";
import Track from "~/renderer/analytics/Track";
import ShowMore from "LLD/features/Collectibles/components/Collection/ShowMore";

import IconAngleDown from "~/renderer/icons/AngleDown";
import { HiddenNftCollectionRow } from "./row";
import { decodeCollectionId } from "@ledgerhq/live-nft-react";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";

// Styled components and layout

const Body = styled(Box)`
  &:not(:empty) {
    padding: 0 20px;
  }
`;

const Show = styled(Box).attrs<{ visible?: boolean }>({})<{ visible?: boolean }>`
  transform: rotate(${p => (p.visible ? 0 : 270)}deg);
`;

const Collections = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`;

const keys: <T extends object>(obj: T) => (keyof T)[] = Object.keys;

const INCREMENT = 10;

export default function HiddenNftCollections() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [sectionVisible, setSectionVisible] = useState(false);

  const collections = useSelector(nftCollectionsStatusByNetworkSelector);

  const hiddenNftCollections = useMemo(
    () =>
      Object.values(collections).flatMap(network =>
        Object.keys(network).filter(
          collection =>
            network[collection] === NftStatus.blacklisted || network[collection] === NftStatus.spam,
        ),
      ),
    [collections],
  );

  const [numberOfVisibleCollections, setNumberOfVisibleCollections] = useState(INCREMENT);

  const onUnhideCollection = useCallback(
    (collectionId: string, blockchain: SupportedBlockchain) => {
      dispatch(updateNftStatus(blockchain, collectionId, NftStatus.whitelisted));
    },
    [dispatch],
  );

  const toggleHiddenCollectionsSection = useCallback(() => {
    setSectionVisible(prevState => !prevState);
  }, []);

  const onShowMore = useCallback(() => {
    setNumberOfVisibleCollections(numberOfVisibleCollections =>
      Math.min(numberOfVisibleCollections + INCREMENT, hiddenNftCollections.length),
    );
  }, [hiddenNftCollections.length]);

  const visibleCollections = useMemo(
    () => hiddenNftCollections.slice(0, numberOfVisibleCollections),

    [hiddenNftCollections, numberOfVisibleCollections],
  );

  const displayShowMore = numberOfVisibleCollections < hiddenNftCollections.length;

  return (
    <Section style={{ flexDirection: "column" }}>
      <Track onUpdate event="HiddenNftCollections dropdown" opened={sectionVisible} />
      <Row
        title={t("settings.accounts.hiddenNftCollections.title")}
        desc={t("settings.accounts.hiddenNftCollections.desc")}
        onClick={toggleHiddenCollectionsSection}
        contentContainerStyle={hiddenNftCollections.length ? { cursor: "pointer" } : undefined}
      >
        {hiddenNftCollections.length ? (
          <Collections horizontal alignItems="center">
            <Box ff="Inter" fontSize={3} mr={2}>
              {t("settings.accounts.hiddenNftCollections.count", {
                count: hiddenNftCollections.length,
              })}
            </Box>
            <Show visible={sectionVisible}>
              <IconAngleDown size={24} />
            </Show>
          </Collections>
        ) : null}
      </Row>

      {sectionVisible && (
        <Body>
          {visibleCollections.map(collectionId => {
            const { accountId, contractAddress } = decodeCollectionId(collectionId);
            const network =
              keys(collections).find(key => collections[key][collectionId]) ??
              SupportedBlockchain.Ethereum;

            return (
              <HiddenNftCollectionRow
                key={collectionId}
                accountId={accountId}
                contractAddress={contractAddress}
                onUnhide={() => onUnhideCollection(collectionId, network)}
                network={network}
              />
            );
          })}

          {displayShowMore && <ShowMore onShowMore={onShowMore} />}
        </Body>
      )}
    </Section>
  );
}
