import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
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

describe("MoreSheet (native)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("hides the sheet content when closed", () => {
    render(<MoreSheet {...defaultProps} isOpen={false} />);

    expect(screen.getByTestId("more-sheet").props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("more-sheet-content")).toBeNull();
  });

  it("renders the title below the header", () => {
    render(<MoreSheet {...defaultProps} />);

    expect(screen.getByTestId("more-sheet").props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("More")).toBeVisible();
  });

  it("renders the four rows in the design order", () => {
    render(<MoreSheet {...defaultProps} />);

    expect(screen.getAllByTestId(/^more-row-/).map(row => row.props.testID)).toEqual([
      "more-row-managePin",
      "more-row-accessBaanx",
      "more-row-help",
      "more-row-logout",
    ]);
  });

  it("calls only the pressed row's handler", () => {
    render(<MoreSheet {...defaultProps} />);

    fireEvent.press(screen.getByTestId("more-row-logout"));

    expect(onPress.logout).toHaveBeenCalledTimes(1);
    expect(onPress.managePin).not.toHaveBeenCalled();
    expect(onPress.accessBaanx).not.toHaveBeenCalled();
    expect(onPress.help).not.toHaveBeenCalled();
  });

  it("calls onClose from the sheet dismiss control", () => {
    const onClose = jest.fn();
    render(<MoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("more-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose once when dismiss is reported twice", () => {
    const onClose = jest.fn();
    render(<MoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("more-sheet-dismiss"));
    fireEvent.press(screen.getByTestId("more-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose again after reopening the sheet", () => {
    const onClose = jest.fn();
    const { rerender } = render(<MoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("more-sheet-dismiss"));
    rerender(<MoreSheet {...defaultProps} isOpen={false} onClose={onClose} />);
    rerender(<MoreSheet {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("more-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
