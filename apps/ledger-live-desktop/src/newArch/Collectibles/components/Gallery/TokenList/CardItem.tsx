import { Flex, Text } from "@ledgerhq/react-ui";
import React, { memo } from "react";
import { TitleContainer } from "./Common";
import { Skeleton } from "../../Skeleton";
import { Trans } from "react-i18next";
import { centerEllipsis } from "~/renderer/styles/helpers";
import BigNumber from "bignumber.js";

type Props = {
  tokenName: string;
  tokenId: string;
  standard?: string;
  isLoading: boolean;
  amount?: string | BigNumber;
  onHideCollection?: () => void;
};

const CardItem: React.FC<Props> = ({ tokenName, tokenId, amount, isLoading, standard }) => {
  return (
    <Flex flexDirection={"column"} mt={2}>
      <Skeleton width={142} minHeight={24} barHeight={10} show={isLoading}>
        <TitleContainer ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
          {tokenName || "-"}
        </TitleContainer>
      </Skeleton>
      <Skeleton width={180} minHeight={24} barHeight={6} show={isLoading}>
        <Flex justifyContent={"space-between"}>
          <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={3}>
            <Trans
              i18nKey="NFT.gallery.tokensList.item.tokenId"
              values={{
                tokenId: centerEllipsis(tokenId),
              }}
            />
          </Text>
          {standard === "ERC1155" && (
            <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={3} mr={15}>
              {`x${amount}`}
            </Text>
          )}
        </Flex>
      </Skeleton>
    </Flex>
  );
};

export default memo<Props>(CardItem);
