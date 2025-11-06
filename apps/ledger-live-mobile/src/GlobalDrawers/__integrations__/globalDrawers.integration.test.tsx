import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { Text, View } from "react-native";
import GlobalDrawers from "../index";

jest.mock("LLM/features/ModularDrawer/ModularDrawerWrapper", () => ({
  ModularDrawerWrapper: jest.fn(() => <View testID="modular-drawer-wrapper" />),
}));

jest.mock("LLM/features/Receive/ReceiveDrawerWrapper", () => ({
  ReceiveDrawerWrapper: jest.fn(() => <View testID="receive-drawer-wrapper" />),
}));

describe("GlobalDrawers Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children and all drawer wrappers from registry", async () => {
    const { getByTestId } = render(
      <GlobalDrawers>
        <View testID="app-content">
          <Text>App Content</Text>
        </View>
      </GlobalDrawers>,
    );

    expect(getByTestId("app-content")).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
      expect(getByTestId("receive-drawer-wrapper")).toBeTruthy();
    });
  });

  it("should handle multiple drawer wrappers without conflicts", async () => {
    const { getByTestId } = render(
      <GlobalDrawers>
        <View testID="app-content" />
      </GlobalDrawers>,
    );

    await waitFor(() => {
      const modularDrawer = getByTestId("modular-drawer-wrapper");
      const receiveDrawer = getByTestId("receive-drawer-wrapper");

      expect(modularDrawer).toBeTruthy();
      expect(receiveDrawer).toBeTruthy();
    });
  });

  it("should support dynamic children updates while maintaining drawers", async () => {
    const { rerender, getByTestId } = render(
      <GlobalDrawers>
        <Text testID="text-1">Initial Content</Text>
      </GlobalDrawers>,
    );

    expect(getByTestId("text-1")).toBeTruthy();

    rerender(
      <GlobalDrawers>
        <Text testID="text-2">Updated Content</Text>
      </GlobalDrawers>,
    );

    expect(getByTestId("text-2")).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
      expect(getByTestId("receive-drawer-wrapper")).toBeTruthy();
    });
  });

  it("should handle unmounting gracefully", async () => {
    const { unmount, getByTestId } = render(
      <GlobalDrawers>
        <Text testID="content">Content</Text>
      </GlobalDrawers>,
    );

    expect(getByTestId("content")).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
    });

    expect(() => unmount()).not.toThrow();
  });
});
