import { useCallback } from "react";
import { useStore } from "~/context/hooks";
import { getReceiveScreen, type ReceiveConfirmationParams } from "../utils/getReceiveScreen";

/** `getReceiveScreen` bound to the store: `navigate(NavigatorName.ReceiveFunds, receiveScreen(params))`. */
export function useReceiveScreen() {
  const store = useStore();
  return useCallback(
    (params: ReceiveConfirmationParams) => getReceiveScreen(params, store.getState()),
    [store],
  );
}
