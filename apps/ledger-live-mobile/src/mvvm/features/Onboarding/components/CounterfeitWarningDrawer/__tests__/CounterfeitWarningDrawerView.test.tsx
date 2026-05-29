import React from "react";
import { render, screen } from "@tests/test-renderer";
import CounterfeitWarningDrawerView from "../CounterfeitWarningDrawerView";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    isRequestingToBeOpened,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
  }) {
    return isRequestingToBeOpened ? <RN.View>{children}</RN.View> : null;
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
    expect(screen.queryByText("title-key-resolved")).toBeNull();
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

    expect(screen.getByText("title-key-resolved")).toBeVisible();

    await user.press(screen.getByText("primary-key-resolved"));
    expect(onProceed).toHaveBeenCalledTimes(1);

    await user.press(screen.getByText("secondary-key-resolved"));
    expect(onConcern).toHaveBeenCalledTimes(1);
  });
});
