import type { SettingId } from "./hiddenSettings";

export type ApolloHiddenSettingsFlag = Readonly<{
  enabled: boolean;
  params?: Readonly<{ hideMyLedgerProvider?: boolean; hideMockAppUpdate?: boolean }>;
}>;

/**
 * Rows to hide: all of them on Apollo, and elsewhere the ones whose param is `true` while the flag
 * is on, since Firebase cannot target Apollo.
 */
export function getApolloHiddenSettings({
  isApollo,
  flag,
}: Readonly<{ isApollo: boolean; flag?: ApolloHiddenSettingsFlag | null }>): SettingId[] {
  const params = flag?.enabled ? flag.params : undefined;
  const hiddenSettings: SettingId[] = [];
  if (isApollo || params?.hideMyLedgerProvider === true) hiddenSettings.push("myLedgerProvider");
  if (isApollo || params?.hideMockAppUpdate === true) hiddenSettings.push("mockAppUpdate");
  return hiddenSettings;
}
