import { useNavigation } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { track } from "../../../analytics";
import { NavigatorName } from "../../../const";
import { readOnlyModeEnabledSelector } from "../../../reducers/settings";

export function useReceiveNFTsModal() {
  const [isModalOpened, setModalOpened] = useState<boolean>(false);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const navigation = useNavigation();

  const openModal = useCallback(() => {
    if (readOnlyModeEnabled) {
      navigation.navigate(NavigatorName.BuyDevice);
    } else {
      track("button_clicked", {
        button: "Add my NFTs",
      });
      setModalOpened(true);
    }
  }, [navigation, readOnlyModeEnabled]);

  const closeModal = useCallback(() => setModalOpened(false), [setModalOpened]);

  return {
    isModalOpened,
    openModal,
    closeModal,
  };
}
