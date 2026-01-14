import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  numberOfNetworks?: number;
  assetId?: string;
  shouldDisplayId?: boolean;
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
  gap: 4px;
`;

const LeftElementWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TagWrapper = styled.div`
  ${withTokens(
    "colors-surface-transparent-subdued-default",
    "colors-content-subdued-default-default",
    "radius-xs",
    "spacing-xxxs",
  )}

  padding: var(--spacing-xxxs);
  border-radius: var(--radius-xs);
  display: inline-flex;
  background-color: var(--colors-surface-transparent-subdued-default);
  flex-shrink: 0;
  cursor: pointer;
`;

export const AssetItem = ({
  name,
  ticker,
  numberOfNetworks,
  id,
  assetId,
  onClick,
  leftElement,
  rightElement,
  shouldDisplayId,
}: AssetItemProps) => {
  return (
    <Wrapper onClick={() => onClick({ name, ticker, id })}>
      <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />
      <InfoWrapper>
        <Text
          data-testid={`asset-item-name-${name}`}
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
            data-testid={`asset-item-ticker-${ticker}`}
            fontSize="12px"
            lineHeight="16px"
            variant="bodyLineHeight"
            fontWeight="medium"
            color="var(--colors-content-subdued-default-default)"
          >
            {ticker}
          </Text>
          {leftElement}
          {shouldDisplayId && assetId ? (
            <TagWrapper
              onClick={e => {
                e.stopPropagation();
                copyToClipboard(assetId);
              }}
            >
              <Text
                color="var(--colors-content-subdued-default-default)"
                fontSize="12px"
              >{`${assetId} (${numberOfNetworks} networks)`}</Text>
            </TagWrapper>
          ) : null}
        </LeftElementWrapper>
      </InfoWrapper>
      {rightElement}
    </Wrapper>
  );
};
