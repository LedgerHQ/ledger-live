import React, { ReactNode } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { CollectibleTypeEnum, CollectibleType } from "LLD/features/Collectibles/types/Collectibles";
import Text from "~/renderer/components/Text";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { supportLinkByTokenType } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";

const EmptyState = styled.div`
  padding: 15px 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  > :first-child {
    flex: 1;
  }
  > :nth-child(2) {
    align-self: center;
  }
`;
const Placeholder = styled.div`
  flex-direction: column;
  display: flex;
  padding-right: 50px;
`;

type Props = {
  collectionType: CollectibleType;
  currencyName: string;
  children?: ReactNode;
};

const EmptyCollection: React.FC<Props> = ({ collectionType, currencyName, children }) => {
  const { t } = useTranslation();

  const switchCollectionType = (collectionType: CollectibleType) => {
    switch (collectionType) {
      case CollectibleTypeEnum.NFT:
        return (
          <Placeholder>
            <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
              {t("NFT.collections.placeholder", {
                currency: currencyName,
              })}
              &nbsp;
              <LabelWithExternalIcon
                color="wallet"
                ff="Inter|SemiBold"
                onClick={() => {
                  openURL(supportLinkByTokenType.nfts);
                  track(`More info on Manage nfts tokens`);
                }}
                label={t("tokensList.link")}
              />
            </Text>
          </Placeholder>
        );
      case CollectibleTypeEnum.Ordinal:
        return null;
      default:
        return t("collectibles.emptyState.default");
    }
  };

  return (
    <EmptyState>
      {switchCollectionType(collectionType)} {children}
    </EmptyState>
  );
};

export default EmptyCollection;
