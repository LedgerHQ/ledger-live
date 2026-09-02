import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLogoutView } from "../CardLogoutView.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      {children}
    </View>
  ),
}));

const defaultProps: React.ComponentProps<typeof CardLogoutView> = {
  moreLabel: "More",
  sheetTitle: "More",
  rows: [
    { id: "managePin", title: "Manage PIN Code", onPress: jest.fn() },
    { id: "accessBaanx", title: "Access to Baanx", onPress: jest.fn() },
    { id: "help", title: "Help", onPress: jest.fn() },
    { id: "logout", title: "Logout", onPress: jest.fn() },
  ],
  isSheetOpen: false,
  onMorePress: jest.fn(),
  onSheetClose: jest.fn(),
};

function renderCardLogoutView(props: Partial<React.ComponentProps<typeof CardLogoutView>> = {}) {
  return render(<CardLogoutView {...defaultProps} {...props} />);
}

describe("CardLogoutView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the More tile with its label", () => {
    renderCardLogoutView();

    expect(screen.getByLabelText("More")).toBeTruthy();
  });

  it("should call the More handler when the tile is pressed", () => {
    const onMorePress = jest.fn();
    renderCardLogoutView({ onMorePress });

    fireEvent.press(screen.getByTestId("card-more-tile"));

    expect(onMorePress).toHaveBeenCalledTimes(1);
  });

  it("should pass the open flag to the sheet", () => {
    renderCardLogoutView({ isSheetOpen: true });

    expect(screen.getByTestId("card-more-sheet").props.accessibilityState.expanded).toBe(true);
  });
});
