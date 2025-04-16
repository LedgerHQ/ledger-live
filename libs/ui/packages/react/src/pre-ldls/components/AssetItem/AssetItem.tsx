import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";

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

const Name = styled.span`
  ${withTokens("colors-content-default-default")}

  font-weight: 600;
  font-size: 16px;
  color: var(--colors-content-default-default);
`;

const Ticker = styled.span`
  ${withTokens("colors-content-subdued-default-default")}

  font-weight: 600;
  font-size: 14px;
  color: var(--colors-content-subdued-default-default);
`;

const OuterWrapper = styled.div`
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
    <OuterWrapper onClick={() => onClick({ name, ticker })}>
      <TempAssetBadge />
      <InfoWrapper>
        <Name>{name}</Name>
        <Ticker>{ticker}</Ticker>
      </InfoWrapper>
    </OuterWrapper>
  );
};
