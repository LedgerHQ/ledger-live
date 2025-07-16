import React from "react";
import { Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";

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
      {showIcon && <CryptoIcon ledgerId={cryptoId} ticker={ticker} />}
    </Wrapper>
  );
};
