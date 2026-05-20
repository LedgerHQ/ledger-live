import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { openDisplayFlowDialog } from "~/renderer/reducers/displayFlow";
import { useDisplayPOCFeature } from "./useDisplayPOCFeature";

type OpenDisplayFlowParams = {
  account?: AccountLike;
  parentAccount?: Account;
};

/**
 * Single entry-point for opening the Display POC dialog.
 *
 * The hook gates the call with the `showDisplayPOC` feature flag and only
 * dispatches the redux open action when the account's family is allowed.
 * Attendees plug this into any button (e.g. account header).
 */
export function useOpenDisplayFlow() {
  const dispatch = useDispatch();
  const { isEnabledForFamily, getFamilyFromAccount } = useDisplayPOCFeature();

  return useCallback(
    (params?: OpenDisplayFlowParams) => {
      const family = getFamilyFromAccount(params?.account, params?.parentAccount ?? null);
      if (!isEnabledForFamily(family)) return;
      dispatch(openDisplayFlowDialog({ params }));
    },
    [dispatch, isEnabledForFamily, getFamilyFromAccount],
  );
}
