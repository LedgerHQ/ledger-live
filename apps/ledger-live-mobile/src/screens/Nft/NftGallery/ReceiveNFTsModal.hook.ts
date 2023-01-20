import { useState, useCallback } from "react";
import { track } from "../../../analytics";

type Props = {
  hasNFTS: boolean;
};

export function useReceiveNFTsModal(props: Props) {
  const [isModalOpened, setModalOpened] = useState<boolean>(false);

  const openModal = useCallback(() => {
    track("button_clicked", {
      button: props.hasNFTS ? "Add new" : "Receive NFTs",
      drawer: "Confirm Receive NFT",
    });
    setModalOpened(true);
  }, [props.hasNFTS]);

  const closeModal = useCallback(() => setModalOpened(false), [setModalOpened]);

  return {
    isModalOpened,
    openModal,
    closeModal,
  };
}
