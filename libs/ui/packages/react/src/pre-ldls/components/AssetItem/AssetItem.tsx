import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";

export type AssetType = {
  name: string;
  ticker: string;
};

type AssetItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

const TempAssetBadge = () => (
  // TODO: To be replaced with LIVE-18221
  <span
    style={{
      height: 48,
      width: 48,
      borderRadius: 48,
      backgroundColor: "grey",
      display: "inline-block",
    }}
  />
);

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xs",
    "marging-s",
    "colors-content-subdued-default-default",
    "colors-content-default-default",
  )}

  display: flex;
  padding: var(--spacing-xs);
  cursor: pointer;
`;

const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: var(--marging-s);
`;

export const AssetItem = ({ name, ticker, onClick }: AssetItemProps) => {
  return (
    <Wrapper onClick={() => onClick({ name, ticker })}>
      <TempAssetBadge />
      <InfoWrapper>
        <Text
          variant="largeLineHeight"
          fontWeight="semiBold"
          color="var(--colors-content-default-default)"
        >
          {name}
        </Text>
        <Text
          variant="bodyLineHeight"
          fontWeight="semiBold"
          color="var(--colors-content-subdued-default-default)"
        >
          {ticker}
        </Text>
      </InfoWrapper>
    </Wrapper>
  );
};
