import { useModularDrawerVisibility } from "./useModularDrawerVisibility";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { selectCurrency } from "../utils/selectCurrency";
import { ModularLocation } from "../enums";

export function useOpenAssetFlow(modularLocation: ModularLocation) {
  const dispatch = useDispatch();
  const { isModularDrawerVisible } = useModularDrawerVisibility();
  const openAssetFlow = useCallback(async () => {
    if (isModularDrawerVisible(modularLocation)) {
      await selectCurrency();
    } else {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
    }
  }, [dispatch, isModularDrawerVisible, modularLocation]);

  return {
    openAssetFlow,
  };
}
