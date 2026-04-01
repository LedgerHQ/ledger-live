import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { EarnInfoBottomSheet } from "../EarnInfoBottomSheet";
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

const renderEarnInfoBottomSheet = (infoBottomSheet: State["earn"]["infoBottomSheet"]) =>
  render(<EarnInfoBottomSheet />, {
    overrideInitialState: (state: State) => ({
      ...state,
      earn: {
        ...state.earn,
        infoBottomSheet,
      },
    }),
  });

describe("EarnInfoBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when info bottom sheet state is empty", () => {
    const { getByTestId } = renderEarnInfoBottomSheet(undefined);

    expect(getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened false when info bottom sheet state is undefined", () => {
    renderEarnInfoBottomSheet(undefined);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("displays title and message when provided in state", () => {
    renderEarnInfoBottomSheet({
      title: "Earn info title",
      message: "Earn info message body",
    });

    expect(screen.getByText("Earn info title")).toBeTruthy();
    expect(screen.getByText("Earn info message body")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened true when title and message are set", () => {
    renderEarnInfoBottomSheet({
      title: "Some title",
      message: "Some message",
    });

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("clears earn info bottom sheet state when close is pressed", async () => {
    const { store, user } = renderEarnInfoBottomSheet({
      title: "Title",
      message: "Message",
    });

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(store.getState().earn.infoBottomSheet).toBeUndefined();
  });

  it("renders inline link and opens URL when linkText and linkHref are set", async () => {
    const { user } = renderEarnInfoBottomSheet({
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
    renderEarnInfoBottomSheet({
      title: "Title",
      message: "Message",
      linkText: "No href",
    });

    expect(screen.queryByText("No href")).toBeNull();
  });

  it("does not render inline link when only linkHref is set", () => {
    renderEarnInfoBottomSheet({
      title: "Title",
      message: "Message",
      linkHref: "https://example.com",
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
