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

const Name = styled(Text)`
  ${withTokens("colors-content-default-default")}

  color: var(--colors-content-default-default);
`;

const Ticker = styled(Text)`
  ${withTokens("colors-content-subdued-default-default")}

  color: var(--colors-content-subdued-default-default);
`;

const Wrapper = styled.div`
  ${withTokens("spacing-xs")}

  display: flex;
  padding: var(--spacing-xs);
  cursor: pointer;
`;

const InfoWrapper = styled.div`
  ${withTokens("marging-s")}

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
        <Name variant="largeLineHeight" fontWeight="semiBold">
          {name}
        </Name>
        <Ticker variant="bodyLineHeight" fontWeight="semiBold">
          {ticker}
        </Ticker>
      </InfoWrapper>
    </Wrapper>
  );
};
