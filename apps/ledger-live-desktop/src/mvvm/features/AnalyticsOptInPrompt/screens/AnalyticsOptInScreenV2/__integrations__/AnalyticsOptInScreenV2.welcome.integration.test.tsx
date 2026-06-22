import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { track } from "~/renderer/analytics/segment";
import { Welcome } from "LLD/features/Onboarding/screens/Welcome";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("LLD/features/Onboarding/screens/Welcome/hooks/useVideoCarousel", () => ({
  useVideoCarousel: () => ({
    currentSlide: 0,
    isVisible: true,
    videoDurations: [5000],
    VIDEO_SLIDES: [{ id: "slide-1", title: "Welcome", video: "video.webm" }],
    videoRefs: { current: [] },
    containerRef: { current: null },
    handleVideoLoadedMetadata: jest.fn(),
    handleVideoEnded: jest.fn(),
  }),
}));

const analyticsPromptEnabledOverrides = {
  ...FEATURE_FLAGS_INITIAL_STATE.overrides,
  lldAnalyticsOptInPrompt: {
    enabled: true,
    params: {
      variant: "A",
      entryPoints: ["Onboarding"],
    },
  },
  lwdAnalyticsOptInScreenV2: {
    enabled: true,
  },
};

const featureFlagsState = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: analyticsPromptEnabledOverrides,
  resolved: {
    ...FEATURE_FLAGS_DEFAULTS,
    ...analyticsPromptEnabledOverrides,
  },
};

describe("AnalyticsOptInScreenV2 on Welcome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open screen B when user starts onboarding and accept continues flow", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: featureFlagsState,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

    expect(await screen.findByTestId("analytics-opt-in-screen-b")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    await waitFor(() => {
      expect(screen.queryByTestId("analytics-opt-in-screen-b")).not.toBeInTheDocument();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Accept all",
        variant: "B",
        entryPoint: "Onboarding",
      }),
      true,
    );
  });

  it("should open preferences when user chooses Set preferences", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: featureFlagsState,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));
    await user.click(await screen.findByRole("link", { name: "Set preferences" }));

    expect(await screen.findByTestId("analytics-opt-in-screen-b-preferences")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
  });

  it("should refuse all and close the screen", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: featureFlagsState,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));
    await user.click(await screen.findByRole("button", { name: "Refuse all" }));

    await waitFor(() => {
      expect(screen.queryByTestId("analytics-opt-in-screen-b")).not.toBeInTheDocument();
    });
  });
});
