import React from "react";
import { Route, Routes } from "react-router";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import RecoverTriggerModal from "..";
import {
  RECOVER_TRIGGER_CTA_BUTTON,
  RECOVER_TRIGGER_DISMISS_BUTTON,
  RECOVER_TRIGGER_PAGE_NAME,
} from "../analytics";

// `~/renderer/linking` `openURL`: Learn more opens the shop URL.
// Tests assert the argument. No browser.
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const defaultParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

function RecoverTriggerOnRoute() {
  return (
    <Routes>
      <Route path="/" element={<div>home</div>} />
      <Route path="/recover/:appId" element={<RecoverTriggerModal />} />
    </Routes>
  );
}

function renderModal({
  isOptIn = true,
}: {
  isOptIn?: boolean;
} = {}) {
  if (!defaultParams) {
    throw new Error("Expected large-screen upsell default params");
  }

  return render(<RecoverTriggerOnRoute />, {
    initialRoute: "/recover/protect-id",
    initialState: {
      ...withFlagOverrides({
        largeScreenUpsell: {
          enabled: true,
          params: {
            ...defaultParams,
            opted_in: {
              ...defaultParams.opted_in,
              enabled: true,
              link: "https://example.com/optInCta",
            },
            opted_out: {
              ...defaultParams.opted_out,
              link: "https://example.com/optOutCta",
            },
          },
        },
      }),
      settings: {
        sharePersonalizedRecommandations: isOptIn,
      },
    },
  });
}

function openedCtaUrl(): URL {
  return new URL(String(jest.mocked(openURL).mock.calls[0][0]));
}

const SHARED_PROPS = {
  deviceModel: "lns",
  personalRecoOptIn: true,
  offerType: "none",
  platform: "lwd",
} as const;

describe("RecoverTriggerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render copy and fire the page event when opened", async () => {
    renderModal();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    expect(screen.getByText("Want peace-of-mind recovery?")).toBeVisible();
    expect(screen.getByText(/isn't compatible with Ledger Recover/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Not now" })).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      RECOVER_TRIGGER_PAGE_NAME,
      undefined,
      expect.objectContaining({
        name: RECOVER_TRIGGER_PAGE_NAME,
        sourceFlow: "recover",
        deviceModel: "lns",
        personalRecoOptIn: true,
        offerType: "none",
        platform: "lwd",
      }),
      true,
      false,
    );
  });

  it("should open the recover_trigger URL and fire CTA plus deeplink events", async () => {
    const { user } = renderModal();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Learn more" }));

    const openedUrl = openedCtaUrl();
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optInCta");
    expect(openedUrl.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.recover_trigger,
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: RECOVER_TRIGGER_CTA_BUTTON,
      page: RECOVER_TRIGGER_PAGE_NAME,
      ...SHARED_PROPS,
    });
    expect(track).toHaveBeenCalledWith("deeplink_clicked", {
      page: RECOVER_TRIGGER_PAGE_NAME,
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...SHARED_PROPS,
    });
    await waitFor(() => expect(screen.getByText("home")).toBeVisible());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should use the opted_out URL when personalized recommendations are off", async () => {
    const { user } = renderModal({ isOptIn: false });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(openedCtaUrl().origin + openedCtaUrl().pathname).toBe("https://example.com/optOutCta");
  });

  it("should close without entering Recover when Not now is clicked", async () => {
    const { user } = renderModal();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Not now" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("home")).toBeVisible();
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: RECOVER_TRIGGER_DISMISS_BUTTON.notNow,
      page: RECOVER_TRIGGER_PAGE_NAME,
      ...SHARED_PROPS,
    });
  });

  it("should fire button_clicked once when the header close button is pressed", async () => {
    const { user } = renderModal();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await user.click(screen.getByLabelText("Close"));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: RECOVER_TRIGGER_DISMISS_BUTTON.closeButton,
      page: RECOVER_TRIGGER_PAGE_NAME,
      ...SHARED_PROPS,
    });
  });

  it("should fire button_clicked once when dismissed via outside tap", async () => {
    renderModal();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    fireEvent.pointerDown(document.body, { button: 0, clientX: 0, clientY: 0 });

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: RECOVER_TRIGGER_DISMISS_BUTTON.outsideTap,
        page: RECOVER_TRIGGER_PAGE_NAME,
        ...SHARED_PROPS,
      }),
    );
  });
});
