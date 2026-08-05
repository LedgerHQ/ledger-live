import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { QueuedBottomSheetProps } from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { QueuedDrawerFlow } from "..";

let mockDrawerProps: QueuedBottomSheetProps | undefined;
let mockDrawerMountCount = 0;
let mockDrawerUnmountCount = 0;

jest.mock("LLM/components/QueuedDrawer/QueuedBottomSheet", () => {
  function MockQueuedBottomSheet(props: QueuedBottomSheetProps) {
    const React = jest.requireActual<typeof import("react")>("react");

    mockDrawerProps = props;
    React.useEffect(() => {
      mockDrawerMountCount += 1;
      return () => {
        mockDrawerUnmountCount += 1;
      };
    }, []);

    return props.children;
  }

  return {
    __esModule: true,
    default: MockQueuedBottomSheet,
  };
});

type TestStep = "asset" | "address";

const screens = {
  asset: {
    content: <Text>Asset screen</Text>,
    options: { hasBackButton: false },
  },
  address: {
    content: <Text>Address screen</Text>,
    options: { hasBackButton: true },
  },
} satisfies Parameters<typeof QueuedDrawerFlow<TestStep>>[0]["screens"];

describe("QueuedDrawerFlow", () => {
  beforeEach(() => {
    mockDrawerProps = undefined;
    mockDrawerMountCount = 0;
    mockDrawerUnmountCount = 0;
  });

  it("should replace the current screen without closing the drawer", () => {
    const onClose = jest.fn();
    const onBack = jest.fn();
    const { rerender } = render(
      <QueuedDrawerFlow
        currentStep="asset"
        defaultOptions={{
          preventBackdropClick: true,
          snapPoints: ["50%"],
        }}
        isOpen
        onBack={onBack}
        onClose={onClose}
        screens={screens}
        testID="test-flow"
      />,
    );

    expect(screen.getByText("Asset screen")).toBeVisible();

    rerender(
      <QueuedDrawerFlow
        currentStep="address"
        defaultOptions={{
          preventBackdropClick: true,
          snapPoints: ["50%"],
        }}
        isOpen
        onBack={onBack}
        onClose={onClose}
        screens={screens}
        testID="test-flow"
      />,
    );

    expect(screen.getByText("Address screen")).toBeVisible();
    expect(screen.queryByText("Asset screen")).toBeNull();
    expect(mockDrawerMountCount).toBe(1);
    expect(mockDrawerUnmountCount).toBe(0);
    expect(mockDrawerProps).toEqual(
      expect.objectContaining({
        hasBackButton: true,
        isRequestingToBeOpened: true,
        onBack,
        onClose,
        preventBackdropClick: true,
        snapPoints: ["50%"],
        testID: "test-flow",
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should hide the back button when no back handler is provided", () => {
    render(<QueuedDrawerFlow currentStep="address" isOpen onClose={jest.fn()} screens={screens} />);

    expect(mockDrawerProps).toEqual(
      expect.objectContaining({
        hasBackButton: false,
        onBack: undefined,
      }),
    );
  });
});
