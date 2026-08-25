import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { ContextMenu } from "../components/ContextMenu";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
}));

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function renderMyWalletProfile({
  ffEnabled = true,
  profileBannerEnabled = true,
  isOptIn = true,
  optedOutLink,
  devicesModelList = [DeviceModelId.nanoS],
}: {
  ffEnabled?: boolean;
  profileBannerEnabled?: boolean;
  isOptIn?: boolean;
  optedOutLink?: string;
  devicesModelList?: DeviceModelId[];
} = {}) {
  const defaultParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

  if (!defaultParams) {
    throw new Error("Expected large-screen upsell default params");
  }

  const utils = render(<ContextMenu />, {
    initialState: {
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: ffEnabled,
          params: {
            ...defaultParams,
            banners: {
              ...defaultParams.banners,
              profile: profileBannerEnabled,
            },
            opted_in: {
              ...defaultParams.opted_in,
              enabled: true,
              link: "https://example.com/optInCta",
            },
            opted_out: {
              ...defaultParams.opted_out,
              link: optedOutLink ?? "https://example.com/optOutCta",
            },
          },
        },
      }),
      settings: {
        shareAnalytics: true,
        sharePersonalizedRecommandations: isOptIn,
        devicesModelList,
        anonymousUserNotifications: {},
      },
      postOnboarding: {
        onboardingDate: daysAgoIso(0),
      },
    },
  });
  await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
  await waitFor(() => {
    expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
  });
  return utils;
}

function openedCtaUrl(): URL {
  return new URL(String(jest.mocked(openURL).mock.calls[0][0]));
}

describe("My Wallet LNS upsell profile banner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should replace Explore with the compact banner for nanoS when the profile placement is enabled", async () => {
    await renderMyWalletProfile();

    expect(screen.getByText("Upgrade your Device")).toBeVisible();
    expect(screen.getByText("Bigger screen, better security. Enjoy 20%.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Explore" })).toBeVisible();
    expect(screen.queryByText("Explore all Ledger devices")).toBeNull();
  });

  it("should keep Explore for stax", async () => {
    await renderMyWalletProfile({ devicesModelList: [DeviceModelId.stax] });

    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
    expect(screen.queryByText("Upgrade your Device")).toBeNull();
  });

  it("should keep Explore when a nanoS is paired with a large-screen device", async () => {
    await renderMyWalletProfile({ devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax] });

    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
    expect(screen.queryByText("Upgrade your Device")).toBeNull();
  });

  it("should keep Explore when the feature flag is off", async () => {
    await renderMyWalletProfile({ ffEnabled: false });

    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
    expect(screen.queryByText("Upgrade your Device")).toBeNull();
  });

  it("should keep Explore when banners.profile is off", async () => {
    await renderMyWalletProfile({ profileBannerEnabled: false });

    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
    expect(screen.queryByText("Upgrade your Device")).toBeNull();
  });

  it("should show the compact banner when personalized recommendations are off", async () => {
    await renderMyWalletProfile({ isOptIn: false });

    expect(screen.getByText("More security. More control")).toBeVisible();
    expect(screen.getByText("Learn more about security features.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Explore" })).toBeVisible();
    expect(screen.queryByText("Explore all Ledger devices")).toBeNull();
  });

  it("should fire a Profile page event when the banner is shown", async () => {
    await renderMyWalletProfile();

    expect(trackPage).toHaveBeenCalledWith(
      "Profile",
      undefined,
      {
        name: "Profile",
        deviceModel: "lns",
        personalRecoOptIn: true,
        offerType: "discount",
        platform: "lwd",
      },
      true,
      false,
    );
  });

  it("should open the opted_out URL and fire opted-out tracking when personalized recommendations are off", async () => {
    const { user } = await renderMyWalletProfile({ isOptIn: false });

    await user.click(screen.getByRole("button", { name: "Explore" }));

    const openedUrl = openedCtaUrl();
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optOutCta");
    expect(openedUrl.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
    );

    const sharedProps = {
      deviceModel: "lns",
      personalRecoOptIn: false,
      offerType: "none",
      platform: "lwd",
    };

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "upgrade",
      page: "Profile",
      ...sharedProps,
    });
    expect(track).toHaveBeenCalledWith("deeplink_clicked", {
      page: "Profile",
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...sharedProps,
    });
  });

  it("should fall back to the opted_in shop link when opted_out has no link", async () => {
    const { user } = await renderMyWalletProfile({
      isOptIn: false,
      optedOutLink: "   ",
    });

    await user.click(screen.getByRole("button", { name: "Explore" }));

    const openedUrl = openedCtaUrl();
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optInCta");
  });

  it("should open the profile_cta URL and fire button_clicked plus deeplink_clicked", async () => {
    const { user } = await renderMyWalletProfile();

    await user.click(screen.getByRole("button", { name: "Explore" }));

    const openedUrl = openedCtaUrl();
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optInCta");
    expect(openedUrl.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
    );

    const sharedProps = {
      deviceModel: "lns",
      personalRecoOptIn: true,
      offerType: "discount",
      platform: "lwd",
    };

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "upgrade",
      page: "Profile",
      ...sharedProps,
    });
    expect(track).toHaveBeenCalledWith("deeplink_clicked", {
      page: "Profile",
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...sharedProps,
    });
  });
});
