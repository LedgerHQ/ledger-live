import { useCallback } from "react";
import { useNavigate } from "react-router";
import useEnv from "@features/platform-env";
import { buildHostedPageUrl, type OpenHostedLogin } from "@features/flow-pay-card-auth";
import { useCardHostedManifests } from "./useCardHostedManifests";

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

      if (!manifest) {
        throw new Error("useOpenCardHostedPage: the catalog holds no Card manifest");
      }

      const goToURL = buildHostedPageUrl(String(manifest.url), pageUrl);

      navigate(`/platform/${manifest.id}?returnTo=${encodeURIComponent(PAY_TAB_PATH)}`, {
        state: { goToURL },
      });

      return { type: "pending" };
    },
    [navigate, apiUrl, login, hosted],
  );
}
