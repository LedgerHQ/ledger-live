import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PartialFeatures } from "@shared/feature-flags";
import { track } from "@shared/analytics";
import { createTestWrapper } from "../../testing/createTestWrapper";
import { ServicesEntryPoints } from "./ServicesEntryPoints";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

const ENABLED_SERVICES: PartialFeatures = {
  entryPointsServices: { enabled: true, params: { services: ["perps", "borrow"] } },
  ptxPerpsLiveApp: { enabled: true, params: { manifest_id: "perps-live-app" } },
  ptxBorrowLiveApp: { enabled: true },
};

function renderEntryPoints(flags: PartialFeatures = ENABLED_SERVICES) {
  const onOpenService = jest.fn();
  render(<ServicesEntryPoints page="Portfolio" onOpenService={onOpenService} />, {
    wrapper: createTestWrapper(flags),
  });
  return { onOpenService, user: userEvent.setup() };
}

describe("ServicesEntryPoints (Web)", () => {
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

  it("should render nothing when no service is available", () => {
    renderEntryPoints({ entryPointsServices: ENABLED_SERVICES.entryPointsServices });

    expect(screen.queryByTestId("portfolio-services-entry-points")).not.toBeInTheDocument();
  });

  it("should track the click on a service", async () => {
    const { user } = renderEntryPoints();

    await user.click(screen.getByText("servicesEntryPoints.borrow.title"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: "Portfolio",
    });
  });

  it("should open the clicked service", async () => {
    const { onOpenService, user } = renderEntryPoints();

    await user.click(screen.getByText("servicesEntryPoints.borrow.title"));

    expect(onOpenService).toHaveBeenCalledWith("borrow");
  });
});
