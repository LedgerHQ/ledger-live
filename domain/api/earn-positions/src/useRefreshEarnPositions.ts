import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { EARN_POSITIONS_TAG, earnPositionsApi } from "./api";

/**
 * Returns a function that invalidates the cached positions of an address, fresh reads included: a
 * read still subscribed to them fetches again, an unused one is dropped.
 */
export function useRefreshEarnPositions(): (address: string) => void {
  const dispatch = useDispatch();
  return useCallback(
    (address: string) => {
      dispatch(earnPositionsApi.util.invalidateTags([{ type: EARN_POSITIONS_TAG, id: address }]));
    },
    [dispatch],
  );
}
