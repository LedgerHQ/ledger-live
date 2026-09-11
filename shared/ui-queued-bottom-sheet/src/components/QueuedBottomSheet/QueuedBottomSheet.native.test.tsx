import React from "react";
import { Platform, View } from "react-native";
import { render } from "@testing-library/react-native";
import { QueuedBottomSheet } from ".";
import { QueuedBottomSheetsProvider } from "../QueuedBottomSheetsProvider";

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

  describe("keyboard input mode", () => {
    const originalOS = Platform.OS;
    const originalVersion = Platform.Version;

    afterEach(() => {
      Platform.OS = originalOS;
      setPlatformVersion(originalVersion);
    });

    it("makes gorhom offset the keyboard itself on Android 15, which ignores the manifest", () => {
      Platform.OS = "android";
      setPlatformVersion(35);

      expect(renderSheet().getByTestId("sheet")).toHaveProp(
        "android_keyboardInputMode",
        "adjustPan",
      );
    });

    it("leaves the keyboard to the window resize the manifest asks for below Android 15", () => {
      Platform.OS = "android";
      setPlatformVersion(34);

      expect(renderSheet().getByTestId("sheet")).toHaveProp(
        "android_keyboardInputMode",
        "adjustResize",
      );
    });
  });
});

function renderSheet() {
  return render(
    <QueuedBottomSheetsProvider>
      <QueuedBottomSheet testID="sheet" isRequestingToBeOpened>
        <View testID="sheet-content" />
      </QueuedBottomSheet>
    </QueuedBottomSheetsProvider>,
  );
}

function setPlatformVersion(version: typeof Platform.Version) {
  Object.defineProperty(Platform, "Version", { value: version, configurable: true });
}
