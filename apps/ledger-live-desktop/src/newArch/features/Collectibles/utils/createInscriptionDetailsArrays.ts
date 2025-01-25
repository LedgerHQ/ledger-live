import { DetailsArray } from "LLD/features/Collectibles/types/DetailDrawer";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";

const createDetail = ({
  key,
  title,
  value,
  isCopyable = false,
  isHash = false,
}: {
  key: string;
  title: string;
  value?: string | number;
  isCopyable?: boolean;
  isHash?: boolean;
}) => {
  if (value !== undefined && value !== null) {
    return {
      key,
      title,
      value: String(value),
      isCopyable,
      isHash,
    };
  }
  return null;
};

export function createDetails(inscription: SimpleHashNft, createdDate: string): DetailsArray {
  return [
    createDetail({
      key: "Description",
      title: "ordinals.inscriptions.detailsDrawer.description",
      value: inscription.collection.description,
    }),
    createDetail({
      key: "Collection Name",
      title: "ordinals.inscriptions.detailsDrawer.collectionName",
      value: inscription.collection.name,
    }),
    createDetail({
      key: "Satribute",
      title: "ordinals.inscriptions.detailsDrawer.satribute",
      value: inscription.extra_metadata?.ordinal_details?.sat_rarity,
    }),
    createDetail({
      key: "InscriptionID",
      title: "ordinals.inscriptions.detailsDrawer.inscriptionId",
      value: inscription.extra_metadata?.ordinal_details?.inscription_id,
      isCopyable: true,
      isHash: (inscription.extra_metadata?.ordinal_details?.inscription_id?.length ?? 0) >= 4,
    }),
    createDetail({
      key: "InscriptionNumber",
      title: "ordinals.inscriptions.detailsDrawer.inscriptionNumber",
      value: inscription.extra_metadata?.ordinal_details?.inscription_number,
      isCopyable: true,
    }),
    createDetail({
      key: "MintedTo",
      title: "ordinals.inscriptions.detailsDrawer.mintedTo",
      value: inscription.first_created?.minted_to,
      isCopyable: true,
      isHash: (inscription.first_created?.minted_to?.length ?? 0) >= 4,
    }),
    createDetail({
      key: "GenesisTx",
      title: "ordinals.inscriptions.detailsDrawer.genesisTx",
      value: inscription.first_created?.transaction,
      isCopyable: true,
      isHash: (inscription.first_created?.transaction?.length ?? 0) >= 4,
    }),
    createDetail({
      key: "BlockNumber",
      title: "ordinals.inscriptions.detailsDrawer.blockNumber",
      value: inscription.first_created?.block_number,
      isCopyable: true,
    }),
    createDetail({
      key: "ContentType",
      title: "ordinals.inscriptions.detailsDrawer.contentType",
      value: inscription.extra_metadata?.ordinal_details?.content_type,
    }),
    createDetail({
      key: "CreatedDate",
      title: "ordinals.inscriptions.detailsDrawer.createdDate",
      value: createdDate,
    }),
    createDetail({
      key: "SatNumber",
      title: "ordinals.inscriptions.detailsDrawer.satNumber",
      value: inscription.extra_metadata?.ordinal_details?.sat_number,
      isCopyable: true,
    }),
    createDetail({
      key: "SatName",
      title: "ordinals.inscriptions.detailsDrawer.satName",
      value: inscription.extra_metadata?.ordinal_details?.sat_name,
      isCopyable: true,
    }),
    createDetail({
      key: "Location",
      title: "ordinals.inscriptions.detailsDrawer.location",
      value: inscription.extra_metadata?.ordinal_details?.location,
      isCopyable: true,
      isHash: (inscription.extra_metadata?.ordinal_details?.location?.length ?? 0) >= 4,
    }),
    createDetail({
      key: "OutputValue",
      title: "ordinals.inscriptions.detailsDrawer.outputValue",
      value: inscription.extra_metadata?.ordinal_details?.output_value,
    }),
  ].filter(Boolean) as DetailsArray;
}
