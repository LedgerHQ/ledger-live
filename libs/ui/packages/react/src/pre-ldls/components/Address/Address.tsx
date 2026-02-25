import React from "react";
import { Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { formatAddress } from "./formatAddress";

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
  parentId,
  isShortened = false,
}: {
  address: string;
  showIcon: boolean;
  cryptoId?: string;
  ticker?: string;
  parentId?: string;
  isShortened?: boolean;
}) => {
  const formattedAddress = isShortened ? formatAddress(address) : address;
  return (
    <Wrapper>
      <Text
        marginRight="var(--spacing-xxxs)"
        fontSize="12px"
        color="var(--colors-content-subdued-default-default)"
      >
        {formattedAddress}
      </Text>
      {showIcon && (
        <CryptoIcon ledgerId={cryptoId} network={parentId} ticker={ticker} size="20px" />
      )}
    </Wrapper>
  );
};
