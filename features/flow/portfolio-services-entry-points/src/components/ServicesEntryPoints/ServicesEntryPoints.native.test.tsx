import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import type { PartialFeatures } from "@shared/feature-flags";
import { track } from "@shared/analytics";
import { createTestWrapper } from "../../testing/createTestWrapper";
import { ServicesEntryPoints } from "./ServicesEntryPoints";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

const ENABLED_SERVICES: PartialFeatures = {
  entryPointsServices: { enabled: true, params: { services: ["perps", "borrow"] } },
  ptxPerpsLiveAppMobile: { enabled: true, params: { manifest_id: "perps-live-app" } },
  ptxBorrowLiveApp: { enabled: true },
};

function renderEntryPoints(flags: PartialFeatures = ENABLED_SERVICES) {
  const onOpenService = jest.fn();
  render(<ServicesEntryPoints page="Portfolio" onOpenService={onOpenService} />, {
    wrapper: createTestWrapper(flags),
  });
  return { onOpenService, user: userEvent.setup() };
}

describe("ServicesEntryPoints (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the title and description of each service", () => {
    renderEntryPoints();

    expect(screen.getByText("servicesEntryPoints.perps.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.perps.description")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.borrow.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.borrow.description")).toBeVisible();
  });

  it("should gate perps on the mobile perps flag", () => {
    renderEntryPoints({
      ...ENABLED_SERVICES,
      ptxPerpsLiveApp: { enabled: true, params: { manifest_id: "perps-live-app" } },
      ptxPerpsLiveAppMobile: { enabled: false, params: { manifest_id: "perps-live-app" } },
    });

    expect(screen.queryByText("servicesEntryPoints.perps.title")).toBeNull();
  });

  it("should render nothing when no service is available", () => {
    renderEntryPoints({ entryPointsServices: ENABLED_SERVICES.entryPointsServices });

    expect(screen.queryByTestId("portfolio-services-entry-points")).toBeNull();
  });

  it("should track the press on a service", async () => {
    const { user } = renderEntryPoints();

    await user.press(screen.getByText("servicesEntryPoints.perps.title"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "perps_entry_point",
      flow: "perps",
      page: "Portfolio",
    });
  });

  it("should open the pressed service", async () => {
    const { onOpenService, user } = renderEntryPoints();

    await user.press(screen.getByText("servicesEntryPoints.perps.title"));

    expect(onOpenService).toHaveBeenCalledWith("perps");
  });
});
