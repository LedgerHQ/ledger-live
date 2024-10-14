import { useFetchOrdinalByTokenId } from "@ledgerhq/live-nft-react";

type Props = {
  inscriptionId: string;
  unHideInscription: () => void;
};
export const useRowModel = ({ inscriptionId, unHideInscription }: Props) => {
  const { data, isLoading } = useFetchOrdinalByTokenId(inscriptionId);

  const inscriptionName = data?.name || data?.contract.name || inscriptionId;
  const previewUri = data?.previews?.image_large_url || data?.image_url;

  return {
    inscriptionName,
    previewUri,
    isLoading,
    unHideInscription,
  };
};
