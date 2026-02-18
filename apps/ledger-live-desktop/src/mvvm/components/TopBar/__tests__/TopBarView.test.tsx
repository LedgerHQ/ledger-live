import React from "react";
import { render, screen } from "tests/testSetup";
import TopBarView from "../TopBarView";
import { TopBarSlot } from "../types";

jest.mock("~/renderer/components/Breadcrumb", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../components/ActionsList", () => ({
  TopBarActionsList: () => null,
}));
jest.mock("~/renderer/components/FirmwareUpdateBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="firmware-update-banner" />,
}));
jest.mock("~/renderer/Default", () => ({
  TopBannerContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TopBarView", () => {
  const defaultSlots: TopBarSlot[] = [];

  it("should render updater when not in manager", () => {
    render(<TopBarView slots={defaultSlots} shouldShowFirmwareUpdateBanner={true} />);

    expect(screen.getByTestId("firmware-update-banner")).toBeInTheDocument();
  });

  it("should not render updater when in manager", () => {
    render(<TopBarView slots={defaultSlots} shouldShowFirmwareUpdateBanner={false} />);

    expect(screen.queryByTestId("firmware-update-banner")).not.toBeInTheDocument();
  });
});
