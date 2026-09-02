import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CardMoreSheet } from "../CardMoreSheet.web";

const onPress = {
  managePin: jest.fn(),
  accessBaanx: jest.fn(),
  help: jest.fn(),
  logout: jest.fn(),
};

const defaultProps: React.ComponentProps<typeof CardMoreSheet> = {
  isOpen: true,
  title: "More",
  rows: [
    { id: "managePin", title: "Manage PIN Code", onPress: onPress.managePin },
    { id: "accessBaanx", title: "Access to Baanx", onPress: onPress.accessBaanx },
    { id: "help", title: "Help", onPress: onPress.help },
    { id: "logout", title: "Logout", onPress: onPress.logout },
  ],
  onClose: jest.fn(),
};

describe("CardMoreSheet (Web)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("renders nothing while closed", () => {
    render(<CardMoreSheet {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("card-more-sheet")).toBeNull();
    expect(screen.queryByTestId("card-more-sheet-content")).toBeNull();
  });

  it("renders the title below the header", () => {
    render(<CardMoreSheet {...defaultProps} />);

    expect(screen.getByTestId("card-more-sheet")).toBeVisible();
    expect(screen.getByText("More")).toBeVisible();
  });

  it("renders the four rows in the design order", () => {
    render(<CardMoreSheet {...defaultProps} />);

    expect(
      screen.getAllByTestId(/^card-more-row-/).map(row => row.getAttribute("data-testid")),
    ).toEqual([
      "card-more-row-managePin",
      "card-more-row-accessBaanx",
      "card-more-row-help",
      "card-more-row-logout",
    ]);
  });

  it("calls only the pressed row's handler", () => {
    render(<CardMoreSheet {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onPress.logout).toHaveBeenCalledTimes(1);
    expect(onPress.managePin).not.toHaveBeenCalled();
    expect(onPress.accessBaanx).not.toHaveBeenCalled();
    expect(onPress.help).not.toHaveBeenCalled();
  });

  it("closes from the header close button", () => {
    const onClose = jest.fn();
    render(<CardMoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
