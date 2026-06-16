import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { InfoBottomSheet } from "../InfoBottomSheet";

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

describe("InfoBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when data is undefined", () => {
    render(<InfoBottomSheet data={undefined} onClose={jest.fn()} />);

    expect(screen.getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened false when data is undefined", () => {
    render(<InfoBottomSheet data={undefined} onClose={jest.fn()} />);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("displays title and message when data is provided", () => {
    render(
      <InfoBottomSheet
        data={{ title: "Info title", message: "Info message body" }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Info title")).toBeTruthy();
    expect(screen.getByText("Info message body")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened true when data is provided", () => {
    render(
      <InfoBottomSheet
        data={{ title: "Some title", message: "Some message" }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("invokes onClose when the drawer requests to close", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <InfoBottomSheet data={{ title: "Title", message: "Message" }} onClose={onClose} />,
    );

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders link and opens URL when linkText and linkHref are set", async () => {
    const { user } = render(
      <InfoBottomSheet
        data={{
          title: "Title",
          message: "For more information,",
          linkText: "Learn more",
          linkHref: "https://example.com",
        }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Learn more")).toBeTruthy();

    await user.press(screen.getByText("Learn more"));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
  });

  it("does not render the link when only linkText is set", () => {
    render(
      <InfoBottomSheet
        data={{ title: "Title", message: "Message", linkText: "No href" }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.queryByText("No href")).toBeNull();
  });

  it("does not render the link when only linkHref is set", () => {
    render(
      <InfoBottomSheet
        data={{ title: "Title", message: "Message", linkHref: "https://example.com" }}
        onClose={jest.fn()}
      />,
    );

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
