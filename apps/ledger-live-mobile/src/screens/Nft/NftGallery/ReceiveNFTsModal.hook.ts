import { useState, useCallback } from "react";

export function useReceiveNFTsModal() {
  const [isModalOpened, setModalOpened] = useState<boolean>(false);

  const openModal = useCallback(() => setModalOpened(true), [setModalOpened]);
  const closeModal = useCallback(() => setModalOpened(false), [setModalOpened]);

  return {
    isModalOpened,
    openModal,
    closeModal,
  };
}
