import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { decodeAccountId } from "@ledgerhq/live-common/account/index";
import {
  OpDetailsSection,
  OpDetailsTitle,
  GradientHover,
  OpDetailsData,
  TextEllipsis,
  HashContainer,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Operation } from "@ledgerhq/types-live";
import Media from "~/renderer/components/Nft/Media";
import Box from "~/renderer/components/Box";
import {
  useNftMetadata,
  useNftCollectionMetadata,
} from "@ledgerhq/live-common/nft/NftMetadataProvider/index";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { centerEllipsis } from "~/renderer/styles/helpers";
const NFTOperationDetails = ({ operation }: { operation: Operation }) => {
  const { t } = useTranslation();
  const { currencyId } = decodeAccountId(operation.accountId);
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    operation.contract,
    operation.tokenId,
    currencyId,
  );
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    operation.contract,
    currencyId,
  );
  const show = useMemo(() => nftStatus === "loading" || collectionStatus === "loading", [
    collectionStatus,
    nftStatus,
  ]);
  return operation.contract && operation.tokenId ? (
    <>
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.nft.name")}</OpDetailsTitle>
        <OpDetailsData>
          <Box horizontal alignItems="center">
            <Skeleton width={24} minHeight={24} show={show}>
              <Media
                metadata={nftMetadata}
                tokenId={operation.tokenId}
                size={24}
                mediaFormat="preview"
              />
            </Skeleton>
            <Box ml={2}>
              <Skeleton width={200} barHeight={10} minHeight={32} show={show}>
                <TextEllipsis>
                  {centerEllipsis(collectionMetadata?.tokenName, 33) || "-"}
                </TextEllipsis>
              </Skeleton>
            </Box>
          </Box>
          {!show ? (
            <GradientHover>
              <CopyWithFeedback text={collectionMetadata?.tokenName} />
            </GradientHover>
          ) : null}
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.nft.contract")}</OpDetailsTitle>
        <OpDetailsData>
          <Skeleton width={80} barHeight={10} minHeight={24} show={show}>
            <HashContainer>{centerEllipsis(operation.contract, 33)}</HashContainer>
          </Skeleton>
          {!show ? (
            <GradientHover>
              <CopyWithFeedback text={operation.contract} />
            </GradientHover>
          ) : null}
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>{t("operationDetails.nft.id")}</OpDetailsTitle>
        <OpDetailsData>
          <Skeleton width={80} minHeight={10} show={show}>
            <HashContainer>{centerEllipsis(operation.tokenId, 33)}</HashContainer>
          </Skeleton>
          {!show ? (
            <GradientHover>
              <CopyWithFeedback text={operation.tokenId} />
            </GradientHover>
          ) : null}
        </OpDetailsData>
      </OpDetailsSection>
      {operation.value && operation.standard === "ERC1155" && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("operationDetails.nft.quantity")}</OpDetailsTitle>
          <OpDetailsData>
            <TextEllipsis>{operation.value.toString()}</TextEllipsis>
          </OpDetailsData>
        </OpDetailsSection>
      )}
    </>
  ) : null;
};
export default NFTOperationDetails;
