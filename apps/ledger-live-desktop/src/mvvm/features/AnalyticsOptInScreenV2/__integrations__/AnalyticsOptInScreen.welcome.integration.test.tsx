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

const buildFeatureFlagsState = (overrides: Record<string, unknown>) => ({
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: {
    ...FEATURE_FLAGS_INITIAL_STATE.overrides,
    ...overrides,
  },
  resolved: {
    ...FEATURE_FLAGS_DEFAULTS,
    ...overrides,
  },
});

const v2EnabledFeatureFlags = buildFeatureFlagsState({
  lwdAnalyticsOptInScreenV2: { enabled: true },
});

describe("AnalyticsOptInScreen on Welcome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!document.getElementById("modals")) {
      const modals = document.createElement("div");
      modals.id = "modals";
      document.body.appendChild(modals);
    }
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("should open the v2 screen when the v2 flag is enabled without lldAnalyticsOptInPrompt", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: v2EnabledFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

    expect(await screen.findByTestId("analytics-opt-in-screen")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    await waitFor(() => {
      expect(screen.queryByTestId("analytics-opt-in-screen")).not.toBeInTheDocument();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Accept all",
        entryPoint: "Onboarding",
        flow: "consent onboarding",
      }),
      true,
    );
    expect(track).not.toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        variant: expect.anything(),
      }),
      expect.anything(),
    );
  });

  it("should open preferences when user chooses Set preferences", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: v2EnabledFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));
    await user.click(await screen.findByRole("button", { name: "Set preferences" }));

    expect(await screen.findByTestId("analytics-opt-in-screen-preferences")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
    expect(screen.getByTestId("analytics-opt-in-screen")).toBeInTheDocument();
  });

  it("should return to the main screen when user closes preferences", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: v2EnabledFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));
    await user.click(await screen.findByRole("button", { name: "Set preferences" }));
    expect(await screen.findByTestId("analytics-opt-in-screen-preferences")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "components.navBar.goBackAriaLabel" }));

    await waitFor(() => {
      expect(screen.queryByTestId("analytics-opt-in-screen-preferences")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("analytics-opt-in-screen")).toBeVisible();
    expect(screen.getByRole("button", { name: "Accept all" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Set preferences" })).toBeVisible();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Close",
        page: "Analytics opt-in screen preferences",
      }),
      true,
    );
  });

  it("should keep the legacy drawer when the v2 flag is disabled and lldAnalyticsOptInPrompt is enabled", async () => {
    const legacyFeatureFlags = buildFeatureFlagsState({
      lldAnalyticsOptInPrompt: {
        enabled: true,
        params: {
          variant: "A",
          entryPoints: ["Onboarding"],
        },
      },
      lwdAnalyticsOptInScreenV2: { enabled: false },
    });

    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: legacyFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

    expect(await screen.findByTestId("accept-analytics-button")).toBeVisible();
    expect(screen.queryByTestId("analytics-opt-in-screen")).not.toBeInTheDocument();
  });

  it("should not open the v2 screen when the prompt was already seen", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: v2EnabledFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: true,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

    expect(screen.queryByTestId("analytics-opt-in-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("accept-analytics-button")).not.toBeInTheDocument();
  });

  it("should refuse all and close the screen", async () => {
    const { user } = render(<Welcome />, {
      initialState: {
        featureFlags: v2EnabledFeatureFlags,
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: false,
        },
      },
    });

    await user.click(screen.getByTestId("v3-onboarding-get-started-button"));
    await user.click(await screen.findByRole("button", { name: "Refuse all" }));

    await waitFor(() => {
      expect(screen.queryByTestId("analytics-opt-in-screen")).not.toBeInTheDocument();
    });
  });
});
