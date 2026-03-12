import React from "react";
import { render, screen } from "tests/testSetup";
import TableActions from "../TableActions";

const mockOpenAssetFlow = jest.fn();
const mockTrackAddAccountEvent = jest.fn();

jest.mock("LLD/features/ModularDrawer/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(() => ({
    openAssetFlow: mockOpenAssetFlow,
  })),
}));

jest.mock("LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    trackAddAccountEvent: mockTrackAddAccountEvent,
  })),
}));

describe("TableActions", () => {
  const defaultProps = {
    searchValue: "",
    setSearchValue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input, add address button, order and filter dropdowns", () => {
    render(<TableActions {...defaultProps} />);

    expect(screen.getByPlaceholderText("Search address")).toBeInTheDocument();
    expect(screen.getByTestId("cryptos-add-address-button")).toBeInTheDocument();
    expect(screen.getByText("Highest Balance")).toBeInTheDocument();
    expect(screen.getByText("Show all")).toBeInTheDocument();
  });

  it("calls openAssetFlow and trackAddAccountEvent when Add address is clicked", async () => {
    const { user } = render(<TableActions {...defaultProps} />);
    await user.click(screen.getByTestId("cryptos-add-address-button"));

    expect(mockTrackAddAccountEvent).toHaveBeenCalledWith("button_clicked", {
      button: "Add address",
      page: "Cryptos",
    });
    expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
  });
});
