import React from "react";
import { act, render, waitFor } from "@tests/test-renderer";
import { Text, View } from "react-native";
import GlobalDrawers from "../index";
import { openModularDrawer, closeModularDrawer } from "~/reducers/modularDrawer";
import { openReceiveOptionsDrawer } from "~/reducers/receiveOptionsDrawer";

jest.mock("LLM/features/ModularDrawer/ModularDrawerWrapper", () => ({
  ModularDrawerWrapper: jest.fn(() => <View testID="modular-drawer-wrapper" />),
}));

jest.mock("LLM/features/Receive/drawers/ReceiveFundsOptionsDrawer", () =>
  jest.fn(() => <View testID="receive-drawer-wrapper" />),
);

describe("GlobalDrawers Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children but not mount drawer wrappers before first open", () => {
    const { getByTestId, queryByTestId } = render(
      <GlobalDrawers>
        <View testID="app-content">
          <Text>App Content</Text>
        </View>
      </GlobalDrawers>,
    );

    expect(getByTestId("app-content")).toBeTruthy();
    expect(queryByTestId("modular-drawer-wrapper")).toBeNull();
    expect(queryByTestId("receive-drawer-wrapper")).toBeNull();
  });

  it("should mount a drawer wrapper after its Redux open action is dispatched", async () => {
    const { getByTestId, queryByTestId, store } = render(
      <GlobalDrawers>
        <View testID="app-content" />
      </GlobalDrawers>,
    );

    expect(queryByTestId("modular-drawer-wrapper")).toBeNull();

    act(() => {
      store.dispatch(openModularDrawer({}));
    });

    await waitFor(() => {
      expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
    });
  });

  it("should keep a drawer mounted after it is closed so animations and cleanup work", async () => {
    const { getByTestId, store } = render(
      <GlobalDrawers>
        <View testID="app-content" />
      </GlobalDrawers>,
    );

    act(() => {
      store.dispatch(openModularDrawer({}));
    });

    await waitFor(() => {
      expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
    });

    act(() => {
      store.dispatch(closeModularDrawer());
    });

    expect(getByTestId("modular-drawer-wrapper")).toBeTruthy();
  });

  it("should mount drawers independently of each other", async () => {
    const { getByTestId, queryByTestId, store } = render(
      <GlobalDrawers>
        <View testID="app-content" />
      </GlobalDrawers>,
    );

    expect(queryByTestId("modular-drawer-wrapper")).toBeNull();
    expect(queryByTestId("receive-drawer-wrapper")).toBeNull();

    act(() => {
      store.dispatch(openReceiveOptionsDrawer({ sourceScreenName: "test" }));
    });

    await waitFor(() => {
      expect(getByTestId("receive-drawer-wrapper")).toBeTruthy();
    });

    expect(queryByTestId("modular-drawer-wrapper")).toBeNull();
  });

  it("should support dynamic children updates", () => {
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
  });

  it("should handle unmounting gracefully", () => {
    const { unmount, getByTestId } = render(
      <GlobalDrawers>
        <Text testID="content">Content</Text>
      </GlobalDrawers>,
    );

    expect(getByTestId("content")).toBeTruthy();
    expect(() => unmount()).not.toThrow();
  });
});
