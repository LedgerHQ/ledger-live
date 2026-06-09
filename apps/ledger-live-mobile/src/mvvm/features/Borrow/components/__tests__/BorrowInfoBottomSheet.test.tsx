import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { BorrowInfoBottomSheet } from "../BorrowInfoBottomSheet";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    onClose,
    isRequestingToBeOpened,
  }: {
    children: React.ReactNode;
    onClose: () => void;
    isRequestingToBeOpened: boolean;
  }) {
    return (
      <View testID="queued-drawer-bottom-sheet">
        <Text testID="is-requesting-to-be-opened">{isRequestingToBeOpened ? "true" : "false"}</Text>
        {children}
        <Pressable testID="close-bottom-sheet" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

const renderBorrowInfoBottomSheet = (infoBottomSheet: State["borrow"]["infoBottomSheet"]) =>
  render(<BorrowInfoBottomSheet />, {
    overrideInitialState: (state: State) => ({
      ...state,
      borrow: {
        ...state.borrow,
        infoBottomSheet,
      },
    }),
  });

describe("BorrowInfoBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when info bottom sheet state is empty", () => {
    const { getByTestId } = renderBorrowInfoBottomSheet(undefined);

    expect(getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened false when info bottom sheet state is undefined", () => {
    renderBorrowInfoBottomSheet(undefined);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("displays title and message when provided in state", () => {
    renderBorrowInfoBottomSheet({
      title: "Borrow info title",
      message: "Borrow info message body",
    });

    expect(screen.getByText("Borrow info title")).toBeTruthy();
    expect(screen.getByText("Borrow info message body")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened true when title and message are set", () => {
    renderBorrowInfoBottomSheet({
      title: "Some title",
      message: "Some message",
    });

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("clears borrow info bottom sheet state when close is pressed", async () => {
    const { store, user } = renderBorrowInfoBottomSheet({
      title: "Title",
      message: "Message",
    });

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(store.getState().borrow.infoBottomSheet).toBeUndefined();
  });

  it("renders inline link and opens URL when linkText and linkHref are set", async () => {
    const { user } = renderBorrowInfoBottomSheet({
      title: "Title",
      message: "For more information,",
      linkText: "Learn more",
      linkHref: "https://example.com",
    });

    expect(screen.getByText("Learn more")).toBeTruthy();

    await user.press(screen.getByText("Learn more"));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
  });

  it("does not render inline link when only linkText is set", () => {
    renderBorrowInfoBottomSheet({
      title: "Title",
      message: "Message",
      linkText: "No href",
    });

    expect(screen.queryByText("No href")).toBeNull();
  });

  it("does not render inline link when only linkHref is set", () => {
    renderBorrowInfoBottomSheet({
      title: "Title",
      message: "Message",
      linkHref: "https://example.com",
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
