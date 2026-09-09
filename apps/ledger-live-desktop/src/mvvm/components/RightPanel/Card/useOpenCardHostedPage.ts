import { useCallback } from "react";
import { useNavigate } from "react-router";
import useEnv from "@features/platform-env";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";
import { manifestOrigin, useCardHostedManifests } from "./useCardHostedManifests";

const PAY_TAB_PATH = "/paytab";

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function useOpenCardHostedPage(): OpenHostedLogin {
  const navigate = useNavigate();
  const apiUrl = useEnv("CARD_BAANX_API_URL");
  const { login, hosted } = useCardHostedManifests();

  return useCallback(
    async (pageUrl: string) => {
      const isAuthorizePage = originOf(pageUrl) === originOf(apiUrl);
      const manifest = isAuthorizePage ? login : hosted;
      const origin = manifestOrigin(manifest);

      if (!manifest || !origin) {
        throw new Error("useOpenCardHostedPage: the Card manifest carries no usable URL");
      }

      const target = new URL(pageUrl);
      const goToURL = `${origin}${target.pathname}${target.search}`;

      navigate(`/platform/${manifest.id}?returnTo=${encodeURIComponent(PAY_TAB_PATH)}`, {
        state: { goToURL },
      });

      return { type: "pending" };
    },
    [navigate, apiUrl, login, hosted],
  );
}
