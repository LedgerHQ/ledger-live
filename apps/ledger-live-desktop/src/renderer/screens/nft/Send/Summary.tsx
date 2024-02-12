import React, { useMemo, memo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { getAllNFTs } from "~/renderer/reducers/accounts";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { centerEllipsis } from "~/renderer/styles/helpers";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { getNFT } from "@ledgerhq/live-nft";
import { getLLDCoinFamily } from "~/renderer/families";

type Props = {
  transaction: Transaction;
  currency: CryptoCurrency;
};
const Summary = ({ transaction }: Props) => {
  const allNfts = useSelector(getAllNFTs) as ProtoNFT[];
  const specific = getLLDCoinFamily(transaction.family);
  const { contract, tokenId, quantity } = useMemo(
    () => specific?.nft?.getNftTransactionProperties(transaction) || ({} as Record<string, never>),
    [specific?.nft, transaction],
  );
  const nft = useMemo(() => getNFT(contract, tokenId, allNfts), [allNfts, contract, tokenId]);
  const { status, metadata } = useNftMetadata(nft?.contract, nft?.tokenId, nft?.currencyId);
  const { nftName } = status === "loaded" ? metadata : ({} as Record<string, never>);
  const show = useMemo(() => status === "loading", [status]);

  /**
   * If for any reason, the nft is not found, we don't display the NFT specific
   * summary.
   * This can happen if the nft is not in the account's list of nfts (allNfts),
   * for example in the speedup flow since the NFT is removed from the account
   * once the transaction is broadcasted.
   * Not having an nft object at this stage is not necessarily an error, so we
   * don't want to display an error message to the user or use an invariant.
   * Furthermore, all NFT related infos will be displayed on the device and at
   * the device step anyway.
   */
  if (!nft) {
    return null;
  }

  return (
    <>
      <Box horizontal justifyContent="space-between" mb={2}>
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          <Trans i18nKey="send.steps.details.nft" />
        </Text>
        <Box horizontal>
          <Box mr={3} alignItems="flex-end">
            <Skeleton width={42} minHeight={18} barHeight={6} show={show}>
              <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
                {(nftName as string) || "-"}
              </Text>
            </Skeleton>
            <Skeleton width={42} minHeight={18} barHeight={6} show={show}>
              <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
                {"ID:"}
                {centerEllipsis(nft.tokenId)}
              </Text>
            </Skeleton>
          </Box>
          <Skeleton width={48} minHeight={48} show={show}>
            <Media
              metadata={metadata as NFTMetadata}
              tokenId={tokenId || ""}
              size={48}
              mediaFormat="preview"
            />
          </Skeleton>
        </Box>
      </Box>
      {nft.standard === "ERC1155" ? (
        <Box horizontal justifyContent="space-between" mb={2}>
          <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="send.steps.details.nftQuantity" />
          </Text>
          <Box>
            <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
              {quantity?.toFixed()}
            </Text>
          </Box>
        </Box>
      ) : null}
    </>
  );
};
export default memo<Props>(Summary);
