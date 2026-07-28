import React from "react";
import { Dimensions, Platform } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import type { LargeScreenUpsellDismissMethod } from "../../../analytics";
import { LargeScreenUpsellModalDrawer } from "..";

type MockQueuedDrawerBottomSheetProps = Readonly<{
  children: React.ReactNode;
  onClose?: () => void;
  onHeaderClosePressed?: () => void;
  onBackdropPress?: () => void;
  maxDynamicContentSize?: "fullWithOffset";
}>;

let capturedDrawerProps: MockQueuedDrawerBottomSheetProps | null = null;
const originalPlatformOS = Platform.OS;

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => ({
  __esModule: true,
  default: (props: MockQueuedDrawerBottomSheetProps) => {
    const React = require("react");
    const { BottomSheet } = jest.requireActual("@ledgerhq/lumen-ui-rnative");

    capturedDrawerProps = props;
    return React.createElement(BottomSheet, { snapPoints: ["70%", "90%"] }, props.children);
  },
}));

const content: GenericAwarenessModalFeatureIntro = {
  id: "large-screen-upsell-modal",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "https://example.com/dark.png",
  title: "See more. Tap less. Save 10%",
  subtitle: "Enjoy a larger screen and smarter transaction review.",
  primaryButtonLabel: "Claim offer",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "",
  secondaryButtonLink: "",
  items: [],
  isReady: true,
};

const viewModel: FeatureIntroViewModel = {
  content,
  onPrimaryPress: jest.fn(),
  onSecondaryPress: jest.fn(),
};

function renderLargeScreenUpsellModalDrawer(
  isOpen: boolean,
  onDismiss: (dismissMethod: LargeScreenUpsellDismissMethod) => void = jest.fn(),
  bottomInset = 0,
) {
  return render(
    <LargeScreenUpsellModalDrawer
      isOpen={isOpen}
      onDismiss={onDismiss}
      featureIntroViewModel={viewModel}
      bottomInset={bottomInset}
    />,
  );
}

function pressHeaderClose() {
  capturedDrawerProps?.onHeaderClosePressed?.();
  capturedDrawerProps?.onClose?.();
}

function pressBackdrop() {
  capturedDrawerProps?.onBackdropPress?.();
  capturedDrawerProps?.onClose?.();
}

function panDownToClose() {
  capturedDrawerProps?.onClose?.();
}

describe("LargeScreenUpsellModalDrawer", () => {
  beforeEach(() => {
    capturedDrawerProps = null;
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("should not render drawer content before it is opened", () => {
    renderLargeScreenUpsellModalDrawer(false);

    expect(screen.queryByTestId("large-screen-upsell-modal-drawer")).not.toBeOnTheScreen();
  });

  it("should render drawer content when opened", () => {
    renderLargeScreenUpsellModalDrawer(true);

    expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeOnTheScreen();
  });

  it("should shrink the hero to the space left by the other content", () => {
    renderLargeScreenUpsellModalDrawer(true);

    fireEvent(screen.getByTestId("large-screen-upsell-modal-drawer"), "layout", {
      nativeEvent: { layout: { height: Dimensions.get("window").height } },
    });

    expect(screen.getByTestId("large-screen-upsell-modal-hero-container")).toHaveStyle({
      height: 425,
    });
  });

  it("should exclude the iOS-only bottom inset from hero sizing on Android", () => {
    Platform.OS = "android";
    renderLargeScreenUpsellModalDrawer(true, jest.fn(), 24);

    fireEvent(screen.getByTestId("large-screen-upsell-modal-drawer"), "layout", {
      nativeEvent: { layout: { height: Dimensions.get("window").height } },
    });

    expect(screen.getByTestId("large-screen-upsell-modal-hero-container")).toHaveStyle({
      height: 425,
    });
  });

  it("should leave dynamic content size unconstrained on Android", () => {
    Platform.OS = "android";
    renderLargeScreenUpsellModalDrawer(true);

    expect(capturedDrawerProps?.maxDynamicContentSize).toBeUndefined();
  });

  it("should ignore close signals before the drawer has opened", () => {
    const onDismiss = jest.fn();
    renderLargeScreenUpsellModalDrawer(false, onDismiss);

    panDownToClose();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("should report close button exactly once when the header close button is pressed", () => {
    const onDismiss = jest.fn();
    renderLargeScreenUpsellModalDrawer(true, onDismiss);

    pressHeaderClose();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("close button");
  });

  it("should ignore duplicate close signals for the same opening", () => {
    const onDismiss = jest.fn();
    renderLargeScreenUpsellModalDrawer(true, onDismiss);

    pressHeaderClose();
    pressHeaderClose();
    pressBackdrop();
    panDownToClose();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("close button");
  });

  it("should report outside tap exactly once when the backdrop is pressed", () => {
    const onDismiss = jest.fn();
    renderLargeScreenUpsellModalDrawer(true, onDismiss);

    pressBackdrop();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("outside tap");
  });

  it("should fall back to outside tap when the sheet closes via pan-down gesture", () => {
    const onDismiss = jest.fn();
    renderLargeScreenUpsellModalDrawer(true, onDismiss);

    panDownToClose();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("outside tap");
  });
});
