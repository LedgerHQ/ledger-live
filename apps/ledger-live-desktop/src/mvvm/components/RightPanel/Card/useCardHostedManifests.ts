import { useMemo } from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";

const DEFAULT_LOGIN_MANIFEST_ID = "baanx-login-url-stg";
const DEFAULT_HOSTED_MANIFEST_ID = "baanx-hosted-url-stg";

type ResolvedManifest = LiveAppManifest | null | undefined;

export type CardHostedManifests = {
  readonly login: ResolvedManifest;
  readonly hosted: ResolvedManifest;
};

export function useCardHostedManifests(): CardHostedManifests {
  const login = useLiveAppManifest(
    process.env.CARD_BAANX_LOGIN_MANIFEST_ID || DEFAULT_LOGIN_MANIFEST_ID,
  );
  const hosted = useLiveAppManifest(
    process.env.CARD_BAANX_HOSTED_MANIFEST_ID || DEFAULT_HOSTED_MANIFEST_ID,
  );

  return useMemo(() => ({ login, hosted }), [login, hosted]);
}
