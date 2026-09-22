import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  buildHostedPageUrl,
  buildHostedUrl,
  type OpenCardHostedPage,
  type OpenHostedLogin,
} from "@features/flow-pay-card-auth";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { SIDEBAR_VALUE_TO_PATH } from "LLD/components/SideBar/utils";
import { CL_CARD_APP_ID } from "LLD/features/Card/constants";
import { useCardHostedManifests } from "./useCardHostedManifests";
import { whenHostedSessionWiped } from "./useWipeHostedSession";

export type CardHostedPageOpeners = {
  readonly openHostedLogin: OpenHostedLogin;
  readonly openHostedPage: OpenCardHostedPage;
  readonly openLegacyCardApp: () => void;
};

function liveAppRoute(appId: string): string {
  return `/platform/${appId}?returnTo=${encodeURIComponent(SIDEBAR_VALUE_TO_PATH.paytab)}`;
}

function requireManifest(manifest: LiveAppManifest | null | undefined): LiveAppManifest {
  if (!manifest) {
    throw new Error("useCardHostedPageOpeners: the catalog holds no Card manifest");
  }

  return manifest;
}

export function useCardHostedPageOpeners(): CardHostedPageOpeners {
  const navigate = useNavigate();
  const { login, hosted } = useCardHostedManifests();

  const openHostedLogin = useCallback<OpenHostedLogin>(
    async loginUrl => {
      const manifest = requireManifest(login);

      await whenHostedSessionWiped();

      navigate(liveAppRoute(manifest.id), {
        state: { goToURL: buildHostedPageUrl(String(manifest.url), loginUrl) },
      });

      return { type: "pending" };
    },
    [navigate, login],
  );

  const openHostedPage = useCallback<OpenCardHostedPage>(
    async path => {
      const manifest = requireManifest(hosted);

      await whenHostedSessionWiped();

      navigate(liveAppRoute(manifest.id), {
        state: { goToURL: buildHostedUrl(String(manifest.url), path) },
      });
    },
    [navigate, hosted],
  );

  // The legacy Card live app resolves its own manifest on the `/platform/:appId` screen, so it
  // needs no catalog lookup here, and it keeps its own session: nothing to wipe first.
  const openLegacyCardApp = useCallback(() => {
    navigate(liveAppRoute(CL_CARD_APP_ID));
  }, [navigate]);

  return useMemo(
    () => ({ openHostedLogin, openHostedPage, openLegacyCardApp }),
    [openHostedLogin, openHostedPage, openLegacyCardApp],
  );
}
