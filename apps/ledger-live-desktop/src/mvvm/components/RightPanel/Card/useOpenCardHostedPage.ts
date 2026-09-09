import { useCallback } from "react";
import { useNavigate } from "react-router";
import useEnv from "@features/platform-env";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";

const PAY_TAB_PATH = "/paytab";

export function useOpenCardHostedPage(): OpenHostedLogin {
  const navigate = useNavigate();
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const loginManifestId = useEnv("CARD_LOGIN_MANIFEST_ID");
  const hostedManifestId = useEnv("CARD_HOSTED_MANIFEST_ID");

  return useCallback(
    async (pageUrl: string) => {
      const manifestId = pageUrl.startsWith(hostedUiUrl) ? hostedManifestId : loginManifestId;

      navigate(`/platform/${manifestId}`, {
        state: { goToURL: pageUrl, returnTo: PAY_TAB_PATH },
      });

      return { type: "pending" };
    },
    [navigate, hostedUiUrl, hostedManifestId, loginManifestId],
  );
}
