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
import { useCardHostedManifests } from "./useCardHostedManifests";
import { wipeHostedSessionForManifest } from "./useWipeHostedSession";

export type CardHostedPageOpeners = {
  readonly openHostedLogin: OpenHostedLogin;
  readonly openHostedPage: OpenCardHostedPage;
};

function manifestRoute(manifest: LiveAppManifest): string {
  return `/platform/${manifest.id}?returnTo=${encodeURIComponent(SIDEBAR_VALUE_TO_PATH.paytab)}`;
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

      // A cold start opens the login without ever crossing a sign-in change, so the wipe has to
      // happen here too, or the provider signs the previous holder straight back in.
      await wipeHostedSessionForManifest(manifest);

      navigate(manifestRoute(manifest), {
        state: { goToURL: buildHostedPageUrl(String(manifest.url), loginUrl) },
      });

      return { type: "pending" };
    },
    [navigate, login],
  );

  const openHostedPage = useCallback<OpenCardHostedPage>(
    async path => {
      const manifest = requireManifest(hosted);

      navigate(manifestRoute(manifest), {
        state: { goToURL: buildHostedUrl(String(manifest.url), path) },
      });
    },
    [navigate, hosted],
  );

  return useMemo(() => ({ openHostedLogin, openHostedPage }), [openHostedLogin, openHostedPage]);
}
