import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ServicesEntryPoints } from "./ServicesEntryPoints";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));
jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);
const mockTrack = jest.mocked(track);

type Flags = {
  entryPointsServices?: { enabled: boolean; params?: { services: string[] } };
  ptxPerpsLiveApp?: { enabled: boolean };
  ptxBorrowLiveApp?: { enabled: boolean };
};

function mockFlags(flags: Flags) {
  mockUseFeature.mockImplementation(function getFlag(key) {
    return (flags[key as keyof Flags] ?? null) as ReturnType<typeof useFeature>;
  });
}

function enabledServices(services: string[]): Flags {
  return {
    entryPointsServices: { enabled: true, params: { services } },
    ptxPerpsLiveApp: { enabled: true },
    ptxBorrowLiveApp: { enabled: true },
  };
}

function renderEntryPoints(onOpenService = jest.fn()) {
  render(
    <I18nTestProvider>
      <ServicesEntryPoints page="Portfolio" onOpenService={onOpenService} />
    </I18nTestProvider>,
  );
  return { onOpenService };
}

function renderedServices() {
  return screen.getAllByTestId(/^portfolio-services-entry-point-/).map(function getService(tile) {
    return tile.dataset.testid?.replace("portfolio-services-entry-point-", "");
  });
}

describe("ServicesEntryPoints (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the services in the order set by the flag", () => {
    mockFlags(enabledServices(["borrow", "perps"]));

    renderEntryPoints();

    expect(renderedServices()).toEqual(["borrow", "perps"]);
    expect(screen.getByText("servicesEntryPoints.perps.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.borrow.description")).toBeVisible();
  });

  it("hides a service whose desktop feature is off", () => {
    mockFlags({ ...enabledServices(["perps", "borrow"]), ptxPerpsLiveApp: { enabled: false } });

    renderEntryPoints();

    expect(renderedServices()).toEqual(["borrow"]);
  });

  it("renders nothing when the flag is off", () => {
    mockFlags({ ...enabledServices(["perps", "borrow"]), entryPointsServices: { enabled: false } });

    renderEntryPoints();

    expect(screen.queryByTestId("portfolio-services-entry-points")).not.toBeInTheDocument();
  });

  it("tracks the click and opens the service", () => {
    mockFlags(enabledServices(["perps", "borrow"]));
    const { onOpenService } = renderEntryPoints();

    fireEvent.click(screen.getByTestId("portfolio-services-entry-point-borrow"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: "Portfolio",
    });
    expect(onOpenService).toHaveBeenCalledWith("borrow");
  });
});
