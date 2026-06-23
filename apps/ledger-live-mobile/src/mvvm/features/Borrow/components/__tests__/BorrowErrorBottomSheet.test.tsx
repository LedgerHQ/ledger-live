import React from "react";
import { render, screen } from "@tests/test-renderer";
import { BorrowErrorBottomSheet } from "../BorrowErrorBottomSheet";
import { resolveBorrowErrorBottomSheet } from "LLM/features/Borrow/handlers/borrowErrorBottomSheetStore";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
    Spot: ({ appearance }: { appearance: string }) => <RN.View testID={`spot-${appearance}`} />,
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

jest.mock("LLM/features/Borrow/handlers/borrowErrorBottomSheetStore", () => ({
  resolveBorrowErrorBottomSheet: jest.fn(),
}));

const mockedResolve = jest.mocked(resolveBorrowErrorBottomSheet);

const renderSheet = (errorBottomSheet: State["borrow"]["errorBottomSheet"]) =>
  render(<BorrowErrorBottomSheet />, {
    overrideInitialState: (state: State) => ({
      ...state,
      borrow: {
        ...state.borrow,
        errorBottomSheet,
      },
    }),
  });

describe("BorrowErrorBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when there is no pending error sheet", () => {
    const { getByTestId } = renderSheet(undefined);

    expect(getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
    expect(getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("passes isRequestingToBeOpened true when an error sheet is set", () => {
    renderSheet({ title: "Oops", description: "It broke", ctaLabel: "Try again" });

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("displays title, description, and CTA label", () => {
    renderSheet({
      title: "Borrow failed",
      description: "The provider rejected your request.",
      ctaLabel: "Retry",
    });

    expect(screen.getByText("Borrow failed")).toBeTruthy();
    expect(screen.getByText("The provider rejected your request.")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  it("renders an error Spot above the title and description", () => {
    renderSheet({ title: "T", description: "D", ctaLabel: "CTA" });

    expect(screen.getByTestId("spot-error")).toBeTruthy();
  });

  it("calls resolveBorrowErrorBottomSheet(true) when the CTA is pressed", async () => {
    const { user } = renderSheet({
      title: "T",
      description: "D",
      ctaLabel: "Confirm",
    });

    await user.press(screen.getByTestId("borrow-error-bottom-sheet-cta"));

    expect(mockedResolve).toHaveBeenCalledWith(true);
  });

  it("calls resolveBorrowErrorBottomSheet(false) when close is pressed", async () => {
    const { user } = renderSheet({ title: "T", description: "D", ctaLabel: "CTA" });

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolve).toHaveBeenCalledWith(false);
  });

  it("only resolves once on multiple close presses", async () => {
    const { user } = renderSheet({ title: "T", description: "D", ctaLabel: "CTA" });

    await user.press(screen.getByTestId("close-bottom-sheet"));
    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolve).toHaveBeenCalledTimes(1);
  });

  it("does not call close-resolve after the CTA has been pressed", async () => {
    const { user } = renderSheet({ title: "T", description: "D", ctaLabel: "Confirm" });

    await user.press(screen.getByTestId("borrow-error-bottom-sheet-cta"));
    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolve).toHaveBeenCalledTimes(1);
    expect(mockedResolve).toHaveBeenCalledWith(true);
  });

  it("resolves with confirmed=false on unmount if a sheet was pending", () => {
    const { unmount } = renderSheet({ title: "T", description: "D", ctaLabel: "CTA" });

    unmount();

    expect(mockedResolve).toHaveBeenCalledWith(false);
  });

  it("does not call resolve on unmount when no sheet is pending", () => {
    const { unmount } = renderSheet(undefined);

    unmount();

    expect(mockedResolve).not.toHaveBeenCalled();
  });
});
