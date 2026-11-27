import type { LegacyAccountContext } from "../../coin-modules/types";

/** The legacy id keeps the view key as its custom data. */
export const aleoLegacyAccountContext: LegacyAccountContext = {
  toCustomData: ({ viewKey }) => viewKey,
  fromCustomData: viewKey => ({ viewKey }),
};
