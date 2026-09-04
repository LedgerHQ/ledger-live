import React from "react";
import { Pressable, View } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { CardMoreSheet } from "../CardMoreSheet.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    onClose,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    onClose?: () => void;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      <Pressable testID={`${testID}-dismiss`} onPress={onClose} />
      {children}
    </View>
  ),
}));

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

describe("CardMoreSheet (Native)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render(<CardMoreSheet {...defaultProps} isOpen={false} />);

    expect(screen.getByTestId("card-more-sheet")).toBeTruthy();
    expect(screen.queryByTestId("card-more-sheet-content")).toBeNull();
  });

  it("reports its open flag to the sheet shell", () => {
    render(<CardMoreSheet {...defaultProps} />);

    expect(screen.getByTestId("card-more-sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("renders the title below the header", () => {
    render(<CardMoreSheet {...defaultProps} />);

    expect(screen.getByText("More")).toBeTruthy();
  });

  it("renders the four rows in the design order", () => {
    render(<CardMoreSheet {...defaultProps} />);

    expect(screen.getAllByTestId(/^card-more-row-/).map(row => row.props.testID)).toEqual([
      "card-more-row-managePin",
      "card-more-row-accessBaanx",
      "card-more-row-help",
      "card-more-row-logout",
    ]);
    expect(screen.getByText("Manage PIN Code")).toBeTruthy();
    expect(screen.getByText("Access to Baanx")).toBeTruthy();
    expect(screen.getByText("Help")).toBeTruthy();
    expect(screen.getByText("Logout")).toBeTruthy();
  });

  it("calls only the pressed row's handler", () => {
    render(<CardMoreSheet {...defaultProps} />);

    fireEvent.press(screen.getByTestId("card-more-row-logout"));

    expect(onPress.logout).toHaveBeenCalledTimes(1);
    expect(onPress.managePin).not.toHaveBeenCalled();
    expect(onPress.accessBaanx).not.toHaveBeenCalled();
    expect(onPress.help).not.toHaveBeenCalled();
  });

  it("closes once, whatever the number of dismissals", () => {
    const onClose = jest.fn();
    render(<CardMoreSheet {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("card-more-sheet-dismiss"));
    fireEvent.press(screen.getByTestId("card-more-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
