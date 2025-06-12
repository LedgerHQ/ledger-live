import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type AssetItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xxs",
    "margin-s",
    "radius-s",
    "colors-content-subdued-default-default",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
  )}

  display: flex;
  padding: var(--spacing-xxs);
  cursor: pointer;
  border-radius: var(--radius-s, 8px);
  align-items: center;
  overflow: hidden;

  :hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  :active {
    background-color: var(--colors-surface-transparent-pressed);
  }
`;

const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: var(--margin-s);
  overflow: hidden;
  flex: 1;
`;

const LeftElementWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const AssetItem = ({
  name,
  ticker,
  id,
  onClick,
  leftElement,
  rightElement,
}: AssetItemProps) => {
  return (
    <Wrapper onClick={() => onClick({ name, ticker, id })}>
      <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />
      <InfoWrapper>
        <Text
          fontSize="14px"
          variant="largeLineHeight"
          fontWeight="semiBold"
          color="var(--colors-content-default-default)"
          style={{
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </Text>
        <LeftElementWrapper>
          <Text
            fontSize="12px"
            lineHeight="16px"
            variant="bodyLineHeight"
            fontWeight="medium"
            color="var(--colors-content-subdued-default-default)"
          >
            {ticker}
          </Text>
          {leftElement}
        </LeftElementWrapper>
      </InfoWrapper>
      {rightElement}
    </Wrapper>
  );
};
