import React from "react";
import { Platform, Text, View } from "react-native";
import { render } from "@testing-library/react-native";
import { QueuedBottomSheet } from ".";
import { QueuedBottomSheetsProvider } from "../QueuedBottomSheetsProvider";
import { useBottomSheetBottomInset } from "../../contexts/BottomSheetBottomInsetContext";

const BOTTOM_INSET = 48;

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: BOTTOM_INSET, left: 0, right: 0 }),
}));

describe("QueuedBottomSheet (native)", () => {
  it("renders its children inside the bottom sheet", () => {
    const { getByTestId } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(getByTestId("sheet")).toBeTruthy();
    expect(getByTestId("sheet-content")).toBeTruthy();
  });

  it("replaces the outgoing sheet during a hand-off", () => {
    const { getByTestId } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(getByTestId("sheet")).toHaveProp("stackBehavior", "replace");
  });

  it("hands a footer to gorhom's footer slot, which keeps it above the keyboard", () => {
    const { getByTestId, rerender } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened footer={<View testID="cta" />}>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    const footerComponent = getByTestId("sheet").props.footerComponent;
    expect(footerComponent).toEqual(expect.any(Function));

    rerender(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet
          testID="sheet"
          isRequestingToBeOpened
          footer={<View testID="updated-cta" />}
        >
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(getByTestId("sheet").props.footerComponent).toBe(footerComponent);
  });

  // gorhom renders the footer under a portal host mounted above the app, so the slot cannot reach
  // the sheet through context. Rendering it detached from the sheet reproduces that.
  it("delivers the footer to a slot rendered outside the sheet's own tree", () => {
    const { getByTestId, rerender } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened footer={<View testID="cta" />}>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    const FooterComponent = getByTestId("sheet").props.footerComponent;
    const detachedSlot = render(<FooterComponent />);

    expect(detachedSlot.getByTestId("cta")).toBeTruthy();

    rerender(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet
          testID="sheet"
          isRequestingToBeOpened
          footer={<View testID="updated-cta" />}
        >
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(detachedSlot.getByTestId("updated-cta")).toBeTruthy();
  });

  it("leaves the footer slot unused when the footer is null", () => {
    const { getByTestId } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened footer={null}>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(getByTestId("sheet").props.footerComponent).toBeUndefined();
  });

  describe("bottom inset left to the content", () => {
    const originalOS = Platform.OS;

    afterEach(() => {
      Platform.OS = originalOS;
    });

    // The Android spacer is a sibling of the content, so dynamic sizing — which measures the
    // content alone — never makes room for it and the sheet still has to pad itself.
    it.each([
      { os: "ios", enableDynamicSizing: true, inset: BOTTOM_INSET },
      { os: "android", enableDynamicSizing: true, inset: BOTTOM_INSET },
      { os: "android", enableDynamicSizing: false, inset: 0 },
    ] as const)("leaves $inset on $os, dynamically sized: $enableDynamicSizing", testCase => {
      Platform.OS = testCase.os;

      expect(renderContentBottomInset({ enableDynamicSizing: testCase.enableDynamicSizing })).toBe(
        testCase.inset,
      );
    });

    it("leaves nothing when the footer already pads over the area", () => {
      expect(renderContentBottomInset({ enableDynamicSizing: true, footer: <View /> })).toBe(0);
    });
  });

  // Keeping gorhom off the Android keyboard leaves the footer free to rise over it on its own,
  // without the two offsets stacking. See QueuedBottomSheetFooter.
  it("matches the manifest, so gorhom leaves the Android keyboard to the window", () => {
    expect(renderSheet().getByTestId("sheet")).toHaveProp(
      "android_keyboardInputMode",
      "adjustResize",
    );
  });
});

function renderContentBottomInset(
  props: Readonly<{ footer?: React.ReactNode; enableDynamicSizing: boolean }>,
): number {
  function InsetProbe() {
    return <Text testID="inset">{useBottomSheetBottomInset()}</Text>;
  }

  const { getByTestId } = render(
    <QueuedBottomSheetsProvider>
      <QueuedBottomSheet testID="sheet" isRequestingToBeOpened {...props}>
        <InsetProbe />
      </QueuedBottomSheet>
    </QueuedBottomSheetsProvider>,
  );

  return Number(getByTestId("inset").props.children);
}

function renderSheet() {
  return render(
    <QueuedBottomSheetsProvider>
      <QueuedBottomSheet testID="sheet" isRequestingToBeOpened>
        <View testID="sheet-content" />
      </QueuedBottomSheet>
    </QueuedBottomSheetsProvider>,
  );
}
