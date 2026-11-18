import { useCallback } from "react";
import { useStore } from "~/context/hooks";
import {
  getReceiveRoute,
  type ReceiveConfirmationParams,
  type ReceiveRoute,
} from "../utils/getReceiveRoute";

/** `getReceiveRoute` on the store's state at the time of the navigation. */
export function useReceiveRoute(): (params: ReceiveConfirmationParams) => ReceiveRoute {
  const store = useStore();
  return useCallback(params => getReceiveRoute(params, store.getState()), [store]);
}
