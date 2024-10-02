import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { unhideNftCollection } from "~/renderer/actions/settings";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";

import { SettingsSection as Section, SettingsSectionRow as Row } from "../../../SettingsSection";
import Box from "~/renderer/components/Box";
import Track from "~/renderer/analytics/Track";

import IconAngleDown from "~/renderer/icons/AngleDown";
import { HiddenNftCollectionRow } from "./row";

export default function HiddenNftCollections() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [sectionVisible, setSectionVisible] = useState(false);

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const onUnhideCollection = useCallback(
    (collectionId: string) => {
      dispatch(unhideNftCollection(collectionId));
    },
    [dispatch],
  );

  const toggleHiddenCollectionsSection = useCallback(() => {
    setSectionVisible(prevState => !prevState);
  }, []);

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
          <Box horizontal alignItems="center">
            <Box ff="Inter" fontSize={3} mr={2}>
              {t("settings.accounts.hiddenNftCollections.count", {
                count: hiddenNftCollections.length,
              })}
            </Box>
            <Show visible={sectionVisible}>
              <IconAngleDown size={24} />
            </Show>
          </Box>
        ) : null}
      </Row>

      {sectionVisible && (
        <Body>
          {hiddenNftCollections.map(collectionId => {
            const [accountId, contractAddress] = collectionId.split("|");
            return (
              <HiddenNftCollectionRow
                key={collectionId}
                accountId={accountId}
                contractAddress={contractAddress}
                onUnhide={() => onUnhideCollection(collectionId)}
              />
            );
          })}
        </Body>
      )}
    </Section>
  );
}

// Styled components and layout

const Body = styled(Box)`
  &:not(:empty) {
    padding: 0 20px;
  }
`;

const Show = styled(Box).attrs<{ visible?: boolean }>({})<{ visible?: boolean }>`
  transform: rotate(${p => (p.visible ? 0 : 270)}deg);
`;
