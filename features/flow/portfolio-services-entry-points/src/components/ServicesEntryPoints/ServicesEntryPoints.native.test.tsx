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

const THREE_SERVICES: PartialFeatures = {
  ...ENABLED_SERVICES,
  entryPointsServices: {
    enabled: true,
    params: { services: ["perps", "borrow", "predictions"] },
  },
  ptxPredictionsLiveAppMobile: { enabled: true, params: { manifest_id: "predictions-live-app" } },
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

  it("should gate predictions on the mobile predictions flag", () => {
    const manifest = { manifest_id: "predictions-live-app" };

    renderEntryPoints({
      ...ENABLED_SERVICES,
      entryPointsServices: { enabled: true, params: { services: ["perps", "predictions"] } },
      ptxPredictionsLiveAppDesktop: { enabled: true, params: manifest },
      ptxPredictionsLiveAppMobile: { enabled: false, params: manifest },
    });

    expect(screen.queryByText("servicesEntryPoints.predictions.title")).toBeNull();
  });

  it("should render predictions when the flag lists it and its mobile feature is on", () => {
    renderEntryPoints({
      ...ENABLED_SERVICES,
      entryPointsServices: { enabled: true, params: { services: ["perps", "predictions"] } },
      ptxPredictionsLiveAppMobile: {
        enabled: true,
        params: { manifest_id: "predictions-live-app" },
      },
    });

    expect(screen.getByText("servicesEntryPoints.predictions.title")).toBeVisible();
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

  it("should lay out one or two services side by side", () => {
    renderEntryPoints();

    expect(screen.getByTestId("portfolio-services-entry-points")).not.toHaveProp("horizontal");
  });

  it("should scroll three services horizontally", () => {
    renderEntryPoints(THREE_SERVICES);

    expect(screen.getByTestId("portfolio-services-entry-points")).toHaveProp("horizontal", true);
    expect(screen.getByText("servicesEntryPoints.perps.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.borrow.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.predictions.title")).toBeVisible();
  });

  it("should open the service pressed in the carousel", async () => {
    const { onOpenService, user } = renderEntryPoints(THREE_SERVICES);

    await user.press(screen.getByText("servicesEntryPoints.predictions.title"));

    expect(onOpenService).toHaveBeenCalledWith("predictions");
  });
});
