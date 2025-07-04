import React, { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { NFTMetadata } from "@ledgerhq/types-live";
type OptionProps = {
  data: {
    tokenId: string;
    amount: BigNumber;
    contract: string;
    standard: string;
    currencyId: string;
  };
};
const Option = ({ data: { tokenId, amount, contract, standard, currencyId } }: OptionProps) => {
  const { status, metadata } = useNftMetadata(contract, tokenId, currencyId);
  const show = useMemo(() => status === "loading", [status]);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const nftMetadata = metadata as NFTMetadata;
  return (
    <Box horizontal>
      <Skeleton width={30} minHeight={30} show={show}>
        <Media metadata={nftMetadata} tokenId={tokenId} size={30} mediaFormat="preview" />
      </Skeleton>
      <Box horizontal alignItems="center" justifyContent="space-between" flex={1}>
        <Box ml={3}>
          <Skeleton width={142} minHeight={15} barHeight={8} show={show}>
            <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={2}>
              {nftMetadata?.nftName || "-"}
            </Text>
          </Skeleton>
          <Skeleton width={80} minHeight={15} barHeight={8} show={show}>
            <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={2}>
              {"ID:"}
              {centerEllipsis(tokenId)}
            </Text>
          </Skeleton>
        </Box>
        {standard === "ERC1155" ? (
          <Text ff="Inter|Medium" fontSize={3}>
            {"x"}
            {amount.toFixed()}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
};

export default Option;
