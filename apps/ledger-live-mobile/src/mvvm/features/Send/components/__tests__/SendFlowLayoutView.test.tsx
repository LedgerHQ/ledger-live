import React from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";

import { SendFlowLayoutView } from "../SendFlowLayoutView";
import { useSendFlowActions } from "../../context/SendFlowContext";
import { useCurrentSendFlowStep } from "../../hooks/useCurrentSendFlowStep";
import type { SendStepConfig } from "../../types";

const mockQueuedDrawerBottomSheet = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: StyleProp<ViewStyle>;
    }) => <RN.View style={style}>{children}</RN.View>,
    useSafeAreaInsets: () => ({
      top: 0,
      bottom: 10,
      left: 0,
      right: 0,
    }),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
    BottomSheetView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: StyleProp<ViewStyle>;
    }) => (
      <RN.View testID="bottom-sheet-view" style={style}>
        {children}
      </RN.View>
    ),
  };
});

jest.mock("../SendHeader", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SendHeader: ({ headerRight }: { headerRight?: React.ReactNode }) => (
      <RN.View testID="send-header">{headerRight}</RN.View>
    ),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative/styles", () => ({
  useStyleSheet: (
    createStyles: (theme: {
      colors: { bg: { base: string } };
      spacings: Record<"s12" | "s16" | "s24", number>;
    }) => unknown,
  ) =>
    createStyles({
      colors: { bg: { base: "#ffffff" } },
      spacings: { s12: 12, s16: 16, s24: 24 },
    }),
}));

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return function MockQueuedDrawerBottomSheet({
    children,
    isRequestingToBeOpened,
    onClose,
    snapPoints,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    onClose?: () => void;
    snapPoints?: string;
  }) {
    mockQueuedDrawerBottomSheet({ isRequestingToBeOpened, onClose, snapPoints });

    if (!isRequestingToBeOpened) return null;

    return (
      <RN.View testID="queued-drawer-bottom-sheet">
        <RN.Pressable testID="queued-drawer-close" onPress={onClose}>
          <RN.Text>Close</RN.Text>
        </RN.Pressable>
        {children}
      </RN.View>
    );
  };
});

jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowActions: jest.fn(),
}));

jest.mock("../../hooks/useCurrentSendFlowStep", () => ({
  useCurrentSendFlowStep: jest.fn(),
}));

const mockClose = jest.fn();
const mockNavigation = {
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(),
  goBack: jest.fn(),
};

const bottomSheetStepConfig: SendStepConfig = {
  id: SEND_FLOW_STEP.SIGNATURE,
  canGoBack: false,
  bottomSheet: true,
};

function mockCurrentStepConfig(stepConfig: SendStepConfig = bottomSheetStepConfig) {
  jest.mocked(useCurrentSendFlowStep).mockReturnValue([SEND_FLOW_STEP.SIGNATURE, stepConfig]);
}

function mockSendFlowActions(): ReturnType<typeof useSendFlowActions> {
  return {
    transaction: {
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      setRecipient: jest.fn(),
      setAccount: jest.fn(),
    },
    operation: {
      onOperationBroadcasted: jest.fn(),
      onTransactionError: jest.fn(),
      onSigned: jest.fn(),
      onRetry: jest.fn(),
    },
    status: {
      setStatus: jest.fn(),
      setError: jest.fn(),
      setSuccess: jest.fn(),
      resetStatus: jest.fn(),
    },
    close: mockClose,
    setAccountAndNavigate: jest.fn(),
    setRecipientSearchValue: jest.fn(),
    clearRecipientSearch: jest.fn(),
  };
}

describe("SendFlowLayoutView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue(mockNavigation);
    jest.mocked(useSendFlowActions).mockReturnValue(mockSendFlowActions());
    mockCurrentStepConfig();
  });

  it("should render bottom sheet steps in a queued drawer with safe area padding", () => {
    render(
      <SendFlowLayoutView>
        <Text>Signature step</Text>
      </SendFlowLayoutView>,
    );

    expect(screen.getByTestId("queued-drawer-bottom-sheet")).toBeOnTheScreen();
    expect(mockQueuedDrawerBottomSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        isRequestingToBeOpened: true,
        snapPoints: "medium",
      }),
    );
    expect(screen.getByTestId("bottom-sheet-view")).toHaveStyle({ paddingBottom: 34 });
  });

  it("should go back by default when closing a bottom sheet step without custom close handler", () => {
    mockNavigation.canGoBack.mockReturnValue(true);
    render(
      <SendFlowLayoutView>
        <Text>Signature step</Text>
      </SendFlowLayoutView>,
    );

    fireEvent.press(screen.getByTestId("queued-drawer-close"));

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();
  });

  it("should close the flow by default when the bottom sheet step cannot go back", () => {
    mockNavigation.canGoBack.mockReturnValue(false);
    render(
      <SendFlowLayoutView>
        <Text>Signature step</Text>
      </SendFlowLayoutView>,
    );

    fireEvent.press(screen.getByTestId("queued-drawer-close"));

    expect(mockNavigation.goBack).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("should delegate bottom sheet close to the current step config when provided", () => {
    const onBottomSheetClose = jest.fn();
    mockCurrentStepConfig({
      ...bottomSheetStepConfig,
      onBottomSheetClose,
    });
    mockNavigation.canGoBack.mockReturnValue(true);
    render(
      <SendFlowLayoutView>
        <Text>Signature step</Text>
      </SendFlowLayoutView>,
    );

    fireEvent.press(screen.getByTestId("queued-drawer-close"));

    expect(onBottomSheetClose).toHaveBeenCalledWith({
      navigation: mockNavigation,
      close: mockClose,
    });
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  it("should render the page layout for non bottom sheet steps", () => {
    mockCurrentStepConfig({
      id: SEND_FLOW_STEP.AMOUNT,
      canGoBack: true,
      bottomSheet: false,
    });

    render(
      <SendFlowLayoutView headerContent={<Text>Header content</Text>}>
        <View testID="page-content" />
      </SendFlowLayoutView>,
    );

    expect(screen.queryByTestId("queued-drawer-bottom-sheet")).toBeNull();
    expect(screen.getByText("Header content")).toBeOnTheScreen();
    expect(screen.getByTestId("page-content")).toBeOnTheScreen();
  });
});
