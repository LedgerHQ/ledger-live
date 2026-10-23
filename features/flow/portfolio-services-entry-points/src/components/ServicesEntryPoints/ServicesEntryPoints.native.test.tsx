import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
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
  ptxPerpsLiveAppMobile?: { enabled: boolean };
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
    ptxPerpsLiveAppMobile: { enabled: true },
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

describe("ServicesEntryPoints (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the services in the order set by the flag", () => {
    mockFlags(enabledServices(["borrow", "perps"]));

    renderEntryPoints();

    const cards = screen.getAllByTestId(/^portfolio-services-entry-point-/);
    expect(
      cards.map(function getTestID(card: { props: { testID?: string } }) {
        return card.props.testID;
      }),
    ).toEqual(["portfolio-services-entry-point-borrow", "portfolio-services-entry-point-perps"]);
    expect(screen.getByText("servicesEntryPoints.borrow.title")).toBeVisible();
    expect(screen.getByText("servicesEntryPoints.perps.description")).toBeVisible();
  });

  it("gates perps on the mobile perps flag", () => {
    mockFlags({
      ...enabledServices(["perps", "borrow"]),
      ptxPerpsLiveApp: { enabled: true },
      ptxPerpsLiveAppMobile: { enabled: false },
    });

    renderEntryPoints();

    expect(screen.queryByTestId("portfolio-services-entry-point-perps")).toBeNull();
    expect(screen.getByTestId("portfolio-services-entry-point-borrow")).toBeVisible();
  });

  it("renders nothing when no service is available", () => {
    mockFlags({
      entryPointsServices: { enabled: true, params: { services: ["perps", "borrow"] } },
    });

    renderEntryPoints();

    expect(screen.queryByTestId("portfolio-services-entry-points")).toBeNull();
  });

  it("tracks the press and opens the service", async () => {
    const user = userEvent.setup();
    mockFlags(enabledServices(["perps", "borrow"]));
    const { onOpenService } = renderEntryPoints();

    await user.press(screen.getByTestId("portfolio-services-entry-point-perps"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "perps_entry_point",
      flow: "perps",
      page: "Portfolio",
    });
    expect(onOpenService).toHaveBeenCalledWith("perps");
  });
});
