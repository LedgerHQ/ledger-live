import { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch } from "LLD/hooks/redux";
import { openReceiveFlow as openReceiveFlowThunk } from "../openReceiveFlow";

export type OpenReceiveFlowParams = Readonly<{
  /** Skips the Modular Dialog when the entry point already knows the account. */
  account?: AccountLike;
  parentAccount?: Account;
  /** Restricts the Modular Dialog to these assets (asset detail page). */
  currencyIds?: readonly string[];
  /** Account the legacy modal preselects; the new flow lets the user pick in the dialog instead. */
  legacyAccount?: Readonly<{ account: AccountLike; parentAccount?: Account }>;
  source: string;
}>;

/** React entry of `openReceiveFlow`; the thunk holds the routing logic. */
export function useOpenReceiveFlow() {
  const dispatch = useDispatch();
  const isRevampEnabled = useFeature("newReceiveFlow")?.enabled === true;

  const openReceiveFlow = useCallback(
    ({ source, ...params }: OpenReceiveFlowParams) =>
      dispatch(openReceiveFlowThunk({ ...params, sourcePage: source })),
    [dispatch],
  );

  return { openReceiveFlow, isRevampEnabled };
}
