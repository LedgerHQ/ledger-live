import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { hideOrdinalsAsset, unhideOrdinalsAsset } from "~/renderer/actions/settings";
import { hiddenOrdinalsAssetSelector } from "~/renderer/reducers/settings";

export const useHideInscriptions = () => {
  const dispatch = useDispatch();
  const hiddenOrdinalAssets = useSelector(hiddenOrdinalsAssetSelector);

  const filterInscriptions = (inscriptions: SimpleHashNft[]) => {
    return inscriptions.filter(inscription => {
      return !hiddenOrdinalAssets.includes(
        String(inscription.extra_metadata?.ordinal_details?.inscription_id),
      );
    });
  };

  const hideInscription = (inscriptionId: string) => {
    dispatch(hideOrdinalsAsset(inscriptionId));
  };

  const unHideInscription = (inscriptionId: string) => {
    dispatch(unhideOrdinalsAsset(inscriptionId));
  };

  const openConfirmHideInscriptionModal = (
    inscriptionName: string,
    inscriptionId: string,
    onModalClose: () => void,
  ) => {
    dispatch(
      openModal("MODAL_HIDE_INSCRIPTION", {
        inscriptionName,
        inscriptionId,
        onClose: () => onModalClose(),
      }),
    );
  };

  return {
    filterInscriptions,
    hideInscription,
    unHideInscription,
    openConfirmHideInscriptionModal,
    hiddenOrdinalAssets,
  };
};
