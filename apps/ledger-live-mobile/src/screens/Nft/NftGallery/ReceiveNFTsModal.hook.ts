import { useState, useCallback } from "react";
import { track } from "../../../analytics";

export function useReceiveNFTsModal() {
  const [isModalOpened, setModalOpened] = useState<boolean>(false);

  const openModal = useCallback(() => {
    track("button_clicked", {
      button: "Add my NFTs",
    });
    setModalOpened(true);
  }, [setModalOpened]);
  const closeModal = useCallback(() => setModalOpened(false), [setModalOpened]);

  return {
    isModalOpened,
    openModal,
    closeModal,
  };
}
