export type ContactsFeatureConfig = Readonly<{
  isEnabled: boolean;
  showNewBadge: boolean;
}>;

export type ContactsFeatureValue = Readonly<{
  enabled?: boolean;
  params?: Readonly<{
    newFlag?: boolean;
  }>;
}>;

export function resolveContactsFeatureConfig(
  feature: ContactsFeatureValue | null | undefined,
): ContactsFeatureConfig {
  const isEnabled = feature?.enabled === true;

  return {
    isEnabled,
    showNewBadge: isEnabled && feature?.params?.newFlag === true,
  };
}
