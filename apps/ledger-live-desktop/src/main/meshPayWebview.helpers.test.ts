import {
  isMeshConnectUrl,
  isMeshPayOAuthFrameUrl,
  isMeshPayPopupUrl,
  stripMeshEmbedRestrictions,
} from "./meshPayWebview.helpers";

describe("meshPayWebview.helpers", () => {
  it("allows mesh and coinbase popup urls", () => {
    expect(isMeshPayPopupUrl("https://sandbox-web.meshconnect.com/link")).toBe(true);
    expect(isMeshPayPopupUrl("https://www.coinbase.com/oauth")).toBe(true);
    expect(isMeshPayPopupUrl("https://example.com")).toBe(false);
  });

  it("detects coinbase oauth frame urls", () => {
    expect(isMeshPayOAuthFrameUrl("https://login.coinbase.com/signin")).toBe(true);
    expect(isMeshPayOAuthFrameUrl("https://sandbox-web.meshconnect.com/link")).toBe(false);
  });

  it("detects meshconnect urls", () => {
    expect(isMeshConnectUrl("https://sandbox-web.meshconnect.com/link")).toBe(true);
    expect(isMeshConnectUrl("https://example.com")).toBe(false);
  });

  it("strips frame embedding restrictions", () => {
    const stripped = stripMeshEmbedRestrictions({
      "X-Frame-Options": ["SAMEORIGIN"],
      "Content-Security-Policy": ["default-src 'self'; frame-ancestors 'none';"],
    });

    expect(stripped["X-Frame-Options"]).toBeUndefined();
    expect(stripped["Content-Security-Policy"]).toEqual(["default-src 'self'; "]);
  });
});
