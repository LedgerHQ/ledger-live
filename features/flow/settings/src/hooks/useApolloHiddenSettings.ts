import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { SettingId } from "../logic/hiddenSettings";
import { getApolloHiddenSettings } from "../logic/apolloHiddenSettings";

/** Rows to hide: all of them on Apollo, and elsewhere the ones the `newSettings` params turn on. */
export function useApolloHiddenSettings(isApollo: boolean): readonly SettingId[] {
  const flag = useFeature("newSettings");
  const enabled = flag?.enabled ?? false;
  const hideMyLedgerProvider = flag?.params?.hideMyLedgerProvider;
  const hideMockAppUpdate = flag?.params?.hideMockAppUpdate;

  return useMemo(
    () =>
      getApolloHiddenSettings({
        isApollo,
        flag: { enabled, params: { hideMyLedgerProvider, hideMockAppUpdate } },
      }),
    [isApollo, enabled, hideMyLedgerProvider, hideMockAppUpdate],
  );
}
