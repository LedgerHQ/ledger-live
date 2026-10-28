import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { handleLiveAppDeeplink } from "../handleLiveAppDeeplink";

const config = {
  screens: {
    PlatformApp: "discover/:platform",
    Recover: "recover/:platform",
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
  } = {},
) {
  return handleLiveAppDeeplink({
    url: new URL(link),
    hasCompletedOnboarding: options.hasCompletedOnboarding ?? true,
    isLiveAppProviderInitialized: options.isLiveAppProviderInitialized ?? true,
    localManifests: options.localManifests ?? [],
    remoteManifests: options.remoteManifests ?? [predictions],
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

  it("opens the predictions live app with the link's params", () => {
    expect(
      openDeeplink("ledgerwallet://predictions?eventSlug=abc&ajs_prop_source=x"),
    ).toMatchObject({
      routes: [
        {
          name: "PlatformApp",
          params: {
            platform: "predictions-live-app",
            eventSlug: "abc",
            ajs_prop_source: "x",
            name: "Predictions",
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
      openDeeplink("ledgerwallet://predictions", {
        localManifests: [createManifest("predictions-live-app", "Predictions (local)")],
      }),
    ).toMatchObject({ routes: [{ params: { name: "Predictions (local)" } }] });
  });

  it("ignores a link to an app without manifest", () => {
    expect(openDeeplink("ledgerwallet://predictions", { remoteManifests: [] })).toBeUndefined();
  });

  it("opens the live app screen without checking the manifest on a cold start", () => {
    expect(
      openDeeplink("ledgerwallet://predictions?eventSlug=abc", {
        isLiveAppProviderInitialized: false,
        remoteManifests: [],
      }),
    ).toMatchObject({
      routes: [
        {
          name: "PlatformApp",
          params: { platform: "predictions-live-app", eventSlug: "abc" },
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
