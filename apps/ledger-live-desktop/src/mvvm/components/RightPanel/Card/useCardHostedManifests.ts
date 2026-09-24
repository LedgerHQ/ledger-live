import { useMemo } from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import useEnv from "@features/platform-env";

type ResolvedManifest = LiveAppManifest | null | undefined;

export type CardHostedManifests = {
  readonly login: ResolvedManifest;
  readonly hosted: ResolvedManifest;
};

export function useCardHostedManifests(): CardHostedManifests {
  const loginManifestId = useEnv("CARD_BAANX_LOGIN_MANIFEST_ID");
  const hostedManifestId = useEnv("CARD_BAANX_HOSTED_MANIFEST_ID");

  const login = useLiveAppManifest(loginManifestId);
  const hosted = useLiveAppManifest(hostedManifestId);

  return useMemo(() => ({ login, hosted }), [login, hosted]);
}
