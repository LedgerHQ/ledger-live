import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { resolveEmptyState, type AccountEmptyStateModel } from "@features/flow-account-detail-hero";
import {
  useAccountHeroPort,
  type AccountHeroPortResult,
} from "../components/Hero/useAccountHeroPort";

export type AccountDetailContentViewModel = Readonly<{
  hero: AccountHeroPortResult;
  emptyState: AccountEmptyStateModel;
}>;

export function useAccountDetailContentViewModel(account: Account): AccountDetailContentViewModel {
  const hero = useAccountHeroPort(account);
  const { hasActivity, availability } = hero.port;
  const emptyState = useMemo(
    () => resolveEmptyState({ hasActivity, availability }),
    [hasActivity, availability],
  );
  return { hero, emptyState };
}
