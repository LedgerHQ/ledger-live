import React from "react";
import { render, screen } from "@tests/test-renderer";
import CounterfeitWarningDrawerView from "../CounterfeitWarningDrawerView";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const { View, Pressable, Text } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    onClose,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) {
    if (!isRequestingToBeOpened) {
      return null;
    }
    return (
      <View testID={testID}>
        {children}
        <Pressable accessibilityLabel="Close" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

const defaultProps = {
  isOpen: true,
  title: "title-key-resolved",
  primaryCtaLabel: "primary-key-resolved",
  secondaryCtaLabel: "secondary-key-resolved",
  onProceed: jest.fn(),
  onConcern: jest.fn(),
  onLedgerComLink: jest.fn(),
  onResellerLink: jest.fn(),
  onDismiss: jest.fn(),
};

describe("CounterfeitWarningDrawerView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when closed", () => {
    render(<CounterfeitWarningDrawerView {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
  });

  it("should render drawer content and invoke CTA handlers when open", async () => {
    const onProceed = jest.fn();
    const onConcern = jest.fn();
    const { user } = render(
      <CounterfeitWarningDrawerView
        {...defaultProps}
        onProceed={onProceed}
        onConcern={onConcern}
      />,
    );

    expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
    expect(screen.getByText("title-key-resolved")).toBeOnTheScreen();

    await user.press(screen.getByText("primary-key-resolved"));
    expect(onProceed).toHaveBeenCalledTimes(1);

    await user.press(screen.getByText("secondary-key-resolved"));
    expect(onConcern).toHaveBeenCalledTimes(1);
  });
});
