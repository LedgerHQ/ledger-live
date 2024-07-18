import { DetailsArray } from "LLD/features/Collectibles/types/DetailDrawer";
import { ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";

export function createDetails(
  metadata: NFTMetadata,
  protoNft: ProtoNFT,
  amount: string | null,
  floorPriceLoading: boolean,
  floorPrice: string | null,
  ticker: string,
): DetailsArray {
  return [
    {
      key: "Description",
      title: "NFT.viewer.attributes.description",
      value: metadata?.description || "",
    },
    {
      key: "Contract",
      title: "NFT.viewer.attributes.tokenAddress",
      value: protoNft.contract,
      isCopyable: true,
      isHash: true,
    },
    {
      key: "Token ID",
      title: "NFT.viewer.attributes.tokenId",
      value: protoNft.tokenId,
      isCopyable: true,
      isHash: protoNft.tokenId?.length >= 4 ? true : false,
    },
    ...(amount
      ? [
          {
            key: "Amount",
            title: "NFT.viewer.attributes.quantity",
            value: amount,
          },
        ]
      : []),
    ...(!floorPriceLoading && floorPrice
      ? [
          {
            key: "Floor Price",
            title: "NFT.viewer.attributes.floorPrice",
            value: `${floorPrice} ${ticker}`,
          },
        ]
      : []),
  ];
}
