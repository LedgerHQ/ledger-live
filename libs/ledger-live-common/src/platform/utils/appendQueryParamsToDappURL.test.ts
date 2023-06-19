import { LiveAppManifest } from "../types";
import { appendQueryParamsToDappURL } from "./appendQueryParamsToDappURL";

describe("appendQueryParamsToDappURL", () => {
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

    const url = appendQueryParamsToDappURL(manifest, queryString);

    expect(url).toBeInstanceOf(URL);
    expect(url?.toString()).toEqual(
      "https://example.com/?param1=value1&param2=value2&param2=value3",
    );
  });

  it("returns undefined when there is no valid dappUrl in manifest.params", () => {
    const manifest = {
      params: {
        dappUrl: "invalid-url",
      },
    } as LiveAppManifest;
    const queryString = {
      param1: "value1",
      param2: ["value2", "value3"],
    };

    const url = appendQueryParamsToDappURL(manifest, queryString);

    expect(url).toBeUndefined();
  });

  it("returns undefined when there is no dappUrl in manifest.params", () => {
    const manifest = {} as LiveAppManifest;
    const queryString = {
      param1: "value1",
      param2: ["value2", "value3"],
    };

    const url = appendQueryParamsToDappURL(manifest, queryString);

    expect(url).toBeUndefined();
  });
});
