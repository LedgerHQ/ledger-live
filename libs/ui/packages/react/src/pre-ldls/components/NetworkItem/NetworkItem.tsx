import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";

export type Network = {
  name: string;
  id: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type NetworkItemProps = Network & {
  onClick: () => void;
};

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xxs",
    "margin-s",
    "radius-s",
    "colors-content-default-default",
    "colors-content-subdued-default-default", // used by leftElement child
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
  )}
  display: flex;
  padding: var(--spacing-xxs);
  cursor: pointer;
  border-radius: var(--radius-s, 8px);
  align-items: center;

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
  flex: 1;
`;

const LeftElementWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NetworkItem = ({
  name,
  onClick,
  id,
  ticker,
  leftElement,
  rightElement,
}: NetworkItemProps) => {
  return (
    <Wrapper onClick={onClick}>
      <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />
      <InfoWrapper>
        <Text
          variant="largeLineHeight"
          fontWeight="semiBold"
          color="var(--colors-content-default-default)"
        >
          {name}
        </Text>
        <LeftElementWrapper>{leftElement}</LeftElementWrapper>
      </InfoWrapper>
      {rightElement}
    </Wrapper>
  );
};
