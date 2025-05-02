import React from "react";
import { Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";

const TempAssetBadge = ({
  ledgerId: _ledgerId,
  ticker: _ticker,
}: {
  ledgerId?: string;
  ticker?: string;
}) => (
  // TODO: To be replaced with LIVE-18221
  <div style={{ display: "flex", alignItems: "center" }} data-testid="address-icon">
    <span
      style={{
        height: 20,
        width: 20,
        borderRadius: 20,
        backgroundColor: "grey",
        display: "inline-block",
      }}
    />
  </div>
);

const Wrapper = styled.div`
  ${withTokens("spacing-xxxs", "colors-content-subdued-default-default")}

  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const Address = ({
  address,
  showIcon,
  cryptoId,
  ticker,
}: {
  address: string;
  showIcon: boolean;
  cryptoId?: string;
  ticker?: string;
}) => {
  return (
    <Wrapper>
      <Text
        marginRight="var(--spacing-xxxs)"
        fontSize="12px"
        color="var(--colors-content-subdued-default-default)"
      >
        {address}
      </Text>
      {showIcon && <TempAssetBadge ledgerId={cryptoId} ticker={ticker} />}
    </Wrapper>
  );
};
