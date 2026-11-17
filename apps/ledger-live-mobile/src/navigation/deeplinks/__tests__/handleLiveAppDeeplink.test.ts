import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { handleLiveAppDeeplink } from "../handleLiveAppDeeplink";

const config = {
  screens: {
    PlatformApp: "discover/:platform",
    Recover: "recover/:platform",
    PredictionsNavigator: { screens: { Predictions: "predictions" } },
  },
};

const createManifest = (id: string, name: string) => ({ id, name }) as LiveAppManifest;

const predictions = createManifest("predictions-live-app", "Predictions");

function openDeeplink(
  link: string,
  options: {
    hasCompletedOnboarding?: boolean;
    isLiveAppProviderInitialized?: boolean;
    localManifests?: LiveAppManifest[];
    remoteManifests?: LiveAppManifest[];
    isPredictionsEnabled?: boolean;
    predictionsManifestId?: string;
  } = {},
) {
  return handleLiveAppDeeplink({
    url: new URL(link),
    hasCompletedOnboarding: options.hasCompletedOnboarding ?? true,
    isLiveAppProviderInitialized: options.isLiveAppProviderInitialized ?? true,
    localManifests: options.localManifests ?? [],
    remoteManifests: options.remoteManifests ?? [predictions],
    isPredictionsEnabled: options.isPredictionsEnabled ?? true,
    predictionsManifestId: options.predictionsManifestId,
    config,
  });
}

describe("handleLiveAppDeeplink", () => {
  it("opens the live app of a discover link", () => {
    expect(
      openDeeplink("ledgerwallet://discover/predictions-live-app?eventSlug=abc"),
    ).toMatchObject({
      routes: [
        {
          name: "PlatformApp",
          params: { platform: "predictions-live-app", eventSlug: "abc", name: "Predictions" },
        },
      ],
    });
  });

  it("opens the predictions screen with the link's params", () => {
    expect(
      openDeeplink("ledgerwallet://predictions?eventSlug=abc&ajs_prop_source=x"),
    ).toMatchObject({
      routes: [
        {
          name: "PredictionsNavigator",
          state: {
            routes: [{ name: "Predictions", params: { eventSlug: "abc", ajs_prop_source: "x" } }],
          },
        },
      ],
    });
  });

  it("uses the manifest's id casing", () => {
    expect(openDeeplink("ledgerwallet://discover/Predictions-Live-App")).toMatchObject({
      routes: [{ params: { platform: "predictions-live-app" } }],
    });
  });

  it("prefers a local manifest over the remote one", () => {
    expect(
      openDeeplink("ledgerwallet://discover/predictions-live-app", {
        localManifests: [createManifest("predictions-live-app", "Predictions (local)")],
      }),
    ).toMatchObject({ routes: [{ params: { name: "Predictions (local)" } }] });
  });

  it("opens the predictions screen when only the manifest set by the flag is available", () => {
    expect(
      openDeeplink("ledgerwallet://predictions?eventSlug=abc", {
        remoteManifests: [createManifest("predictions-live-app-stg", "Predictions (staging)")],
        predictionsManifestId: "predictions-live-app-stg",
      }),
    ).toMatchObject({
      routes: [
        {
          name: "PredictionsNavigator",
          state: { routes: [{ name: "Predictions", params: { eventSlug: "abc" } }] },
        },
      ],
    });
  });

  it("checks the default predictions manifest when the flag sets an empty one", () => {
    expect(openDeeplink("ledgerwallet://predictions", { predictionsManifestId: "" })).toMatchObject(
      { routes: [{ name: "PredictionsNavigator" }] },
    );
  });

  it("ignores a link to an app without manifest", () => {
    expect(openDeeplink("ledgerwallet://predictions", { remoteManifests: [] })).toBeUndefined();
  });

  it("opens the predictions screen without checking the manifest on a cold start", () => {
    expect(
      openDeeplink("ledgerwallet://predictions?eventSlug=abc", {
        isLiveAppProviderInitialized: false,
        remoteManifests: [],
      }),
    ).toMatchObject({
      routes: [
        {
          name: "PredictionsNavigator",
          state: { routes: [{ name: "Predictions", params: { eventSlug: "abc" } }] },
        },
      ],
    });
  });

  it("keeps a URL-valued param on a cold start", () => {
    expect(
      openDeeplink(
        "ledgerwallet://discover/predictions-live-app?goToURL=https://example.com/page&eventSlug=abc",
        { isLiveAppProviderInitialized: false },
      ),
    ).toMatchObject({
      routes: [{ params: { goToURL: "https://example.com/page", eventSlug: "abc" } }],
    });
  });

  it("ignores a predictions link when the predictions flag is off", () => {
    expect(
      openDeeplink("ledgerwallet://predictions", { isPredictionsEnabled: false }),
    ).toBeUndefined();
  });

  it("ignores a predictions link on a cold start when the predictions flag is off", () => {
    expect(
      openDeeplink("ledgerwallet://predictions", {
        isLiveAppProviderInitialized: false,
        isPredictionsEnabled: false,
      }),
    ).toBeUndefined();
  });

  it("ignores the link before onboarding is completed", () => {
    expect(
      openDeeplink("ledgerwallet://predictions", { hasCompletedOnboarding: false }),
    ).toBeUndefined();
  });

  it("opens protect apps before onboarding is completed", () => {
    expect(
      openDeeplink("ledgerwallet://recover/protect-prod", {
        hasCompletedOnboarding: false,
        remoteManifests: [createManifest("protect-prod", "Recover")],
      }),
    ).toMatchObject({
      routes: [{ name: "Recover", params: { platform: "protect-prod", name: "Recover" } }],
    });
  });
});
