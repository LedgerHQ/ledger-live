import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DRepRow from "./DRepRow";
import { openURL } from "~/renderer/linking";
import { getDefaultExplorerView, getDRepExplorer } from "@ledgerhq/live-common/explorers";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/explorers", () => ({
  getDefaultExplorerView: jest.fn(),
  getDRepExplorer: jest.fn(),
}));

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  useDateFormatter: () => (_date: Date) => "Formatted Date",
  dayAndHourFormat: "dayAndHourFormat",
}));

describe("DRepRow", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockCurrency = { type: "CryptoCurrency", id: "cardano" } as CryptoCurrency;
  const mockDRepHex = "11223344556677889900aabbccddeeff00112233445566778899aabb";
  const mockDRepBech32 = "drep1zy3rx3z4vemc3xgq42aueh0wluqpzg3ng32kvaugnx4tkttkftx";
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockDRep = {
    hex: mockDRepHex,
    meta: { givenName: "Test dRep" },
    active: "2023-01-01T00:00:00.000Z",
  } as DRep;
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with DRep name, hex, and last active date", () => {
    render(<DRepRow currency={mockCurrency} dRep={mockDRep} onClick={mockOnClick} />);

    expect(screen.getByText("Test dRep")).toBeInTheDocument();
    expect(screen.getByText(mockDRepBech32)).toBeInTheDocument();
    expect(screen.getByText("Formatted Date")).toBeInTheDocument();
  });

  it("calls onClick with the DRep when the row is clicked", () => {
    render(<DRepRow currency={mockCurrency} dRep={mockDRep} onClick={mockOnClick} />);

    fireEvent.click(screen.getByTestId("dRep-row"));
    expect(mockOnClick).toHaveBeenCalledWith(mockDRep);
  });

  it("opens the explorer URL when the external link is clicked", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jest.mocked(getDefaultExplorerView).mockReturnValue("explorerView" as never);
    jest.mocked(getDRepExplorer).mockReturnValue("https://explorer.com/drep123");

    render(<DRepRow currency={mockCurrency} dRep={mockDRep} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText(mockDRepBech32));

    expect(getDefaultExplorerView).toHaveBeenCalledWith(mockCurrency);
    expect(getDRepExplorer).toHaveBeenCalledWith("explorerView", mockDRepHex);
    expect(openURL).toHaveBeenCalledWith("https://explorer.com/drep123");

    // Ensure that row click was not triggered due to stopPropagation
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("handles a missing DRep meta name gracefully", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const missingMetaDRep = {
      hex: "aabbccddeeff00112233445566778899aabbccddeeff0011223344556677",
      active: "2023-01-01T00:00:00.000Z",
    } as DRep;

    render(<DRepRow currency={mockCurrency} dRep={missingMetaDRep} onClick={mockOnClick} />);

    // The title element should not be rendered
    expect(screen.queryByTestId("dRep-title")).not.toBeInTheDocument();
    expect(
      screen.getByText("drep142aueh0wluqpzg3ng32kvaugnx4thnxaamlsqyfzxdz92enhz3yuqq"),
    ).toBeInTheDocument();
  });

  it("renders correctly without an external link if the explorer URL is not found", () => {
    jest.mocked(getDefaultExplorerView).mockReturnValue(undefined);

    render(<DRepRow currency={mockCurrency} dRep={mockDRep} onClick={mockOnClick} />);

    fireEvent.click(screen.getByText(mockDRepBech32));

    // openURL should not be called
    expect(openURL).not.toHaveBeenCalled();
  });

  it("renders correctly when active is false", () => {
    const { container } = render(
      <DRepRow currency={mockCurrency} dRep={mockDRep} onClick={mockOnClick} active={false} />,
    );

    // It should render, and ChosenMark's active prop should handle the false state.
    // Testing the actual color of a styled-component is tricky without full theme mocking,
    // so we verify it renders without crashing and the SVG is in the DOM.
    expect(screen.getByText("Test dRep")).toBeInTheDocument();

    // Check if the checkmark container exists (it should always be there but its color might change)
    // The inner path element of ChosenMark should still be there.
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
  });
});
