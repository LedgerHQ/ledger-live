import { LiveAppManifest } from "../types";
import { appendQueryParamsToManifestURL } from "./appendQueryParamsToManifestURL";

describe("appendQueryParamsToManifestURL", () => {
  it("appends query parameters to a valid dappUrl", () => {
    const manifest = {
      params: {
        dappUrl: "https://example.com/",
      },
    } as LiveAppManifest;
    const queryString = {
      param1: "value1",
      param2: ["value2", "value3"],
    };

    const url = appendQueryParamsToManifestURL(manifest, queryString);

    // expect(url).toBeInstanceOf(URL);
    expect(url?.toString()).toEqual(
      "https://example.com/?param1=value1&param2=value2&param2=value3",
    );
  });

  it("returns URL when manifest is for a Live App without a dappUrl in manifest.params", () => {
    const manifest = {
      id: "mock-id",
      url: "https://example.com/?manifestParam=existingValue",
    } as LiveAppManifest;
    const queryString = {
      param1: "value1",
      param2: ["value2", "value3"],
    };

    const url = appendQueryParamsToManifestURL(manifest, queryString);

    expect(url?.toString()).toBe(
      "https://example.com/?manifestParam=existingValue&param1=value1&param2=value2&param2=value3",
    );
  });

  it("returns undefined when url is invalid in live app in manifest.params", () => {
    const manifest = {
      url: "invalid-url",
    } as LiveAppManifest;
    const queryString = {
      param1: "value1",
      param2: ["value2", "value3"],
    };

    const url = appendQueryParamsToManifestURL(manifest, queryString);

    expect(url).toBeUndefined();
  });
});
