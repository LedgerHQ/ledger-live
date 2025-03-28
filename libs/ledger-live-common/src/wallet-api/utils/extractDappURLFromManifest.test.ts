import { LiveAppManifest } from "../types";
import { extractDappURLFromManifest } from "./extractDappURLFromManifest";

describe("extractDappURLFromManifest", () => {
  it("returns a valid URL when a valid dappUrl is in manifest.params", () => {
    const manifest = {
      params: {
        dappUrl: "https://example.com/",
      },
    };
    const url = extractDappURLFromManifest(manifest as LiveAppManifest);

    expect(url).toBeInstanceOf(URL);
    expect(url?.toString()).toEqual(manifest.params.dappUrl);
  });

  it("returns undefined when the dappUrl is not a valid URL", () => {
    const manifest = {
      params: {
        dappUrl: "invalid-url",
      },
    };
    const url = extractDappURLFromManifest(manifest as LiveAppManifest);

    expect(url).toBeUndefined();
  });

  it("returns undefined when there is no dappUrl in manifest.params", () => {
    const manifest = {
      params: {
        dappName: "foo",
      },
    };
    const url = extractDappURLFromManifest(manifest as LiveAppManifest);

    expect(url).toBeUndefined();
  });
});
