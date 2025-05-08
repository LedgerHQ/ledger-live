import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";

type NetworkItemProps = {
  name: string;
  onClick: () => void;
};

const TempAssetBadge = () => (
  // TODO: To be replaced with LIVE-18221
  <div style={{ display: "flex", alignItems: "center" }}>
    <span
      style={{
        height: 48,
        width: 48,
        borderRadius: 48,
        backgroundColor: "grey",
        display: "inline-block",
      }}
    />
  </div>
);

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xxs",
    "margin-s",
    "radius-s",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
  )}
  display: flex;
  padding: var(--spacing-xxs);
  cursor: pointer;
  border-radius: var(--radius-s, 8px);

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
`;

export const NetworkItem = ({ name, onClick }: NetworkItemProps) => {
  return (
    <Wrapper onClick={onClick}>
      <TempAssetBadge />
      <InfoWrapper>
        <Text
          variant="largeLineHeight"
          fontWeight="semiBold"
          color="var(--colors-content-default-default)"
        >
          {name}
        </Text>
      </InfoWrapper>
    </Wrapper>
  );
};
