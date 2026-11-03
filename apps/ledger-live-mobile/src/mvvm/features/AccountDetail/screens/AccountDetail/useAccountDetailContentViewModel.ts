import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { accountTrackingProps } from "@features/flow-account-detail";
import { resolveEmptyState, type AccountEmptyStateModel } from "@features/flow-account-detail-hero";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
import {
  useAccountHeroPort,
  type AccountHeroPortResult,
} from "./components/Hero/useAccountHeroPort";

export type AccountDetailContentViewModel = Readonly<{
  hero: AccountHeroPortResult;
  emptyState: AccountEmptyStateModel;
  /** The page view: `source` is added by the analytics from the previous screen. */
  pageView: Readonly<{
    currency: string;
    isTokenAccount: boolean;
    operationsCount: number;
    hasTokens: boolean;
  }>;
}>;

export function useAccountDetailContentViewModel(account: Account): AccountDetailContentViewModel {
  const hero = useAccountHeroPort(account);
  const { hasActivity, availability } = hero.port;
  const emptyState = useMemo(
    () => resolveEmptyState({ hasActivity, availability }),
    [hasActivity, availability],
  );
  const pageView = useMemo(
    () => ({
      ...accountTrackingProps(getAccountTrackingFacts(account)),
      operationsCount: account.operationsCount,
      hasTokens: (account.subAccounts?.length ?? 0) > 0,
    }),
    [account],
  );
  return { hero, emptyState, pageView };
}
