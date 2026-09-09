import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MoreSheet } from "./MoreSheet";
import { buildMoreRows } from "../fixtures";

const onPress = {
  managePin: jest.fn(),
  accessBaanx: jest.fn(),
  help: jest.fn(),
  logout: jest.fn(),
};

const defaultProps: React.ComponentProps<typeof MoreSheet> = {
  isOpen: true,
  title: "More",
  rows: buildMoreRows(onPress),
  onClose: jest.fn(),
};

describe("MoreSheet (Web)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("renders nothing while closed", () => {
    render(<MoreSheet {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("more-sheet")).toBeNull();
    expect(screen.queryByTestId("more-sheet-content")).toBeNull();
  });

  it("renders the title below the header", () => {
    render(<MoreSheet {...defaultProps} />);

    expect(screen.getByTestId("more-sheet")).toBeVisible();
    expect(screen.getByText("More")).toBeVisible();
  });

  it("renders the four rows in the design order", () => {
    render(<MoreSheet {...defaultProps} />);

    expect(screen.getAllByTestId(/^more-row-/).map(row => row.getAttribute("data-testid"))).toEqual(
      ["more-row-managePin", "more-row-accessBaanx", "more-row-help", "more-row-logout"],
    );
  });

  it("calls only the pressed row's handler", () => {
    render(<MoreSheet {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(onPress.logout).toHaveBeenCalledTimes(1);
    expect(onPress.managePin).not.toHaveBeenCalled();
    expect(onPress.accessBaanx).not.toHaveBeenCalled();
    expect(onPress.help).not.toHaveBeenCalled();
  });

  it("calls onClose once when the header close also notifies Dialog", () => {
    const onClose = jest.fn();
    render(<MoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose again after the sheet is reopened", () => {
    const onClose = jest.fn();
    const { rerender } = render(<MoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    rerender(<MoreSheet {...defaultProps} isOpen={false} onClose={onClose} />);
    rerender(<MoreSheet {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
