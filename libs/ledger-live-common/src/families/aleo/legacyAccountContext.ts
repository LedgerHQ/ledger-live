import type { LegacyAccountContext } from "../../coin-modules/types";

/** The legacy id keeps the view key as its custom data. */
export const aleoLegacyAccountContext: LegacyAccountContext = {
  toLegacyFields: ({ viewKey }) => ({ customData: viewKey }),
  fromLegacyFields: ({ customData }) => (customData ? { viewKey: customData } : undefined),
};
