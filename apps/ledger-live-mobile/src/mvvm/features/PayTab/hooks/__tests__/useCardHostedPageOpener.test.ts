import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { buildHostedUrl, buildTopUpPath } from "@features/flow-pay-card-auth";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const MANIFEST = {
  id: "baanx-hosted-url",
  url: "https://ledger-ew1uat.baanxapi.com",
} as AppManifest;

describe("the hosted page URL the opener hands the webview", () => {
  it("keeps the page and the US app id that the path builder set", () => {
    const goToURL = buildHostedUrl(String(MANIFEST.url), buildTopUpPath("LEDGERUS"));

    expect(goToURL).toBe("https://ledger-ew1uat.baanxapi.com/topup?app_id=LEDGERUS");
    // The webview drops `goToURL` when it fails the same-domain check, landing the holder on the
    // Baanx root instead of top-up. Same origin as the manifest is what keeps it.
    expect(getInitialURL({ goToURL }, MANIFEST)).toBe(goToURL);
  });

  it("opens top up with no app id for a holder outside the US", () => {
    const goToURL = buildHostedUrl(String(MANIFEST.url), buildTopUpPath(null));

    expect(goToURL).toBe("https://ledger-ew1uat.baanxapi.com/topup");
    expect(getInitialURL({ goToURL }, MANIFEST)).toBe(goToURL);
  });
});
