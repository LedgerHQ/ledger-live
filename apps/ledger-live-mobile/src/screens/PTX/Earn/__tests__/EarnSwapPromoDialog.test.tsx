import React from "react";
import { render, screen } from "@tests/test-renderer";
import { EarnSwapPromoDialog } from "../EarnSwapPromoDialog";
import { resolveActionDialog } from "~/components/WebPTXPlayer/CustomHandlers";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
    Spot: ({ appearance }: { appearance: string }) => (
      <RN.View testID={`spot-${appearance}`} />
    ),
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

jest.mock("~/components/WebPTXPlayer/CustomHandlers", () => ({
  resolveActionDialog: jest.fn(),
}));

const mockedResolveActionDialog = jest.mocked(resolveActionDialog);

const renderDialog = (actionDialog: State["earn"]["actionDialog"]) =>
  render(<EarnSwapPromoDialog />, {
    overrideInitialState: (state: State) => ({
      ...state,
      earn: {
        ...state.earn,
        actionDialog,
      },
    }),
  });

describe("EarnSwapPromoDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing when action dialog state is undefined", () => {
    const { getByTestId } = renderDialog(undefined);

    expect(getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
  });

  it("passes isRequestingToBeOpened false when action dialog state is undefined", () => {
    renderDialog(undefined);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("passes isRequestingToBeOpened true when action dialog is set", () => {
    renderDialog({
      title: "Swap required",
      description: "You need to swap before staking",
      ctaLabel: "Go to Swap",
    });

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("displays title, description, and CTA label", () => {
    renderDialog({
      title: "Swap required",
      description: "You need to swap before staking",
      ctaLabel: "Go to Swap",
    });

    expect(screen.getByText("Swap required")).toBeTruthy();
    expect(screen.getByText("You need to swap before staking")).toBeTruthy();
    expect(screen.getByText("Go to Swap")).toBeTruthy();
  });

  it("renders spot with correct appearance based on icon", () => {
    renderDialog({
      title: "Warning",
      description: "Something happened",
      ctaLabel: "OK",
      icon: "warning",
    });

    expect(screen.getByTestId("spot-warning")).toBeTruthy();
  });

  it("renders spot with info appearance when icon is not set", () => {
    renderDialog({
      title: "Info",
      description: "Some info",
      ctaLabel: "OK",
    });

    expect(screen.getByTestId("spot-info")).toBeTruthy();
  });

  it("renders spot with check appearance for success icon", () => {
    renderDialog({
      title: "Success",
      description: "Done",
      ctaLabel: "OK",
      icon: "success",
    });

    expect(screen.getByTestId("spot-check")).toBeTruthy();
  });

  it("calls resolveActionDialog(false) when close is pressed", async () => {
    const { user } = renderDialog({
      title: "Title",
      description: "Description",
      ctaLabel: "CTA",
    });

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolveActionDialog).toHaveBeenCalledWith(false);
  });

  it("calls resolveActionDialog(true) when CTA button is pressed", async () => {
    const { user } = renderDialog({
      title: "Title",
      description: "Description",
      ctaLabel: "Confirm",
    });

    await user.press(screen.getByText("Confirm"));

    expect(mockedResolveActionDialog).toHaveBeenCalledWith(true);
  });

  it("only calls resolveActionDialog once on multiple close presses", async () => {
    const { user } = renderDialog({
      title: "Title",
      description: "Description",
      ctaLabel: "CTA",
    });

    await user.press(screen.getByTestId("close-bottom-sheet"));
    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolveActionDialog).toHaveBeenCalledTimes(1);
  });

  it("only calls resolveActionDialog once when CTA then close are pressed", async () => {
    const { user } = renderDialog({
      title: "Title",
      description: "Description",
      ctaLabel: "Confirm",
    });

    await user.press(screen.getByText("Confirm"));
    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(mockedResolveActionDialog).toHaveBeenCalledTimes(1);
    expect(mockedResolveActionDialog).toHaveBeenCalledWith(true);
  });
});
